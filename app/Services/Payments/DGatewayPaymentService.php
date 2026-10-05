<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\PaymentAttempt;
use App\Models\StoreSetting;
use App\Services\Orders\OrderPaymentLifecycle;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class DGatewayPaymentService
{
    public function __construct(private DGatewayClient $client, private OrderPaymentLifecycle $lifecycle) {}

    public function ready(): bool
    {
        return $this->client->ready();
    }

    /** @return array<string, mixed> */
    public function start(Order $order, string $phone, string $method): array
    {
        if (! $this->ready()) {
            $this->reject('Online payments are not configured yet.');
        }
        $provider = $method === 'card' ? 'stripe' : (string) config('services.dgateway.mobile_provider', 'iotec');
        if ($method === 'card' && ! config('services.dgateway.cards_enabled')) {
            $this->reject('Card payments are not enabled.');
        }
        $phone = preg_replace('/[\s()+-]/', '', $phone);
        if ($method !== 'card' && ! preg_match('/^(0\d{9}|(?:256|254|255|250)\d{9})$/', $phone)) {
            throw ValidationException::withMessages(['phone' => 'Enter your mobile-money number, including its country code.']);
        }

        [$attempt, $created] = DB::transaction(function () use ($order, $provider) {
            $locked = Order::lockForUpdate()->findOrFail($order->id);
            if ($locked->payment_method === 'pay_at_shop') {
                $this->reject('This order is payable at the shop when you collect it.');
            }
            if ($locked->total !== $order->total) {
                $this->reject('Your order total changed. Reload to review it before paying.');
            }
            if ($locked->delivery_fee_status !== 'confirmed') {
                $this->reject('Your delivery fee must be confirmed before payment.');
            }
            if ($locked->payment_provider && $locked->payment_provider !== 'dgateway') {
                $this->reject('This order uses a retired payment provider. Please contact Ellena to reconcile it.');
            }
            if (in_array($locked->payment_status, ['paid', 'refunded'], true) || ($locked->status === 'cancelled' && $locked->payment_status !== 'expired')) {
                $this->reject('This order cannot accept another payment.');
            }
            $active = PaymentAttempt::where('order_id', $locked->id)->whereIn('status', ['initiating', 'unknown', 'pending'])->latest('id')->first();
            if ($active) {
                if ($active->status !== 'pending') {
                    $this->reject('Your last payment request is still being checked. Please contact Ellena before trying again.');
                }

                return [$active, false];
            }
            if ($locked->resources_released_at || in_array($locked->payment_status, ['failed', 'expired'], true)) {
                $locked = $this->lifecycle->reactivate($locked);
            }
            $currency = $locked->currency ?: StoreSetting::currency();
            if ($provider === 'iotec' && $currency !== 'UGX') {
                $this->reject('Mobile money is not configured for this currency.');
            }
            $locked->forceFill(['payment_method' => 'dgateway', 'payment_provider' => 'dgateway', 'currency' => $currency, 'expires_at' => now()->addMinutes((int) config('checkout.unpaid_order_expiry_minutes', 30))])->save();
            $attempt = PaymentAttempt::create(['order_id' => $locked->id, 'request_id' => (string) Str::uuid(), 'provider' => $provider, 'amount' => $locked->total, 'currency' => $currency, 'status' => 'initiating']);

            return [$attempt, true];
        });
        if (! $created) {
            $this->refresh($attempt, 'customer');

            return $this->presentation($attempt->fresh());
        }
        try {
            $data = $this->client->collect([
                'amount' => (float) $attempt->amount, 'currency' => $attempt->currency,
                'phone_number' => $method === 'card' ? '0000000000' : $phone,
                'provider' => $attempt->provider, 'description' => 'Ellena order '.$order->number,
                'callback_url' => config('services.dgateway.webhook_url'),
                'metadata' => ['order_number' => $order->number, 'request_id' => $attempt->request_id],
            ]);
            DB::transaction(function () use ($attempt, $data, $order) {
                $locked = Order::lockForUpdate()->findOrFail($order->id);
                $attempt->update(['reference' => $data['reference'], 'status' => 'pending', 'client_secret' => $data['client_secret'] ?? null, 'publishable_key' => $data['stripe_publishable_key'] ?? null]);
                $locked->forceFill(['payment_reference' => $data['reference'], 'payment_merchant_reference' => $attempt->request_id, 'payment_status_message' => 'Payment requested. Awaiting confirmation.'])->save();
                $locked->paymentEvents()->create(['source' => 'checkout', 'status' => 'pending', 'message' => 'D-Gateway payment requested.', 'reference' => $data['reference']]);
            });
        } catch (Throwable $exception) {
            if ($exception instanceof RequestException && in_array($exception->response->status(), [401, 403], true)) {
                // An authentication rejection is definitive: the provider did not collect funds.
                $attempt->update(['status' => 'rejected']);
                $this->reject('Online payments are temporarily unavailable. Please contact Ellena.');
            }
            // Retain uncertainty instead of allowing another potentially duplicate charge.
            $attempt->update(['status' => 'unknown']);
            $this->reject('We could not confirm whether the payment request was accepted. Please contact Ellena before retrying.');
        }

        return $this->presentation($attempt->fresh());
    }

    public function refresh(PaymentAttempt $attempt, string $source = 'reconciliation'): void
    {
        if (! $attempt->reference) {
            return;
        }
        $data = $this->client->verify($attempt->reference);
        if ($data['reference'] !== $attempt->reference
            || strtoupper((string) ($data['currency'] ?? '')) !== $attempt->currency
            || ! is_numeric($data['amount'] ?? null)
            || (int) round((float) $data['amount'] * 100) !== (int) round((float) $attempt->amount * 100)
            || (isset($data['direction']) && $data['direction'] !== 'collect')) {
            $this->reject('The verified payment does not match this order.');
        }
        $status = match (strtolower((string) ($data['status'] ?? ''))) {
            'completed' => 'paid', 'failed' => 'failed', default => 'pending',
        };
        DB::transaction(function () use ($attempt, $status, $source) {
            $order = Order::lockForUpdate()->findOrFail($attempt->order_id);
            if ((float) $order->total !== (float) $attempt->amount || ($order->currency && $order->currency !== $attempt->currency)) {
                $this->reject('The payment amount no longer matches the order.');
            }
            $current = PaymentAttempt::lockForUpdate()->findOrFail($attempt->id);
            if ($current->status === 'paid' && $status !== 'paid') {
                return;
            }
            $current->update(['status' => $status]);
            // Old failed attempts must not overwrite a newer attempt; late success still counts.
            if ($status !== 'paid' && $order->payment_reference !== $attempt->reference) {
                return;
            }
            if ($order->payment_status === 'paid' && $order->payment_reference !== $attempt->reference) {
                if ($status === 'paid') {
                    $order->forceFill(['status' => 'payment_review', 'payment_status_message' => 'Multiple completed payments require reconciliation.'])->save();
                }

                return;
            }
            $this->lifecycle->apply($order, $status, [
                'payment_reference' => $attempt->reference,
                'payment_confirmation_code' => $status === 'paid' ? $attempt->reference : $order->payment_confirmation_code,
                'payment_status_message' => $status === 'failed' ? 'Payment was declined. Please check your account and try again.' : ($status === 'paid' ? 'Payment verified by D-Gateway.' : 'Awaiting payment confirmation.'),
                'expires_at' => $status === 'paid' ? null : $order->expires_at,
            ], $source);
        });
    }

    /** @return array<string, mixed> */
    public function presentation(PaymentAttempt $attempt): array
    {
        return ['status' => $attempt->status, 'provider' => $attempt->provider, 'client_secret' => $attempt->status === 'pending' ? $attempt->client_secret : null, 'publishable_key' => $attempt->publishable_key];
    }

    private function reject(string $message): never
    {
        throw ValidationException::withMessages(['payment' => $message]);
    }
}

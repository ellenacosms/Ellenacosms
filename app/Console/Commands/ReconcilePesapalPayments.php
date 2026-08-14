<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\Orders\OrderPaymentLifecycle;
use App\Services\Payments\PesapalPaymentService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class ReconcilePesapalPayments extends Command
{
    protected $signature = 'pesapal:reconcile {--limit=50 : Maximum orders to check}';

    protected $description = 'Verify pending and recently expired Pesapal payments';

    public function handle(PesapalPaymentService $pesapal, OrderPaymentLifecycle $lifecycle): int
    {
        $limit = max(1, min(500, (int) $this->option('limit')));
        $expiryMinutes = (int) config('checkout.unpaid_order_expiry_minutes', 30);
        $checked = 0;
        $updated = 0;
        $errors = 0;

        $orders = Order::query()
            ->where('payment_provider', 'pesapal')
            ->where(function ($query): void {
                $query->where('payment_status', 'pending')
                    ->orWhere(function ($expired): void {
                        $expired->where('payment_status', 'expired')
                            ->where('expired_at', '>=', now()->subDays(7));
                    });
            })
            ->where(fn ($query) => $query
                ->whereNull('payment_checked_at')
                ->orWhere('payment_checked_at', '<=', now()->subMinutes(2)))
            ->orderByRaw('payment_checked_at IS NULL DESC')
            ->orderBy('payment_checked_at')
            ->limit($limit)
            ->get();

        foreach ($orders as $order) {
            $checked++;
            $expiresAt = $order->expires_at ?? $order->created_at?->copy()->addMinutes($expiryMinutes);

            if (! $order->expires_at && $expiresAt) {
                $order->forceFill(['expires_at' => $expiresAt])->save();
            }

            $trackingId = (string) $order->payment_reference;
            $merchantReference = (string) $order->payment_merchant_reference;

            if (Str::isUuid($trackingId) && $merchantReference !== '') {
                try {
                    $previousStatus = $order->payment_status;
                    $pesapal->refresh($order, $trackingId, $merchantReference, 'reconciliation');
                    $order->refresh();
                    $updated += $previousStatus !== $order->payment_status ? 1 : 0;
                } catch (Throwable $exception) {
                    $errors++;
                    $order->forceFill(['payment_checked_at' => now()])->save();
                    Log::warning('Scheduled Pesapal reconciliation failed.', [
                        'order_id' => $order->id,
                        'exception' => $exception::class,
                        'message' => $exception->getMessage(),
                    ]);

                    continue;
                }
            }

            if ($order->payment_status === 'pending' && $expiresAt?->isPast()) {
                $lifecycle->expire($order);
                $updated++;
            }
        }

        $this->info("Checked {$checked} order(s); updated {$updated}; errors {$errors}.");

        return self::SUCCESS;
    }
}

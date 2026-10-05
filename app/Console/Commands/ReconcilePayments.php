<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\PaymentAttempt;
use App\Services\Orders\OrderPaymentLifecycle;
use App\Services\Payments\DGatewayPaymentService;
use Illuminate\Console\Command;
use Throwable;

class ReconcilePayments extends Command
{
    protected $signature = 'payments:reconcile {--limit=50}';

    protected $description = 'Verify D-Gateway transactions and release expired unpaid reservations';

    public function handle(DGatewayPaymentService $payments, OrderPaymentLifecycle $lifecycle): int
    {
        $limit = max(1, min(500, (int) $this->option('limit')));
        $errors = 0;
        $attempts = PaymentAttempt::whereIn('status', ['pending', 'failed'])->whereNotNull('reference')
            ->where('created_at', '>=', now()->subDays(7))->orderBy('updated_at')->limit($limit)->get();
        foreach ($attempts as $attempt) {
            try {
                $payments->refresh($attempt);
            } catch (Throwable $exception) {
                $errors++;
            } finally {
                $attempt->touch();
            }
        }
        foreach (Order::whereIn('payment_status', ['pending'])->where('expires_at', '<=', now())
            ->where(fn ($q) => $q->whereNull('payment_provider')->orWhere('payment_provider', 'dgateway'))
            ->limit($limit)->get() as $order) {
            $lifecycle->expire($order);
        }
        $this->info('Payment reconciliation completed; verification errors: '.$errors);

        return $errors ? self::FAILURE : self::SUCCESS;
    }
}

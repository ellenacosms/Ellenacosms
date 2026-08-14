<?php

namespace App\Jobs;

use App\Mail\OrderPaymentConfirmed;
use App\Models\Order;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendOrderPaymentConfirmation implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public int $uniqueFor = 3600;

    public function __construct(public int $orderId) {}

    public function uniqueId(): string
    {
        return (string) $this->orderId;
    }

    /** @return array<int, int> */
    public function backoff(): array
    {
        return [60, 300, 900];
    }

    public function handle(): void
    {
        $order = Order::query()->with('items')->find($this->orderId);

        if (! $order || $order->payment_status !== 'paid' || $order->confirmation_sent_at) {
            return;
        }

        Mail::to($order->email)->send(new OrderPaymentConfirmed($order));

        Order::query()
            ->whereKey($order->id)
            ->whereNull('confirmation_sent_at')
            ->update(['confirmation_sent_at' => now()]);
    }
}

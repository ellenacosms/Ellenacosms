<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendOrderEventWebhook;
use App\Models\Order;
use App\Services\Orders\OrderPaymentLifecycle;
use App\Services\Payments\PesapalPaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('admin/orders/index', [
            'orders' => Order::when($request->string('status')->isNotEmpty(), fn ($query) => $query->where('status', $request->string('status')))
                ->latest()->paginate(15)->withQueryString(),
            'status' => $request->string('status'),
        ]);
    }

    public function show(Order $order): Response
    {
        return Inertia::render('admin/orders/show', [
            'order' => $order->load(['items', 'paymentEvents']),
        ]);
    }

    public function update(Request $request, Order $order, OrderPaymentLifecycle $lifecycle): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['pending', 'payment_review', 'processing', 'shipped', 'delivered', 'cancelled'])],
            'payment_status' => ['required', Rule::in(['pending', 'paid', 'failed', 'expired', 'refunded'])],
        ]);

        if ($order->payment_provider === 'pesapal' && $data['payment_status'] !== $order->payment_status) {
            throw ValidationException::withMessages([
                'payment_status' => 'Pesapal status must be verified with the refresh action.',
            ]);
        }

        $statusChanged = $data['status'] !== $order->status;
        $order->update(['status' => $data['status']]);

        if ($statusChanged) {
            SendOrderEventWebhook::dispatch($order->id, 'order.status_changed');
        }

        if ($data['payment_status'] !== $order->payment_status) {
            $lifecycle->apply($order, $data['payment_status'], [
                'payment_status_message' => 'Payment status updated by an administrator.',
            ], 'admin');
        }

        return back()->with('success', 'Order updated.');
    }

    public function refreshPayment(Order $order, PesapalPaymentService $pesapal): RedirectResponse
    {
        if ($order->payment_provider !== 'pesapal'
            || ! $order->payment_reference
            || ! $order->payment_merchant_reference) {
            return back()->withErrors(['payment' => 'This order has no Pesapal payment to verify.']);
        }

        try {
            $pesapal->refresh(
                $order,
                $order->payment_reference,
                $order->payment_merchant_reference,
                'admin',
            );

            return back()->with('success', 'Payment status verified with Pesapal.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->withErrors(['payment' => 'Pesapal status could not be verified right now.']);
        }
    }
}

import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle, RefreshCw } from 'lucide-react';
import { money } from '@/lib/money';
import type { Order } from '@/types';

export default function OrderDetail({
    order,
    uncertainPayment,
}: {
    order: Order;
    uncertainPayment?: { request_id: string } | null;
}) {
    const pickup = useForm<{ pickup: string }>({ pickup: '' });
    const recovery = useForm({ reference: '' });
    const form = useForm({
        status: order.status,
        payment_status: order.payment_status,
    });
    const quote = useForm({
        shipping:
            order.delivery_fee_status === 'awaiting_quote'
                ? ''
                : order.shipping,
        estimated_delivery_date:
            order.estimated_delivery_date?.slice(0, 10) ?? '',
    });
    const paymentRefresh = useForm({ payment: '' });

    return (
        <>
            <Head title={`Order ${order.number}`} />
            <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                    <Link href="/admin/orders" className="admin-eyebrow">
                        ← All orders
                    </Link>
                    <h1 className="admin-title mt-3">{order.number}</h1>
                    <p className="mt-2 text-sm text-stone-500">
                        Placed {new Date(order.created_at).toLocaleString()}
                    </p>
                </div>
                <button
                    onClick={() => form.put(`/admin/orders/${order.id}`)}
                    className="admin-button"
                >
                    Save order
                </button>
            </div>
            {order.payment_method === 'pay_at_shop' && (
                <section className="admin-card mt-7 space-y-3 p-6">
                    <h2 className="admin-section-title">
                        Pay at shop - Pickup code {order.number}
                    </h2>
                    <p>
                        Match the code and customer details, receive{' '}
                        {money(order.total, order.currency)}, then record
                        collection below.
                    </p>
                    {order.status === 'delivered' ? (
                        <p>Collection already recorded.</p>
                    ) : (
                        <button
                            className="admin-button"
                            disabled={
                                pickup.processing ||
                                ['cancelled', 'payment_review'].includes(
                                    order.status,
                                ) ||
                                ['expired', 'failed', 'refunded'].includes(
                                    order.payment_status,
                                )
                            }
                            onClick={() =>
                                pickup.post(
                                    `/admin/orders/${order.id}/collect-pickup`,
                                )
                            }
                        >
                            Record payment received and collected
                        </button>
                    )}
                    {pickup.errors.pickup && (
                        <p role="alert" className="text-red-700">
                            {pickup.errors.pickup}
                        </p>
                    )}
                </section>
            )}
            <div className="mt-9 grid gap-6 xl:grid-cols-[1fr_360px]">
                <section className="admin-card p-0">
                    <div className="border-b border-black/10 p-6">
                        <h2 className="admin-section-title">Items</h2>
                    </div>
                    <div className="divide-y divide-black/10">
                        {order.items?.map((item) => (
                            <div
                                key={item.id}
                                className="grid grid-cols-[1fr_auto] gap-5 p-6"
                            >
                                <div>
                                    <p className="font-semibold">
                                        {item.product_name}
                                    </p>
                                    <p className="mt-1 text-xs text-stone-500">
                                        {item.sku} · {item.quantity} ×{' '}
                                        {money(item.price)}
                                    </p>
                                </div>
                                <p className="font-semibold">
                                    {money(item.total)}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="ml-auto w-full max-w-sm space-y-3 border-t border-black/10 p-6 text-sm">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{money(order.subtotal, order.currency)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Delivery</span>
                            <span>
                                {order.delivery_fee_status === 'awaiting_quote'
                                    ? 'To be confirmed'
                                    : money(order.shipping, order.currency)}
                            </span>
                        </div>
                        {Number(order.discount_amount) > 0 && (
                            <div className="flex justify-between text-emerald-700">
                                <span>
                                    Discount{' '}
                                    {order.discount_code &&
                                        `(${order.discount_code})`}
                                </span>
                                <span>
                                    -
                                    {money(
                                        order.discount_amount,
                                        order.currency,
                                    )}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-black/10 pt-4 text-base font-semibold">
                            <span>Total</span>
                            <span>{money(order.total, order.currency)}</span>
                        </div>
                    </div>
                    <div className="border-t border-black/10 p-6">
                        <h2 className="admin-section-title">
                            Payment timeline
                        </h2>
                        <div className="mt-5 space-y-4">
                            {order.payment_events?.length ? (
                                order.payment_events.map((event) => (
                                    <div
                                        key={event.id}
                                        className="border-l border-black/15 pl-4 text-xs leading-5"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="font-semibold capitalize">
                                                {event.status}
                                            </p>
                                            <time className="text-stone-400">
                                                {new Date(
                                                    event.created_at,
                                                ).toLocaleString()}
                                            </time>
                                        </div>
                                        <p className="mt-1 text-stone-500">
                                            {event.message ||
                                                'Payment status updated.'}
                                        </p>
                                        <p className="mt-1 text-[10px] font-semibold tracking-wider text-stone-400 uppercase">
                                            Source: {event.source}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-stone-500">
                                    No payment events recorded yet.
                                </p>
                            )}
                        </div>
                    </div>
                </section>
                <div className="space-y-6">
                    {uncertainPayment && (
                        <form
                            className="admin-card space-y-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                recovery.post(
                                    `/admin/orders/${order.id}/payment/recover`,
                                );
                            }}
                        >
                            <h2 className="admin-section-title">
                                Payment needs review
                            </h2>
                            <p className="text-sm">
                                Find this exact request in the D-Gateway
                                dashboard before linking its transaction.
                                Request: {uncertainPayment.request_id}
                            </p>
                            <label className="admin-field">
                                <span>Verified collection reference</span>
                                <input
                                    required
                                    value={recovery.data.reference}
                                    onChange={(e) =>
                                        recovery.setData(
                                            'reference',
                                            e.target.value,
                                        )
                                    }
                                />
                            </label>
                            {recovery.errors.reference && (
                                <p role="alert" className="text-red-700">
                                    {recovery.errors.reference}
                                </p>
                            )}
                            <button
                                className="admin-button"
                                disabled={recovery.processing}
                            >
                                Recover payment
                            </button>
                        </form>
                    )}
                    {order.delivery_method !== 'pickup' &&
                        order.payment_status !== 'paid' &&
                        order.payment_status !== 'refunded' &&
                        !order.payment_reference &&
                        !order.resources_released_at && (
                            <form
                                className="admin-card space-y-4"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    quote.post(
                                        `/admin/orders/${order.id}/delivery-quote`,
                                    );
                                }}
                            >
                                <h2 className="admin-section-title">
                                    Delivery quote
                                </h2>
                                <p className="text-sm">
                                    {order.delivery_area} ·{' '}
                                    {order.delivery_fee_status.replaceAll(
                                        '_',
                                        ' ',
                                    )}
                                </p>
                                <label className="admin-field">
                                    <span>Delivery fee</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        value={quote.data.shipping}
                                        onChange={(e) =>
                                            quote.setData(
                                                'shipping',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </label>
                                <label className="admin-field">
                                    <span>Estimated delivery date</span>
                                    <input
                                        type="date"
                                        value={
                                            quote.data.estimated_delivery_date
                                        }
                                        onChange={(e) =>
                                            quote.setData(
                                                'estimated_delivery_date',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </label>
                                {Object.values(quote.errors).map((error) => (
                                    <p
                                        key={error}
                                        role="alert"
                                        className="text-sm text-red-700"
                                    >
                                        {error}
                                    </p>
                                ))}
                                <button
                                    className="admin-button"
                                    disabled={quote.processing}
                                >
                                    Confirm fee and email payment link
                                </button>
                            </form>
                        )}
                    <section className="admin-card">
                        <h2 className="admin-section-title">Order status</h2>
                        <div className="mt-6 space-y-5">
                            <label className="admin-field">
                                <span>Fulfilment</span>
                                <select
                                    value={form.data.status}
                                    onChange={(e) =>
                                        form.setData('status', e.target.value)
                                    }
                                >
                                    {[
                                        'pending',
                                        'payment_review',
                                        'processing',
                                        'shipped',
                                        'delivered',
                                        'cancelled',
                                    ].map((value) => (
                                        <option key={value}>{value}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="admin-field">
                                <span>Payment</span>
                                <select
                                    value={form.data.payment_status}
                                    disabled={Boolean(order.payment_provider)}
                                    onChange={(e) =>
                                        form.setData(
                                            'payment_status',
                                            e.target.value,
                                        )
                                    }
                                >
                                    {[
                                        'pending',
                                        'paid',
                                        'failed',
                                        'expired',
                                        'refunded',
                                    ].map((value) => (
                                        <option key={value}>{value}</option>
                                    ))}
                                </select>
                            </label>
                            {order.payment_provider && (
                                <div className="border-t border-black/10 pt-4 text-xs leading-6 text-stone-500">
                                    <p className="font-semibold text-black capitalize">
                                        {order.payment_provider}
                                    </p>
                                    {order.payment_confirmation_code && (
                                        <p>
                                            Confirmation{' '}
                                            {order.payment_confirmation_code}
                                        </p>
                                    )}
                                    {order.payment_status_message && (
                                        <p>{order.payment_status_message}</p>
                                    )}
                                    {order.payment_checked_at && (
                                        <p>
                                            Last verified{' '}
                                            {new Date(
                                                order.payment_checked_at,
                                            ).toLocaleString()}
                                        </p>
                                    )}
                                    {order.resources_released_at && (
                                        <p className="text-amber-700">
                                            Inventory reservation released
                                        </p>
                                    )}
                                    <button
                                        type="button"
                                        disabled={paymentRefresh.processing}
                                        onClick={() =>
                                            paymentRefresh.post(
                                                `/admin/orders/${order.id}/payment/refresh`,
                                                { preserveScroll: true },
                                            )
                                        }
                                        className="admin-button mt-4 flex items-center gap-2 disabled:cursor-wait disabled:opacity-50"
                                    >
                                        {paymentRefresh.processing ? (
                                            <LoaderCircle
                                                size={14}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <RefreshCw size={14} />
                                        )}
                                        Verify payment
                                    </button>
                                    {paymentRefresh.errors.payment && (
                                        <p className="mt-2 text-red-600">
                                            {paymentRefresh.errors.payment}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                    <section className="admin-card">
                        <h2 className="admin-section-title">Customer</h2>
                        <div className="mt-5 space-y-2 text-sm">
                            <p className="font-semibold">
                                {order.customer_name}
                            </p>
                            <p className="text-stone-500">{order.email}</p>
                            <p className="text-stone-500">{order.phone}</p>
                            <p className="pt-4 leading-6">
                                {order.address}
                                <br />
                                {order.city}, {order.country}
                            </p>
                            {order.notes && (
                                <p className="mt-4 border-t border-black/10 pt-4 text-stone-500">
                                    {order.notes}
                                </p>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

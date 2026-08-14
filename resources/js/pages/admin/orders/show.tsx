import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle, RefreshCw } from 'lucide-react';
import { money } from '@/lib/money';
import type { Order } from '@/types';

export default function OrderDetail({ order }: { order: Order }) {
    const form = useForm({
        status: order.status,
        payment_status: order.payment_status,
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
                            <span>{money(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Delivery</span>
                            <span>{money(order.shipping)}</span>
                        </div>
                        {Number(order.discount_amount) > 0 && (
                            <div className="flex justify-between text-emerald-700">
                                <span>
                                    Discount{' '}
                                    {order.discount_code &&
                                        `(${order.discount_code})`}
                                </span>
                                <span>-{money(order.discount_amount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-black/10 pt-4 text-base font-semibold">
                            <span>Total</span>
                            <span>{money(order.total)}</span>
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
                                    disabled={
                                        order.payment_provider === 'pesapal'
                                    }
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
                                        Verify with Pesapal
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

import { Head, Link, router } from '@inertiajs/react';
import { money } from '@/lib/money';
import type { Order, Pagination } from '@/types';

export default function Orders({
    orders,
    status,
}: {
    orders: Pagination<Order>;
    status: string;
}) {
    return (
        <>
            <Head title="Orders" />
            <div>
                <p className="admin-eyebrow">Commerce</p>
                <h1 className="admin-title">Orders</h1>
                <p className="mt-2 text-sm text-stone-500">
                    {orders.total} orders placed.
                </p>
            </div>
            <section className="admin-card mt-9 p-0">
                <div className="flex flex-wrap gap-2 border-b border-black/10 p-5">
                    {[
                        '',
                        'pending',
                        'processing',
                        'shipped',
                        'delivered',
                        'cancelled',
                    ].map((item) => (
                        <button
                            key={item}
                            onClick={() =>
                                router.get(
                                    '/admin/orders',
                                    item ? { status: item } : {},
                                    { preserveState: true },
                                )
                            }
                            className={`rounded-full px-4 py-2 text-xs font-semibold capitalize ${status === item ? 'bg-black text-white' : 'bg-stone-100'}`}
                        >
                            {item || 'All'}
                        </button>
                    ))}
                </div>
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.data.map((order) => (
                                <tr key={order.id}>
                                    <td>
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="font-semibold underline-offset-4 hover:underline"
                                        >
                                            {order.number}
                                        </Link>
                                    </td>
                                    <td>
                                        {new Date(
                                            order.created_at,
                                        ).toLocaleDateString()}
                                    </td>
                                    <td>
                                        {order.customer_name}
                                        <small>{order.email}</small>
                                    </td>
                                    <td>
                                        <span
                                            className={`status status-${order.payment_status === 'paid' ? 'delivered' : 'pending'}`}
                                        >
                                            {order.payment_status}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            className={`status status-${order.status}`}
                                        >
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="font-semibold">
                                        {money(order.total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end gap-2 border-t border-black/10 p-5">
                    {orders.prev_page_url && (
                        <Link
                            href={orders.prev_page_url}
                            className="admin-secondary"
                        >
                            Previous
                        </Link>
                    )}
                    {orders.next_page_url && (
                        <Link
                            href={orders.next_page_url}
                            className="admin-secondary"
                        >
                            Next
                        </Link>
                    )}
                </div>
            </section>
        </>
    );
}

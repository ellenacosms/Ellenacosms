import { Head, Link } from '@inertiajs/react';
import { ReceiptText, ShoppingBag, WalletCards } from 'lucide-react';
import { money } from '@/lib/money';
import type { Customer, Order } from '@/types';

export default function CustomerProfile({
    customer,
    orders,
    metrics,
}: {
    customer: Customer;
    orders: Order[];
    metrics: { orders: number; spent: number; average: number };
}) {
    return (
        <>
            <Head title={customer.name} />
            <Link href="/admin/customers" className="admin-eyebrow">
                ← Customers
            </Link>
            <div className="mt-4">
                <h1 className="admin-title">{customer.name}</h1>
                <p className="mt-2 text-sm text-stone-500">{customer.email}</p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                    {
                        label: 'Orders placed',
                        value: metrics.orders,
                        icon: ShoppingBag,
                    },
                    {
                        label: 'Lifetime value',
                        value: money(metrics.spent),
                        icon: WalletCards,
                    },
                    {
                        label: 'Average order',
                        value: money(metrics.average),
                        icon: ReceiptText,
                    },
                ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="admin-card">
                        <div className="flex items-center justify-between text-stone-500">
                            <span className="text-xs font-semibold tracking-wider uppercase">
                                {label}
                            </span>
                            <Icon size={18} />
                        </div>
                        <p className="mt-6 text-3xl font-semibold">{value}</p>
                    </div>
                ))}
            </div>
            <section className="admin-card mt-6 p-0">
                <div className="border-b border-black/10 p-6">
                    <h2 className="admin-section-title">Order history</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Items</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td>
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="font-semibold hover:underline"
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
                                        <span
                                            className={`status status-${order.status}`}
                                        >
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>
                                        {order.items?.reduce(
                                            (total, item) =>
                                                total + item.quantity,
                                            0,
                                        ) ?? 0}
                                    </td>
                                    <td className="font-semibold">
                                        {money(order.total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!orders.length && (
                    <div className="p-12 text-center text-sm text-stone-500">
                        This customer has not placed an order yet.
                    </div>
                )}
            </section>
        </>
    );
}

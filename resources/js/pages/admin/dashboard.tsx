import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BadgePercent,
    Banknote,
    MessageSquareText,
    Package,
    PackageSearch,
    Settings,
    ShoppingBag,
    Users,
} from 'lucide-react';
import { money } from '@/lib/money';
import type { Order, Product } from '@/types';

export default function Dashboard({
    stats,
    recentOrders,
    lowStock,
}: {
    stats: {
        revenue: number;
        orders: number;
        products: number;
        customers: number;
    };
    recentOrders: Order[];
    lowStock: Product[];
}) {
    const cards = [
        {
            label: 'Total revenue',
            value: money(stats.revenue),
            icon: Banknote,
        },
        { label: 'Orders', value: stats.orders, icon: ShoppingBag },
        { label: 'Products', value: stats.products, icon: Package },
        { label: 'Customers', value: stats.customers, icon: Users },
    ];
    const modules = [
        {
            label: 'Products',
            detail: 'Create, edit, price, and publish',
            href: '/admin/products',
            icon: Package,
        },
        {
            label: 'Inventory',
            detail: 'Track stock and availability',
            href: '/admin/inventory',
            icon: PackageSearch,
        },
        {
            label: 'Orders',
            detail: 'Process and fulfil purchases',
            href: '/admin/orders',
            icon: ShoppingBag,
        },
        {
            label: 'Customers',
            detail: 'Profiles and order history',
            href: '/admin/customers',
            icon: Users,
        },
        {
            label: 'Discounts',
            detail: 'Create promotional codes',
            href: '/admin/discounts',
            icon: BadgePercent,
        },
        {
            label: 'Reviews',
            detail: 'Moderate customer feedback',
            href: '/admin/reviews',
            icon: MessageSquareText,
        },
        {
            label: 'Store settings',
            detail: 'Commerce defaults and identity',
            href: '/admin/settings',
            icon: Settings,
        },
    ];

    return (
        <>
            <Head title="Admin overview" />
            <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                    <p className="admin-eyebrow">Overview</p>
                    <h1 className="admin-title">Good evening.</h1>
                    <p className="mt-2 text-sm text-stone-500">
                        Here is what is happening across Ellena today.
                    </p>
                </div>
                <Link href="/admin/products/create" className="admin-button">
                    Add product
                </Link>
            </div>
            <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="admin-card">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                                {label}
                            </p>
                            <Icon size={18} className="text-stone-400" />
                        </div>
                        <p className="mt-8 text-3xl font-semibold tracking-tight">
                            {value}
                        </p>
                    </div>
                ))}
            </div>
            <section className="mt-6">
                <div className="mb-4 flex items-end justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">
                            Commerce modules
                        </h2>
                        <p className="mt-1 text-xs text-stone-500">
                            Move through the complete product-to-order workflow.
                        </p>
                    </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {modules.map(({ label, detail, href, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="group flex items-center gap-4 border border-black/10 bg-white p-5 hover:border-black"
                        >
                            <div className="grid h-11 w-11 shrink-0 place-items-center bg-stone-100 group-hover:bg-black group-hover:text-white">
                                <Icon size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold">{label}</p>
                                <p className="mt-1 truncate text-xs text-stone-500">
                                    {detail}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
                <section className="admin-card p-0">
                    <div className="flex items-center justify-between border-b border-black/10 p-6">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Recent orders
                            </h2>
                            <p className="mt-1 text-xs text-stone-500">
                                Latest purchases across the store
                            </p>
                        </div>
                        <Link
                            href="/admin/orders"
                            className="flex items-center gap-2 text-xs font-semibold"
                        >
                            View all <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Customer</th>
                                    <th>Status</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map((order) => (
                                    <tr key={order.id}>
                                        <td>
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                className="font-semibold"
                                            >
                                                {order.number}
                                            </Link>
                                        </td>
                                        <td>
                                            {order.customer_name}
                                            <small>{order.email}</small>
                                        </td>
                                        <td>
                                            <Status value={order.status} />
                                        </td>
                                        <td>{money(order.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
                <section className="admin-card">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Stock watch</h2>
                        <Link
                            href="/admin/products"
                            className="text-xs underline"
                        >
                            Manage
                        </Link>
                    </div>
                    <div className="mt-5 divide-y divide-black/10">
                        {lowStock.map((product) => (
                            <div
                                key={product.id}
                                className="flex items-center gap-4 py-4"
                            >
                                <img
                                    src={product.images?.[0]}
                                    alt=""
                                    className="h-12 w-12 object-cover"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold">
                                        {product.name}
                                    </p>
                                    <p className="mt-1 text-xs text-stone-500">
                                        {product.sku}
                                    </p>
                                </div>
                                <span
                                    className={`text-xs font-semibold ${product.stock < 5 ? 'text-red-600' : 'text-amber-600'}`}
                                >
                                    {product.stock} left
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}

function Status({ value }: { value: string }) {
    return <span className={`status status-${value}`}>{value}</span>;
}

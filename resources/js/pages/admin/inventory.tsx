import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertTriangle, Boxes, Coins, PackageX, Search } from 'lucide-react';
import { useState } from 'react';
import { money } from '@/lib/money';
import type { Pagination, Product } from '@/types';

export default function Inventory({
    products,
    filters,
    summary,
    lowStockThreshold,
}: {
    products: Pagination<Product>;
    filters: { status?: string; search?: string };
    summary: { units: number; low: number; out: number; value: number };
    lowStockThreshold: number;
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const cards = [
        { label: 'Units in stock', value: summary.units, icon: Boxes },
        { label: 'Low stock', value: summary.low, icon: AlertTriangle },
        { label: 'Out of stock', value: summary.out, icon: PackageX },
        {
            label: 'Retail stock value',
            value: money(summary.value),
            icon: Coins,
        },
    ];

    return (
        <>
            <Head title="Inventory" />
            <div>
                <p className="admin-eyebrow">Catalog</p>
                <h1 className="admin-title">Inventory</h1>
                <p className="mt-2 text-sm text-stone-500">
                    Monitor availability and adjust stock without leaving the
                    list.
                </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="admin-card">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                                {label}
                            </span>
                            <Icon size={18} className="text-stone-400" />
                        </div>
                        <p className="mt-6 text-3xl font-semibold">{value}</p>
                    </div>
                ))}
            </div>
            <section className="admin-card mt-6 p-0">
                <div className="flex flex-col justify-between gap-4 border-b border-black/10 p-5 md:flex-row">
                    <div className="flex gap-2">
                        {[
                            ['', 'All stock'],
                            ['low', 'Low stock'],
                            ['out', 'Out of stock'],
                        ].map(([value, label]) => (
                            <button
                                key={value}
                                onClick={() =>
                                    router.get(
                                        '/admin/inventory',
                                        {
                                            ...filters,
                                            status: value || undefined,
                                        },
                                        { preserveState: true },
                                    )
                                }
                                className={`rounded-full px-4 py-2 text-xs font-semibold ${filters.status === value || (!filters.status && !value) ? 'bg-black text-white' : 'bg-stone-100'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            router.get(
                                '/admin/inventory',
                                { ...filters, search },
                                { preserveState: true },
                            );
                        }}
                        className="flex items-center gap-3 border border-black/15 px-4 py-2"
                    >
                        <Search size={15} />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Product or SKU"
                            className="border-0 bg-transparent text-sm outline-none"
                        />
                    </form>
                </div>
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Available</th>
                                <th>Stock status</th>
                                <th>Adjust quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.data.map((product) => (
                                <InventoryRow
                                    key={product.id}
                                    product={product}
                                    lowStockThreshold={lowStockThreshold}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end gap-2 border-t border-black/10 p-5">
                    {products.prev_page_url && (
                        <Link
                            href={products.prev_page_url}
                            className="admin-secondary"
                        >
                            Previous
                        </Link>
                    )}
                    {products.next_page_url && (
                        <Link
                            href={products.next_page_url}
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

function InventoryRow({
    product,
    lowStockThreshold,
}: {
    product: Product;
    lowStockThreshold: number;
}) {
    const form = useForm({ stock: product.stock.toString() });
    const state =
        product.stock === 0
            ? 'Out of stock'
            : product.stock <= lowStockThreshold
              ? 'Low'
              : 'Healthy';

    return (
        <tr>
            <td>
                <div className="flex min-w-64 items-center gap-4">
                    <img
                        src={product.images?.[0]}
                        className="h-14 w-12 object-cover"
                        alt=""
                    />
                    <div>
                        <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="font-semibold hover:underline"
                        >
                            {product.name}
                        </Link>
                        <small>{product.sku}</small>
                    </div>
                </div>
            </td>
            <td>{product.category?.name}</td>
            <td className="font-semibold">{product.stock}</td>
            <td>
                <span
                    className={`status ${state === 'Healthy' ? 'status-delivered' : state === 'Low' ? 'status-pending' : 'status-cancelled'}`}
                >
                    {state}
                </span>
            </td>
            <td>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.patch(`/admin/inventory/${product.id}`, {
                            preserveScroll: true,
                        });
                    }}
                    className="flex min-w-40 gap-2"
                >
                    <input
                        type="number"
                        min="0"
                        value={form.data.stock}
                        onChange={(event) =>
                            form.setData('stock', event.target.value)
                        }
                        className="w-20 border border-black/15 px-3 py-2 text-sm"
                    />
                    <button className="admin-secondary px-3 py-2">Save</button>
                </form>
            </td>
        </tr>
    );
}

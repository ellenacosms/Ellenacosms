import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Download,
    Edit3,
    FileSpreadsheet,
    Plus,
    Search,
    Star,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { money } from '@/lib/money';
import type { Pagination, Product } from '@/types';

type ImportResult = {
    created: number;
    updated: number;
    skipped: number;
    errors: Array<{ row: number; errors: string[] }>;
};

export default function Products({
    products,
    search: initialSearch,
    importResult,
}: {
    products: Pagination<Product>;
    search: string;
    importResult?: ImportResult | null;
}) {
    const [search, setSearch] = useState(initialSearch ?? '');
    const [showImport, setShowImport] = useState(Boolean(importResult));
    const importForm = useForm<{ file: File | null }>({ file: null });
    const submit = (e: FormEvent) => {
        e.preventDefault();
        router.get('/admin/products', { search }, { preserveState: true });
    };
    const remove = (product: Product) => {
        if (confirm(`Delete ${product.name}? This cannot be undone.`)) {
            router.delete(`/admin/products/${product.id}`);
        }
    };

    return (
        <>
            <Head title="Products" />
            <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                    <p className="admin-eyebrow">Catalog</p>
                    <h1 className="admin-title">Products</h1>
                    <p className="mt-2 text-sm text-stone-500">
                        {products.total} products in your collection.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <a
                        href="/admin/products/export"
                        className="admin-secondary flex items-center gap-2"
                    >
                        <Download size={15} />
                        Export CSV
                    </a>
                    <button
                        type="button"
                        onClick={() => setShowImport((open) => !open)}
                        className="admin-secondary flex items-center gap-2"
                    >
                        <Upload size={15} />
                        Import CSV
                    </button>
                    <Link
                        href="/admin/products/create"
                        className="admin-button flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Add product
                    </Link>
                </div>
            </div>
            {showImport && (
                <section className="admin-card mt-7">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="admin-section-title">
                                Bulk product import
                            </h2>
                            <p className="mt-2 max-w-2xl text-xs leading-6 text-stone-500">
                                Existing system SKUs are used to find products
                                to update. Leave SKU blank for new products and
                                ELLENA will generate it automatically. Category
                                values must use the category slug. Separate
                                multiple image URLs with a vertical bar (|).
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowImport(false)}
                            className="admin-icon"
                            aria-label="Close import panel"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                importForm.post('/admin/products/import', {
                                    forceFormData: true,
                                    preserveScroll: true,
                                });
                            }}
                            className="grid gap-4 sm:grid-cols-[1fr_auto]"
                        >
                            <label className="flex cursor-pointer items-center gap-4 border border-dashed border-black/25 bg-stone-50 p-5 hover:border-black">
                                <span className="grid h-11 w-11 shrink-0 place-items-center bg-white">
                                    <FileSpreadsheet size={20} />
                                </span>
                                <span className="min-w-0">
                                    <strong className="block truncate text-xs">
                                        {importForm.data.file?.name ??
                                            'Choose a CSV file'}
                                    </strong>
                                    <small
                                        className={
                                            importForm.errors.file
                                                ? 'text-red-600'
                                                : 'text-stone-500'
                                        }
                                    >
                                        {importForm.errors.file ??
                                            'Maximum 5,000 products or 10 MB'}
                                    </small>
                                </span>
                                <input
                                    type="file"
                                    accept=".csv,text/csv"
                                    className="sr-only"
                                    onChange={(event) =>
                                        importForm.setData(
                                            'file',
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                            </label>
                            <button
                                disabled={
                                    !importForm.data.file ||
                                    importForm.processing
                                }
                                className="admin-button min-w-36 disabled:opacity-50"
                            >
                                {importForm.processing
                                    ? 'Importing…'
                                    : 'Import products'}
                            </button>
                        </form>
                        <a
                            href="/admin/products/import-template"
                            className="admin-secondary flex items-center justify-center gap-2"
                        >
                            <Download size={15} />
                            Download template
                        </a>
                    </div>
                    {importResult && (
                        <div className="mt-6 border-t border-black/10 pt-6">
                            <div className="grid gap-3 sm:grid-cols-3">
                                {[
                                    ['Created', importResult.created],
                                    ['Updated', importResult.updated],
                                    ['Skipped', importResult.skipped],
                                ].map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="bg-stone-50 px-4 py-3"
                                    >
                                        <strong className="block text-xl">
                                            {value}
                                        </strong>
                                        <span className="text-[10px] font-semibold tracking-wider text-stone-500 uppercase">
                                            {label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {importResult.errors.length > 0 && (
                                <div className="mt-4 max-h-64 overflow-y-auto border border-red-200 bg-red-50 p-4">
                                    <p className="text-xs font-semibold text-red-800">
                                        Rows needing attention
                                    </p>
                                    <ul className="mt-3 space-y-2 text-xs leading-5 text-red-700">
                                        {importResult.errors.map((error) => (
                                            <li key={error.row}>
                                                <strong>
                                                    Row {error.row}:
                                                </strong>{' '}
                                                {error.errors.join(' ')}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            )}
            <section className="admin-card mt-9 p-0">
                <div className="border-b border-black/10 p-5">
                    <form
                        onSubmit={submit}
                        className="flex max-w-sm items-center gap-3 border border-black/15 bg-white px-4 py-2.5"
                    >
                        <Search size={16} className="text-stone-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search products"
                            className="w-full border-0 bg-transparent text-sm outline-none"
                        />
                    </form>
                </div>
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Featured</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.data.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <div className="flex min-w-60 items-center gap-4">
                                            <img
                                                src={product.images?.[0]}
                                                alt=""
                                                className="h-14 w-12 object-cover"
                                            />
                                            <div>
                                                <p className="font-semibold">
                                                    {product.name}
                                                </p>
                                                <small>{product.sku}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{product.category?.name}</td>
                                    <td>{money(product.price)}</td>
                                    <td>
                                        <span
                                            className={
                                                product.stock < 5
                                                    ? 'font-semibold text-red-600'
                                                    : ''
                                            }
                                        >
                                            {product.stock}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.patch(
                                                    `/admin/products/${product.id}/featured`,
                                                    {
                                                        is_featured:
                                                            !product.is_featured,
                                                    },
                                                    {
                                                        preserveScroll: true,
                                                    },
                                                )
                                            }
                                            className={`inline-flex items-center gap-2 border px-3 py-2 text-[10px] font-semibold tracking-wider uppercase transition ${
                                                product.is_featured
                                                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                                                    : 'border-black/15 text-stone-500 hover:border-black hover:text-black'
                                            }`}
                                            aria-pressed={product.is_featured}
                                            aria-label={`${product.is_featured ? 'Remove' : 'Add'} ${product.name} ${product.is_featured ? 'from' : 'to'} featured products`}
                                        >
                                            <Star
                                                size={13}
                                                fill={
                                                    product.is_featured
                                                        ? 'currentColor'
                                                        : 'none'
                                                }
                                            />
                                            {product.is_featured
                                                ? 'Featured'
                                                : 'Feature'}
                                        </button>
                                    </td>
                                    <td>
                                        <span
                                            className={`status ${product.is_active ? 'status-delivered' : 'status-cancelled'}`}
                                        >
                                            {product.is_active
                                                ? 'Active'
                                                : 'Draft'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/admin/products/${product.id}/edit`}
                                                className="admin-icon"
                                            >
                                                <Edit3 size={15} />
                                            </Link>
                                            <button
                                                onClick={() => remove(product)}
                                                className="admin-icon text-red-600"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
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

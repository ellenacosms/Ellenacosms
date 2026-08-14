import { Head, Link, router } from '@inertiajs/react';
import { Edit3, Layers3, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { Product } from '@/types';

type AdminRitual = {
    id: number;
    name: string;
    eyebrow?: string;
    image?: string;
    discount_percent: string | number;
    sort_order: number;
    is_featured: boolean;
    is_active: boolean;
    products_count: number;
    products: Pick<Product, 'id' | 'name' | 'slug' | 'images'>[];
};

export default function Rituals({ rituals }: { rituals: AdminRitual[] }) {
    const remove = (ritual: AdminRitual) => {
        if (confirm(`Delete ${ritual.name}? This cannot be undone.`)) {
            router.delete(`/admin/rituals/${ritual.id}`);
        }
    };

    return (
        <>
            <Head title="Rituals" />
            <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                    <p className="admin-eyebrow">Merchandising</p>
                    <h1 className="admin-title">Rituals</h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
                        Curate guided routines, bundle savings, and the order in
                        which products should be used.
                    </p>
                </div>
                <Link
                    href="/admin/rituals/create"
                    className="admin-button flex items-center gap-2"
                >
                    <Plus size={16} />
                    Add ritual
                </Link>
            </div>

            {rituals.length === 0 ? (
                <section className="admin-card mt-9 flex flex-col items-center py-16 text-center">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-stone-100">
                        <Layers3 size={22} />
                    </span>
                    <h2 className="admin-section-title mt-5">
                        Build your first ritual
                    </h2>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">
                        Combine two or more products into a guided routine that
                        customers can add to their bag in one step.
                    </p>
                    <Link
                        href="/admin/rituals/create"
                        className="admin-button mt-6"
                    >
                        Create ritual
                    </Link>
                </section>
            ) : (
                <section className="admin-card mt-9 p-0">
                    <div className="overflow-x-auto">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Ritual</th>
                                    <th>Products</th>
                                    <th>Saving</th>
                                    <th>Position</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rituals.map((ritual) => (
                                    <tr key={ritual.id}>
                                        <td>
                                            <div className="flex min-w-72 items-center gap-4">
                                                {ritual.image ? (
                                                    <img
                                                        src={ritual.image}
                                                        alt=""
                                                        className="h-16 w-14 bg-stone-100 object-cover"
                                                    />
                                                ) : (
                                                    <span className="grid h-16 w-14 shrink-0 place-items-center bg-stone-100 text-stone-400">
                                                        <Layers3 size={19} />
                                                    </span>
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold">
                                                            {ritual.name}
                                                        </p>
                                                        {ritual.is_featured && (
                                                            <Sparkles
                                                                size={13}
                                                                className="text-amber-600"
                                                                aria-label="Featured"
                                                            />
                                                        )}
                                                    </div>
                                                    <small>
                                                        {ritual.eyebrow ??
                                                            'Guided routine'}
                                                    </small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="min-w-52">
                                                <p className="font-semibold">
                                                    {ritual.products_count}{' '}
                                                    items
                                                </p>
                                                <small className="line-clamp-2 max-w-xs leading-5">
                                                    {ritual.products
                                                        .map(
                                                            (product) =>
                                                                product.name,
                                                        )
                                                        .join(' · ')}
                                                </small>
                                            </div>
                                        </td>
                                        <td className="font-semibold">
                                            {Number(
                                                ritual.discount_percent,
                                            ).toFixed(0)}
                                            %
                                        </td>
                                        <td>{ritual.sort_order}</td>
                                        <td>
                                            <span
                                                className={`inline-flex px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase ${
                                                    ritual.is_active
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-stone-100 text-stone-500'
                                                }`}
                                            >
                                                {ritual.is_active
                                                    ? 'Published'
                                                    : 'Draft'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/admin/rituals/${ritual.id}/edit`}
                                                    className="admin-icon"
                                                    aria-label={`Edit ${ritual.name}`}
                                                >
                                                    <Edit3 size={15} />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        remove(ritual)
                                                    }
                                                    className="admin-icon text-red-600"
                                                    aria-label={`Delete ${ritual.name}`}
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
                </section>
            )}
        </>
    );
}

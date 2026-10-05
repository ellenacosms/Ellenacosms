import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, Edit3, Eye, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { BeautyGuide } from '@/types';

export default function BeautyGuidesAdmin({
    guides,
}: {
    guides: BeautyGuide[];
}) {
    const remove = (guide: BeautyGuide) => {
        if (confirm(`Delete “${guide.title}”? This cannot be undone.`))
            router.delete(`/admin/beauty-guides/${guide.id}`);
    };

    const status = (guide: BeautyGuide) => {
        if (!guide.is_published)
            return ['Draft', 'bg-stone-100 text-stone-600'];
        if (guide.published_at && new Date(guide.published_at) > new Date())
            return ['Scheduled', 'bg-amber-50 text-amber-700'];
        return ['Published', 'bg-emerald-50 text-emerald-700'];
    };

    return (
        <>
            <Head title="Beauty Guides" />
            <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                    <p className="admin-eyebrow">Editorial</p>
                    <h1 className="admin-title">Beauty guides</h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
                        Publish shoppable advice, practical routines, FAQs, and
                        ingredient education.
                    </p>
                </div>
                <Link
                    href="/admin/beauty-guides/create"
                    className="admin-button flex items-center gap-2"
                >
                    <Plus size={16} /> Add guide
                </Link>
            </div>

            {guides.length === 0 ? (
                <section className="admin-card mt-9 flex flex-col items-center py-16 text-center">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-stone-100">
                        <BookOpen size={22} />
                    </span>
                    <h2 className="admin-section-title mt-5">
                        Create the first guide
                    </h2>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">
                        Turn Ellena expertise into useful, product-connected
                        editorial content.
                    </p>
                    <Link
                        href="/admin/beauty-guides/create"
                        className="admin-button mt-6"
                    >
                        Create guide
                    </Link>
                </section>
            ) : (
                <section className="admin-card mt-9 p-0">
                    <div className="overflow-x-auto">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Guide</th>
                                    <th>Category</th>
                                    <th>Products</th>
                                    <th>Publication</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {guides.map((guide) => {
                                    const [label, classes] = status(guide);
                                    return (
                                        <tr key={guide.id}>
                                            <td>
                                                <div className="flex min-w-80 items-center gap-4">
                                                    {guide.hero_image ? (
                                                        <img
                                                            src={
                                                                guide.hero_image
                                                            }
                                                            alt=""
                                                            className="h-16 w-20 bg-stone-100 object-cover"
                                                        />
                                                    ) : (
                                                        <span className="grid h-16 w-20 shrink-0 place-items-center bg-stone-100 text-stone-400">
                                                            <BookOpen
                                                                size={18}
                                                            />
                                                        </span>
                                                    )}
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold">
                                                                {guide.title}
                                                            </p>
                                                            {guide.is_featured && (
                                                                <Sparkles
                                                                    size={13}
                                                                    className="text-amber-600"
                                                                />
                                                            )}
                                                        </div>
                                                        <small>
                                                            {guide.read_minutes}{' '}
                                                            min read · Position{' '}
                                                            {guide.sort_order}
                                                        </small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{guide.category_label}</td>
                                            <td>
                                                {guide.products_count ?? 0}{' '}
                                                products
                                            </td>
                                            <td>
                                                <span
                                                    className={`inline-flex px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase ${classes}`}
                                                >
                                                    {label}
                                                </span>
                                                {guide.published_at && (
                                                    <small className="mt-2 block">
                                                        {new Date(
                                                            guide.published_at,
                                                        ).toLocaleString()}
                                                    </small>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex justify-end gap-2">
                                                    {label === 'Published' && (
                                                        <a
                                                            href={`/beauty-guide/${guide.slug}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="admin-icon"
                                                            aria-label={`View ${guide.title}`}
                                                        >
                                                            <Eye size={15} />
                                                        </a>
                                                    )}
                                                    <Link
                                                        href={`/admin/beauty-guides/${guide.id}/edit`}
                                                        className="admin-icon"
                                                        aria-label={`Edit ${guide.title}`}
                                                    >
                                                        <Edit3 size={15} />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            remove(guide)
                                                        }
                                                        className="admin-icon text-red-600"
                                                        aria-label={`Delete ${guide.title}`}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </>
    );
}

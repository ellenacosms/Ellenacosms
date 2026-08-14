import { Head, router } from '@inertiajs/react';
import { Check, Star, Trash2, X } from 'lucide-react';
import type { Pagination, Review } from '@/types';

export default function Reviews({
    reviews,
    status,
    summary,
}: {
    reviews: Pagination<Review>;
    status: string;
    summary: { total: number; pending: number; average: number };
}) {
    return (
        <>
            <Head title="Reviews" />
            <div>
                <p className="admin-eyebrow">Experience</p>
                <h1 className="admin-title">Product reviews</h1>
                <p className="mt-2 text-sm text-stone-500">
                    Moderate customer feedback before it appears in the store.
                </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                    ['Total reviews', summary.total],
                    ['Awaiting review', summary.pending],
                    ['Average rating', `${summary.average} / 5`],
                ].map(([label, value]) => (
                    <div key={label} className="admin-card">
                        <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                            {label}
                        </p>
                        <p className="mt-5 text-3xl font-semibold">{value}</p>
                    </div>
                ))}
            </div>
            <section className="mt-6">
                <div className="mb-4 flex gap-2">
                    {[
                        ['', 'All'],
                        ['pending', 'Pending'],
                        ['approved', 'Published'],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            onClick={() =>
                                router.get(
                                    '/admin/reviews',
                                    value ? { status: value } : {},
                                    { preserveState: true },
                                )
                            }
                            className={`rounded-full px-4 py-2 text-xs font-semibold ${status === value ? 'bg-black text-white' : 'bg-white'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div className="space-y-4">
                    {reviews.data.map((review) => (
                        <article key={review.id} className="admin-card">
                            <div className="flex flex-col justify-between gap-5 md:flex-row">
                                <div className="flex gap-4">
                                    <img
                                        src={review.product?.images?.[0]}
                                        className="h-16 w-14 object-cover"
                                        alt=""
                                    />
                                    <div>
                                        <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                                            {review.product?.name}
                                        </p>
                                        <div className="mt-2 flex gap-1 text-amber-500">
                                            {[1, 2, 3, 4, 5].map((value) => (
                                                <Star
                                                    key={value}
                                                    size={14}
                                                    fill={
                                                        value <= review.rating
                                                            ? 'currentColor'
                                                            : 'none'
                                                    }
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <span
                                    className={`status ${review.is_approved ? 'status-delivered' : 'status-pending'}`}
                                >
                                    {review.is_approved
                                        ? 'Published'
                                        : 'Pending'}
                                </span>
                            </div>
                            <h2 className="mt-5 font-serif text-2xl">
                                {review.title || 'Customer review'}
                            </h2>
                            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">
                                {review.body}
                            </p>
                            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-5">
                                <p className="text-xs text-stone-500">
                                    {review.customer_name} · {review.email} ·{' '}
                                    {new Date(
                                        review.created_at,
                                    ).toLocaleDateString()}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            router.put(
                                                `/admin/reviews/${review.id}`,
                                                {
                                                    is_approved:
                                                        !review.is_approved,
                                                },
                                            )
                                        }
                                        className="admin-secondary flex items-center gap-2"
                                    >
                                        {review.is_approved ? (
                                            <X size={14} />
                                        ) : (
                                            <Check size={14} />
                                        )}
                                        {review.is_approved
                                            ? 'Unpublish'
                                            : 'Approve'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (
                                                confirm('Delete this review?')
                                            ) {
                                                router.delete(
                                                    `/admin/reviews/${review.id}`,
                                                );
                                            }
                                        }}
                                        className="admin-icon text-red-600"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </>
    );
}

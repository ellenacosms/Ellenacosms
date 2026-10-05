import { Head, Link, router } from '@inertiajs/react';
import { Eye, MailOpen, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { ContactSubmission, Pagination } from '@/types';

const statuses = [
    ['', 'All'],
    ['unread', 'Unread'],
    ['read', 'Read'],
];

const topics = [
    ['', 'All topics'],
    ['product-advice', 'Product advice'],
    ['order-support', 'Order support'],
    ['delivery', 'Delivery'],
    ['wholesale', 'Wholesale'],
    ['partnership', 'Partnership'],
    ['other', 'Other'],
];

function topicLabel(topic: string): string {
    return topics.find(([value]) => value === topic)?.[1] ?? topic;
}

export default function ContactSubmissions({
    filters,
    submissions,
    summary,
}: {
    filters: { status: string; topic: string; search: string };
    submissions: Pagination<ContactSubmission>;
    summary: {
        total: number;
        unread: number;
        wholesale: number;
        today: number;
    };
}) {
    const [search, setSearch] = useState(filters.search);
    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            '/admin/contact-submissions',
            { status: filters.status, topic: filters.topic, search },
            { preserveState: true },
        );
    };

    return (
        <>
            <Head title="Contact inbox" />
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                    <p className="admin-eyebrow">Customer support</p>
                    <h1 className="admin-title">Contact inbox</h1>
                    <p className="mt-2 text-sm text-stone-500">
                        Review customer messages, order questions, and wholesale
                        enquiries from the storefront form.
                    </p>
                </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    ['Total messages', summary.total],
                    ['Unread', summary.unread],
                    ['Wholesale', summary.wholesale],
                    ['Today', summary.today],
                ].map(([label, value]) => (
                    <div key={label} className="admin-card">
                        <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                            {label}
                        </p>
                        <p className="mt-5 text-3xl font-semibold">{value}</p>
                    </div>
                ))}
            </div>

            <section className="admin-card mt-6 !p-0">
                <div className="flex flex-col gap-4 border-b border-black/10 p-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {statuses.map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() =>
                                    router.get(
                                        '/admin/contact-submissions',
                                        {
                                            status: value,
                                            topic: filters.topic,
                                            search,
                                        },
                                        { preserveState: true },
                                    )
                                }
                                className={`rounded-full px-4 py-2 text-xs font-semibold ${filters.status === value ? 'bg-black text-white' : 'bg-stone-100'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <select
                            value={filters.topic}
                            onChange={(event) =>
                                router.get(
                                    '/admin/contact-submissions',
                                    {
                                        status: filters.status,
                                        topic: event.target.value,
                                        search,
                                    },
                                    { preserveState: true },
                                )
                            }
                            className="border border-stone-300 bg-white px-3 py-2 text-sm outline-none"
                        >
                            {topics.map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        <form
                            onSubmit={submitSearch}
                            className="flex w-full items-center border-b border-stone-400 pb-2 lg:w-72"
                        >
                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search messages"
                                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                            />
                            <button
                                type="submit"
                                aria-label="Search contact messages"
                            >
                                <Search size={16} />
                            </button>
                        </form>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="admin-table min-w-[980px]">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Topic</th>
                                <th>Message</th>
                                <th>Preferred reply</th>
                                <th>Received</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.data.map((submission) => (
                                <tr
                                    key={submission.id}
                                    className={
                                        submission.read_at
                                            ? ''
                                            : 'bg-brand-blush/40'
                                    }
                                >
                                    <td>
                                        <div className="font-medium">
                                            {submission.name}
                                        </div>
                                        <div className="text-xs text-stone-500">
                                            {submission.email}
                                        </div>
                                        {submission.phone && (
                                            <div className="text-xs text-stone-500">
                                                {submission.phone}
                                            </div>
                                        )}
                                    </td>
                                    <td>{topicLabel(submission.topic)}</td>
                                    <td className="max-w-xs">
                                        <p className="line-clamp-2 text-sm text-stone-600">
                                            {submission.message}
                                        </p>
                                        {submission.order_number && (
                                            <p className="mt-1 text-xs text-stone-400">
                                                Order: {submission.order_number}
                                            </p>
                                        )}
                                    </td>
                                    <td className="capitalize">
                                        {submission.preferred_contact_method}
                                    </td>
                                    <td>
                                        {new Date(
                                            submission.created_at,
                                        ).toLocaleString()}
                                    </td>
                                    <td>
                                        <span
                                            className={`status ${submission.read_at ? 'status-delivered' : 'status-pending'}`}
                                        >
                                            {submission.read_at
                                                ? 'read'
                                                : 'unread'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/admin/contact-submissions/${submission.id}`}
                                                className="admin-icon"
                                                title="View message"
                                            >
                                                <Eye size={15} />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.patch(
                                                        `/admin/contact-submissions/${submission.id}/${submission.read_at ? 'unread' : 'read'}`,
                                                    )
                                                }
                                                className="admin-icon"
                                                title={
                                                    submission.read_at
                                                        ? 'Mark unread'
                                                        : 'Mark read'
                                                }
                                            >
                                                <MailOpen size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (
                                                        confirm(
                                                            'Permanently delete this contact message?',
                                                        )
                                                    ) {
                                                        router.delete(
                                                            `/admin/contact-submissions/${submission.id}`,
                                                        );
                                                    }
                                                }}
                                                className="admin-icon text-red-600"
                                                title="Delete message"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!submissions.data.length && (
                        <p className="p-10 text-center text-sm text-stone-500">
                            No contact messages match these filters.
                        </p>
                    )}
                </div>

                {(submissions.prev_page_url || submissions.next_page_url) && (
                    <div className="flex justify-end gap-2 border-t border-black/10 p-5">
                        {submissions.prev_page_url && (
                            <Link
                                href={submissions.prev_page_url}
                                className="admin-secondary"
                            >
                                Previous
                            </Link>
                        )}
                        {submissions.next_page_url && (
                            <Link
                                href={submissions.next_page_url}
                                className="admin-button"
                            >
                                Next
                            </Link>
                        )}
                    </div>
                )}
            </section>
        </>
    );
}

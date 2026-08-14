import { Head, Link, router } from '@inertiajs/react';
import { Download, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { NewsletterSubscriber, Pagination } from '@/types';

const statuses = [
    ['', 'All'],
    ['confirmed', 'Confirmed'],
    ['pending', 'Pending'],
    ['unsubscribed', 'Unsubscribed'],
];

export default function NewsletterSubscribers({
    subscribers,
    filters,
    summary,
}: {
    subscribers: Pagination<NewsletterSubscriber>;
    filters: { status: string; search: string };
    summary: {
        total: number;
        confirmed: number;
        pending: number;
        unsubscribed: number;
    };
}) {
    const [search, setSearch] = useState(filters.search);
    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            '/admin/newsletter',
            { status: filters.status, search },
            { preserveState: true },
        );
    };

    return (
        <>
            <Head title="Newsletter subscribers" />
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                    <p className="admin-eyebrow">Marketing</p>
                    <h1 className="admin-title">Newsletter subscribers</h1>
                    <p className="mt-2 text-sm text-stone-500">
                        Review consent status, resend confirmations, and export
                        the private list.
                    </p>
                </div>
                <a
                    href="/admin/newsletter/export"
                    className="admin-secondary inline-flex items-center justify-center gap-2"
                >
                    <Download size={15} /> Export CSV
                </a>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    ['Total subscribers', summary.total],
                    ['Confirmed', summary.confirmed],
                    ['Pending', summary.pending],
                    ['Unsubscribed', summary.unsubscribed],
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
                <div className="flex flex-col gap-4 border-b border-black/10 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {statuses.map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() =>
                                    router.get(
                                        '/admin/newsletter',
                                        { status: value, search },
                                        { preserveState: true },
                                    )
                                }
                                className={`rounded-full px-4 py-2 text-xs font-semibold ${filters.status === value ? 'bg-black text-white' : 'bg-stone-100'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <form
                        onSubmit={submitSearch}
                        className="flex w-full items-center border-b border-stone-400 pb-2 lg:w-72"
                    >
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search email"
                            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                        />
                        <button type="submit" aria-label="Search subscribers">
                            <Search size={16} />
                        </button>
                    </form>
                </div>

                <div className="overflow-x-auto">
                    <table className="admin-table min-w-[860px]">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Source</th>
                                <th>Consent date</th>
                                <th>Mailchimp</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscribers.data.map((subscriber) => (
                                <tr key={subscriber.id}>
                                    <td className="font-medium">
                                        {subscriber.email}
                                    </td>
                                    <td>
                                        <span
                                            className={`status ${subscriber.status === 'confirmed' ? 'status-delivered' : subscriber.status === 'pending' ? 'status-pending' : 'status-cancelled'}`}
                                        >
                                            {subscriber.status}
                                        </span>
                                    </td>
                                    <td className="capitalize">
                                        {subscriber.source}
                                    </td>
                                    <td>
                                        {new Date(
                                            subscriber.consent_at,
                                        ).toLocaleDateString()}
                                    </td>
                                    <td>
                                        {subscriber.mailchimp_synced_at ? (
                                            <span className="text-emerald-700">
                                                Synced
                                            </span>
                                        ) : subscriber.mailchimp_sync_error ? (
                                            <span
                                                className="text-red-700"
                                                title={
                                                    subscriber.mailchimp_sync_error
                                                }
                                            >
                                                Failed
                                            </span>
                                        ) : (
                                            <span className="text-stone-400">
                                                Not synced
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="flex justify-end gap-2">
                                            {subscriber.status !==
                                                'confirmed' && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        router.post(
                                                            `/admin/newsletter/${subscriber.id}/resend`,
                                                        )
                                                    }
                                                    className="admin-icon"
                                                    title="Resend confirmation"
                                                >
                                                    <RefreshCw size={15} />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (
                                                        confirm(
                                                            'Permanently delete this subscriber?',
                                                        )
                                                    ) {
                                                        router.delete(
                                                            `/admin/newsletter/${subscriber.id}`,
                                                        );
                                                    }
                                                }}
                                                className="admin-icon text-red-600"
                                                title="Delete subscriber"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!subscribers.data.length && (
                        <p className="p-10 text-center text-sm text-stone-500">
                            No subscribers match these filters.
                        </p>
                    )}
                </div>

                {(subscribers.prev_page_url || subscribers.next_page_url) && (
                    <div className="flex justify-end gap-2 border-t border-black/10 p-5">
                        {subscribers.prev_page_url && (
                            <Link
                                href={subscribers.prev_page_url}
                                className="admin-secondary"
                            >
                                Previous
                            </Link>
                        )}
                        {subscribers.next_page_url && (
                            <Link
                                href={subscribers.next_page_url}
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

import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, MailOpen, Trash2 } from 'lucide-react';
import type { ContactSubmission } from '@/types';

const topicLabels: Record<string, string> = {
    'product-advice': 'Product advice',
    'order-support': 'Order support',
    delivery: 'Delivery',
    wholesale: 'Wholesale / reseller',
    partnership: 'Partnership',
    other: 'Other',
};

export default function ContactSubmissionShow({
    submission,
}: {
    submission: ContactSubmission;
}) {
    return (
        <>
            <Head title={`Contact message from ${submission.name}`} />
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div>
                    <Link
                        href="/admin/contact-submissions"
                        className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-black"
                    >
                        <ArrowLeft size={15} /> Back to contact inbox
                    </Link>
                    <p className="admin-eyebrow mt-6">Customer support</p>
                    <h1 className="admin-title">
                        Message from {submission.name}
                    </h1>
                    <p className="mt-2 text-sm text-stone-500">
                        Received{' '}
                        {new Date(submission.created_at).toLocaleString()}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            router.patch(
                                `/admin/contact-submissions/${submission.id}/${submission.read_at ? 'unread' : 'read'}`,
                            )
                        }
                        className="admin-secondary inline-flex items-center gap-2"
                    >
                        <MailOpen size={15} />
                        {submission.read_at ? 'Mark unread' : 'Mark read'}
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
                        className="admin-secondary inline-flex items-center gap-2 text-red-700"
                    >
                        <Trash2 size={15} /> Delete
                    </button>
                </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[.82fr_1.18fr]">
                <section className="admin-card">
                    <p className="admin-eyebrow">Contact details</p>
                    <dl className="mt-6 space-y-5 text-sm">
                        <Detail label="Name" value={submission.name} />
                        <Detail label="Email" value={submission.email} />
                        <Detail
                            label="Phone"
                            value={submission.phone ?? 'Not provided'}
                        />
                        <Detail
                            label="Preferred reply"
                            value={submission.preferred_contact_method}
                        />
                        <Detail
                            label="Order number"
                            value={submission.order_number ?? 'Not provided'}
                        />
                        <Detail
                            label="Status"
                            value={submission.read_at ? 'Read' : 'Unread'}
                        />
                    </dl>
                </section>

                <section className="admin-card">
                    <div className="flex flex-col gap-2 border-b border-black/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="admin-eyebrow">Message</p>
                            <h2 className="mt-2 font-serif text-3xl">
                                {topicLabels[submission.topic] ??
                                    submission.topic}
                            </h2>
                        </div>
                        <span className="status status-pending w-fit">
                            {submission.preferred_contact_method}
                        </span>
                    </div>
                    <p className="mt-7 text-sm leading-7 whitespace-pre-line text-stone-700">
                        {submission.message}
                    </p>
                </section>
            </div>
        </>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                {label}
            </dt>
            <dd className="mt-1 text-stone-900">{value}</dd>
        </div>
    );
}

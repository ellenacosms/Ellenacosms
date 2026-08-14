import { Head, Link, router } from '@inertiajs/react';
import { Check, LoaderCircle, Mail, X } from 'lucide-react';
import { useState } from 'react';

export default function NewsletterStatus({
    mode,
    email,
    action,
}: {
    mode: 'confirmed' | 'unsubscribe';
    email: string;
    action?: string;
}) {
    const [processing, setProcessing] = useState(false);
    const confirmed = mode === 'confirmed';

    return (
        <>
            <Head
                title={
                    confirmed
                        ? 'Subscription confirmed'
                        : 'Newsletter preferences'
                }
            />
            <section className="mx-auto max-w-2xl px-5 pt-40 pb-28 text-center md:pt-48 md:pb-36">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-black bg-white">
                    {confirmed ? <Check size={24} /> : <Mail size={23} />}
                </div>
                <p className="eyebrow mt-8">
                    {confirmed ? 'Welcome to Ellena' : 'Email preferences'}
                </p>
                <h1 className="display-heading mt-5">
                    {confirmed
                        ? 'Your place is confirmed.'
                        : 'Leave the private list?'}
                </h1>
                <p className="body-copy mx-auto mt-6 max-w-lg">
                    {confirmed
                        ? `${email} will now receive private launches, considered rituals, and thoughtful notes.`
                        : `${email} will stop receiving Ellena launches and ritual notes.`}
                </p>
                {confirmed ? (
                    <Link href="/shop" className="button-dark mt-9">
                        Explore the collection
                    </Link>
                ) : (
                    <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link href="/" className="button-light">
                            Keep me subscribed
                        </Link>
                        <button
                            type="button"
                            disabled={processing || !action}
                            onClick={() =>
                                action &&
                                router.delete(action, {
                                    onStart: () => setProcessing(true),
                                    onFinish: () => setProcessing(false),
                                })
                            }
                            className="button-dark gap-2 disabled:opacity-50"
                        >
                            {processing ? (
                                <LoaderCircle
                                    size={15}
                                    className="animate-spin"
                                />
                            ) : (
                                <X size={15} />
                            )}
                            {processing ? 'Updating…' : 'Unsubscribe'}
                        </button>
                    </div>
                )}
            </section>
        </>
    );
}

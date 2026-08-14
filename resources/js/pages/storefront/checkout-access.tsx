import { Form, Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    LoaderCircle,
    LockKeyhole,
    ShieldCheck,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { money } from '@/lib/money';
import { store as loginStore } from '@/routes/login';
import { store as registerStore } from '@/routes/register';

type AccessMode = 'register' | 'login';

type GoogleAuthMessage = {
    type: 'ellena:google-auth';
    channel: string;
    status: 'success' | 'error';
    redirect: string;
    message?: string | null;
};

export default function CheckoutAccess({
    itemCount,
    total,
    googleEnabled,
    googleCallbackOrigin,
    passwordRules,
}: {
    itemCount: number;
    total: number;
    googleEnabled: boolean;
    googleCallbackOrigin: string | null;
    passwordRules: string;
}) {
    const [mode, setMode] = useState<AccessMode>('register');
    const [googlePending, setGooglePending] = useState(false);
    const [googleError, setGoogleError] = useState<string | null>(null);
    const popupRef = useRef<Window | null>(null);
    const popupChannelRef = useRef<string | null>(null);
    const popupMonitorRef = useRef<number | null>(null);
    const { errors } = usePage<{ errors: { google?: string } }>().props;

    useEffect(() => {
        const handleGoogleMessage = (event: MessageEvent<unknown>) => {
            if (
                event.source !== popupRef.current ||
                event.origin !== googleCallbackOrigin ||
                !isGoogleAuthMessage(event.data) ||
                event.data.channel !== popupChannelRef.current
            ) {
                return;
            }

            clearPopupMonitor(popupMonitorRef);
            popupRef.current = null;
            popupChannelRef.current = null;
            setGooglePending(false);

            if (event.data.status === 'success') {
                window.location.assign(event.data.redirect);

                return;
            }

            setGoogleError(
                event.data.message ??
                    'Google sign-in could not be completed. Please try again.',
            );
        };

        window.addEventListener('message', handleGoogleMessage);

        return () => {
            window.removeEventListener('message', handleGoogleMessage);
            clearPopupMonitor(popupMonitorRef);
        };
    }, [googleCallbackOrigin]);

    const openGooglePopup = () => {
        if (!googleEnabled || !googleCallbackOrigin || googlePending) {
            return;
        }

        const channel = createGoogleAuthChannel();
        const width = 520;
        const height = 680;
        const left = Math.max(
            0,
            window.screenX + (window.outerWidth - width) / 2,
        );
        const top = Math.max(
            0,
            window.screenY + (window.outerHeight - height) / 2,
        );
        const url = `/auth/google/redirect?popup=1&channel=${encodeURIComponent(channel)}`;
        const popup = window.open(
            url,
            'ellena-google-auth',
            `popup=yes,width=${width},height=${height},left=${Math.round(left)},top=${Math.round(top)}`,
        );

        if (!popup) {
            window.location.assign('/auth/google/redirect');

            return;
        }

        popupRef.current = popup;
        popupChannelRef.current = channel;
        setGoogleError(null);
        setGooglePending(true);
        popup.focus();

        clearPopupMonitor(popupMonitorRef);
        popupMonitorRef.current = window.setInterval(() => {
            if (!popup.closed) {
                return;
            }

            clearPopupMonitor(popupMonitorRef);
            window.setTimeout(() => {
                if (popupRef.current !== popup) {
                    return;
                }

                popupRef.current = null;
                popupChannelRef.current = null;
                setGooglePending(false);
                setGoogleError('Google sign-in was cancelled.');
            }, 300);
        }, 500);
    };

    return (
        <>
            <Head title="Secure your checkout" />
            <section className="store-container pt-36 pb-20 md:pt-40 md:pb-28">
                <Link href="/cart" className="text-link">
                    <ArrowLeft size={14} /> Return to bag
                </Link>

                <div className="mt-8 grid overflow-hidden border border-black/10 bg-white/45 shadow-[0_28px_80px_rgba(48,39,30,.08)] lg:grid-cols-[.82fr_1.18fr]">
                    <aside className="flex flex-col bg-brand-blush px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
                        <p className="eyebrow text-stone-500">
                            Your bag is safely reserved
                        </p>
                        <h1 className="mt-5 font-serif text-5xl leading-[.98] tracking-[-.04em] md:text-6xl">
                            Continue with confidence.
                        </h1>
                        <p className="mt-6 max-w-md text-sm leading-7 text-stone-600">
                            Create your private Ellena account to place the
                            order, follow delivery, and keep every ritual in one
                            secure place.
                        </p>

                        <div className="mt-9 border-y border-black/10 py-6">
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <p className="text-xs text-stone-500">
                                        {itemCount}{' '}
                                        {itemCount === 1 ? 'item' : 'items'} in
                                        your bag
                                    </p>
                                    <p className="mt-2 font-serif text-3xl">
                                        {money(total)}
                                    </p>
                                </div>
                                <LockKeyhole size={24} strokeWidth={1.4} />
                            </div>
                        </div>

                        <ul className="mt-8 space-y-4 text-xs leading-6 text-stone-600">
                            {[
                                'Your cart stays intact while you sign in',
                                'Order history and delivery updates in one place',
                                'Verified identity for safer order support',
                            ].map((benefit) => (
                                <li
                                    key={benefit}
                                    className="flex items-start gap-3"
                                >
                                    <Check
                                        size={15}
                                        className="mt-1 shrink-0 text-black"
                                    />
                                    {benefit}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-auto pt-10">
                            <div className="flex items-center gap-3 text-[9px] font-semibold tracking-[.13em] text-stone-500 uppercase">
                                <ShieldCheck size={16} /> Secure account access
                            </div>
                        </div>
                    </aside>

                    <div className="px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
                        <div className="mx-auto max-w-lg">
                            <div className="grid grid-cols-2 border-b border-black/10">
                                <button
                                    type="button"
                                    onClick={() => setMode('register')}
                                    className={`border-b-2 px-3 py-4 text-[10px] font-semibold tracking-[.14em] uppercase transition ${mode === 'register' ? 'border-brand-gold text-brand-rose' : 'border-transparent text-stone-400 hover:text-brand-rose'}`}
                                >
                                    Create account
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('login')}
                                    className={`border-b-2 px-3 py-4 text-[10px] font-semibold tracking-[.14em] uppercase transition ${mode === 'login' ? 'border-brand-gold text-brand-rose' : 'border-transparent text-stone-400 hover:text-brand-rose'}`}
                                >
                                    Sign in
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={openGooglePopup}
                                disabled={!googleEnabled || googlePending}
                                aria-disabled={!googleEnabled}
                                className={`mt-8 flex w-full items-center justify-center gap-3 border px-5 py-4 text-xs font-semibold transition ${googleEnabled ? 'border-black/15 bg-white hover:border-black' : 'cursor-not-allowed border-black/10 bg-stone-100 text-stone-400'}`}
                            >
                                {googlePending ? (
                                    <LoaderCircle
                                        className="animate-spin"
                                        size={17}
                                    />
                                ) : (
                                    <GoogleMark />
                                )}
                                {googlePending
                                    ? 'Waiting for Google…'
                                    : 'Continue with Google'}
                            </button>
                            {!googleEnabled && (
                                <p className="mt-2 text-center text-[10px] text-stone-500">
                                    Google sign-in becomes available after OAuth
                                    credentials are configured.
                                </p>
                            )}
                            {errors.google && (
                                <p className="mt-3 border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                                    {errors.google}
                                </p>
                            )}
                            {googleError && (
                                <p
                                    aria-live="polite"
                                    className="mt-3 border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
                                >
                                    {googleError}
                                </p>
                            )}

                            <div className="my-8 flex items-center gap-4">
                                <span className="h-px flex-1 bg-black/10" />
                                <span className="text-[9px] font-semibold tracking-[.14em] text-stone-400 uppercase">
                                    or continue with email
                                </span>
                                <span className="h-px flex-1 bg-black/10" />
                            </div>

                            {mode === 'register' ? (
                                <RegisterForm passwordRules={passwordRules} />
                            ) : (
                                <LoginForm />
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

function createGoogleAuthChannel(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(24));

    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
    );
}

function clearPopupMonitor(reference: { current: number | null }): void {
    if (reference.current === null) {
        return;
    }

    window.clearInterval(reference.current);
    reference.current = null;
}

function isGoogleAuthMessage(value: unknown): value is GoogleAuthMessage {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const message = value as Partial<GoogleAuthMessage>;

    return (
        message.type === 'ellena:google-auth' &&
        typeof message.channel === 'string' &&
        (message.status === 'success' || message.status === 'error') &&
        typeof message.redirect === 'string'
    );
}

function RegisterForm({ passwordRules }: { passwordRules: string }) {
    return (
        <Form
            {...registerStore.form()}
            resetOnSuccess={['password', 'password_confirmation']}
            className="space-y-5"
        >
            {({ processing, errors }) => (
                <>
                    <AccessField
                        label="Full name"
                        name="name"
                        autoComplete="name"
                        error={errors.name}
                    />
                    <AccessField
                        label="Email address"
                        name="email"
                        type="email"
                        autoComplete="email"
                        error={errors.email}
                    />
                    <div className="grid gap-5 sm:grid-cols-2">
                        <AccessField
                            label="Password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            error={errors.password}
                            passwordRules={passwordRules}
                        />
                        <AccessField
                            label="Confirm password"
                            name="password_confirmation"
                            type="password"
                            autoComplete="new-password"
                            error={errors.password_confirmation}
                            passwordRules={passwordRules}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="button-dark flex w-full items-center justify-center gap-3 disabled:cursor-wait disabled:opacity-60"
                    >
                        {processing && (
                            <LoaderCircle size={15} className="animate-spin" />
                        )}
                        Create account and continue
                    </button>
                    <p className="text-center text-[10px] leading-5 text-stone-500">
                        We’ll email a verification link before your first order
                        is placed.
                    </p>
                </>
            )}
        </Form>
    );
}

function LoginForm() {
    return (
        <Form
            {...loginStore.form()}
            resetOnSuccess={['password']}
            className="space-y-5"
        >
            {({ processing, errors }) => (
                <>
                    <AccessField
                        label="Email address"
                        name="email"
                        type="email"
                        autoComplete="username"
                        error={errors.email}
                    />
                    <AccessField
                        label="Password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        error={errors.password}
                    />
                    <div className="flex items-center justify-between gap-4 text-[10px]">
                        <label className="flex items-center gap-2">
                            <input
                                name="remember"
                                type="checkbox"
                                value="1"
                                className="h-4 w-4 accent-black"
                            />
                            Remember me
                        </label>
                        <Link
                            href="/forgot-password"
                            className="underline underline-offset-4"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="button-dark flex w-full items-center justify-center gap-3 disabled:cursor-wait disabled:opacity-60"
                    >
                        {processing && (
                            <LoaderCircle size={15} className="animate-spin" />
                        )}
                        Sign in and continue
                    </button>
                </>
            )}
        </Form>
    );
}

function AccessField({
    label,
    name,
    type = 'text',
    autoComplete,
    error,
    passwordRules,
}: {
    label: string;
    name: string;
    type?: string;
    autoComplete: string;
    error?: string;
    passwordRules?: string;
}) {
    return (
        <label className="field">
            <span>{label}</span>
            <input
                name={name}
                type={type}
                required
                autoComplete={autoComplete}
                passwordrules={passwordRules}
            />
            <InputError message={error} />
        </label>
    );
}

function GoogleMark() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
                fill="#4285F4"
                d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.797 2.715v2.258h2.909c1.702-1.567 2.684-3.875 2.684-6.614Z"
            />
            <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.181l-2.909-2.258c-.806.54-1.835.859-3.047.859-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A9 9 0 0 0 9 18Z"
            />
            <path
                fill="#FBBC05"
                d="M3.963 10.706A5.41 5.41 0 0 1 3.681 9c0-.592.102-1.168.282-1.706V4.962H.956A9 9 0 0 0 0 9c0 1.452.347 2.827.956 4.038l3.007-2.332Z"
            />
            <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.507.454 3.441 1.346l2.581-2.581C13.463.892 11.426 0 9 0A9 9 0 0 0 .956 4.962l3.007 2.332C4.672 5.165 6.656 3.58 9 3.58Z"
            />
        </svg>
    );
}

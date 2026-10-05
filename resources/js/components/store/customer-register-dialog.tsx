import { Form } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { store as registerStore } from '@/routes/register';

type CustomerRegisterDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    passwordRules: string;
    googleEnabled: boolean;
};

export default function CustomerRegisterDialog({
    open,
    onOpenChange,
    passwordRules,
    googleEnabled,
}: CustomerRegisterDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-brand-pink bg-brand-white p-6 sm:max-w-md sm:p-8">
                <DialogHeader className="pr-8 text-left">
                    <p className="eyebrow text-brand-rose">Your Ellena account</p>
                    <DialogTitle className="font-serif text-3xl tracking-[-.03em] text-brand-ink">
                        Begin your ritual.
                    </DialogTitle>
                    <DialogDescription className="text-sm leading-6 text-stone-600">
                        Save favourites, keep your details ready for checkout,
                        and follow your orders.
                    </DialogDescription>
                </DialogHeader>

                {googleEnabled && (
                    <a
                        href="/auth/google/redirect?return=register"
                        className="mt-2 flex w-full items-center justify-center gap-3 border border-black/15 bg-white px-4 py-3 text-xs font-semibold transition hover:border-brand-rose"
                    >
                        <GoogleMark />
                        Continue with Google
                    </a>
                )}

                {googleEnabled && (
                    <div className="flex items-center gap-3 text-[10px] font-semibold tracking-[.12em] text-stone-400 uppercase">
                        <span className="h-px flex-1 bg-brand-pink" />
                        <span>or use email</span>
                        <span className="h-px flex-1 bg-brand-pink" />
                    </div>
                )}

                <Form
                    {...registerStore.form()}
                    resetOnSuccess={['password', 'password_confirmation']}
                    disableWhileProcessing
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <DialogField
                                label="Full name"
                                name="name"
                                autoComplete="name"
                                autoFocus
                                error={errors.name}
                            />
                            <DialogField
                                label="Email address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                error={errors.email}
                            />
                            <DialogField
                                label="Password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                passwordRules={passwordRules}
                                error={errors.password}
                            />
                            <DialogField
                                label="Confirm password"
                                name="password_confirmation"
                                type="password"
                                autoComplete="new-password"
                                passwordRules={passwordRules}
                                error={errors.password_confirmation}
                            />
                            <button
                                type="submit"
                                disabled={processing}
                                className="button-dark flex w-full items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-60"
                            >
                                {processing && (
                                    <LoaderCircle size={15} className="animate-spin" />
                                )}
                                Create account
                            </button>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function DialogField({
    label,
    error,
    passwordRules,
    ...input
}: {
    label: string;
    name: string;
    type?: 'email' | 'password' | 'text';
    autoComplete: string;
    autoFocus?: boolean;
    error?: string;
    passwordRules?: string;
}) {
    const className =
        'mt-1.5 w-full border border-brand-pink bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-rose';

    return (
        <label className="block text-[10px] font-semibold tracking-[.13em] text-stone-600 uppercase">
            {label}
            {input.type === 'password' ? (
                <PasswordInput
                    {...input}
                    required
                    className={className}
                    passwordrules={passwordRules}
                />
            ) : (
                <input {...input} required className={className} />
            )}
            <InputError message={error} className="mt-1" />
        </label>
    );
}

function GoogleMark() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
            <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.5h3.2c1.9-1.8 3.1-4.4 3.1-7.4Z" />
            <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2 .9-3.5.9-2.7 0-5-1.8-5.8-4.3H2.9v2.6A10 10 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.2 13.7A6 6 0 0 1 5.9 12c0-.6.1-1.2.3-1.7V7.7H2.9A10 10 0 0 0 2 12c0 1.6.4 3.1.9 4.3l3.3-2.6Z" />
            <path fill="#EA4335" d="M12 6c1.5 0 2.9.5 3.9 1.5l2.9-2.9C17 2.9 14.7 2 12 2a10 10 0 0 0-9.1 5.7l3.3 2.6C7 7.8 9.3 6 12 6Z" />
        </svg>
    );
}

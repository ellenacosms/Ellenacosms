import { Form, Head, Link } from '@inertiajs/react';
import { LockKeyhole } from 'lucide-react';
import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

const backgroundImage =
    'https://lh3.googleusercontent.com/aida/AP1WRLtxR3xLxyHhnbO1efMc-WrvoPm3UDlZ1l6fiTrIi7mrHmTsiyADMwQl_Jib0EsrWyc9evTE85tLx22Qf1r9xkWQJ451RHGWsUbWST7hgdJlOm30a07BNqK84F7e0gNlLITDDjv9MxWgNXEtXahXPENhH3hINuqgUnDIZ-SeqgG5_nUQAgZyRXndbt1DnXxMXnpZFgsUzBfQ5N1oTv25T1dOZoI-V0cyLJCrqJt4Hk_GK2qVJQOGRUulsDcy';

export default function Login({ status, canResetPassword }: Props) {
    return (
        <div className="min-h-screen bg-[#fdf8f8] font-['Montserrat'] text-[#1c1b1b] selection:bg-[#f7e382]">
            <Head title="Administrative Portal" />

            <header className="fixed inset-x-0 top-0 z-50 border-b border-[#c4c7c7]/30 bg-[#fdf8f8]/85 backdrop-blur-md">
                <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 md:px-10 lg:px-20">
                    <Link
                        href="/"
                        className="font-serif text-3xl tracking-[.16em] text-black"
                    >
                        ELLENA
                    </Link>
                    <nav className="hidden items-center gap-6 md:flex">
                        <a
                            href="mailto:ellenacosms@gmail.com"
                            className="text-[10px] font-semibold tracking-[.17em] text-[#444748]/60 uppercase hover:text-black"
                        >
                            Support
                        </a>
                        <span className="h-4 w-px bg-[#c4c7c7]/60" />
                        <span className="border-b border-black pb-1 text-[10px] font-semibold tracking-[.17em] uppercase">
                            Admin portal
                        </span>
                    </nav>
                    <LockKeyhole
                        size={20}
                        strokeWidth={1.5}
                        aria-label="Secure portal"
                    />
                </div>
            </header>

            <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 pt-28 pb-20">
                <div className="absolute inset-0">
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-overlay"
                        style={{ backgroundImage: `url("${backgroundImage}")` }}
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(247,227,130,.15)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(255,217,221,.2)_0%,transparent_50%)]" />
                </div>

                <div className="relative z-10 w-full max-w-[480px]">
                    <div className="rounded-lg bg-white/90 px-7 py-10 shadow-[0_40px_80px_rgba(0,0,0,.06)] backdrop-blur-xl sm:px-12 sm:py-14 md:px-16">
                        <div className="mb-10 text-center">
                            <h1 className="font-serif text-5xl leading-tight text-black">
                                Welcome Back
                            </h1>
                            <p className="mt-3 text-[10px] font-semibold tracking-[.18em] text-[#444748] uppercase">
                                Identity verification required
                            </p>
                        </div>

                        {status && (
                            <div className="mb-7 border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-xs text-emerald-800">
                                {status}
                            </div>
                        )}

                        <Form
                            {...store.form()}
                            resetOnSuccess={['password']}
                            className="space-y-8"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="block text-[10px] font-semibold tracking-[.16em] text-[#444748] uppercase"
                                        >
                                            Username
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoFocus
                                            autoComplete="username"
                                            tabIndex={1}
                                            placeholder="Email or administrative ID"
                                            className="w-full border-0 border-b border-[#747878] bg-transparent px-0 py-3 text-sm shadow-none transition-all duration-300 outline-none placeholder:text-[#c4c7c7] focus:border-black focus:pl-2 focus:ring-0"
                                        />
                                        <InputError
                                            message={errors.email}
                                            className="mt-2"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="password"
                                            className="block text-[10px] font-semibold tracking-[.16em] text-[#444748] uppercase"
                                        >
                                            Password
                                        </label>
                                        <input
                                            id="password"
                                            type="password"
                                            name="password"
                                            required
                                            autoComplete="current-password"
                                            tabIndex={2}
                                            placeholder="••••••••"
                                            className="w-full border-0 border-b border-[#747878] bg-transparent px-0 py-3 text-sm shadow-none transition-all duration-300 outline-none placeholder:text-[#c4c7c7] focus:border-black focus:pl-2 focus:ring-0"
                                        />
                                        <InputError
                                            message={errors.password}
                                            className="mt-2"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between gap-4 pt-1">
                                        <label className="flex cursor-pointer items-center gap-2.5">
                                            <input
                                                id="remember"
                                                name="remember"
                                                type="checkbox"
                                                tabIndex={3}
                                                className="h-4 w-4 rounded-sm border-[#747878] text-black accent-black focus:ring-0"
                                            />
                                            <span className="text-[9px] font-semibold tracking-[.12em] text-[#444748] uppercase">
                                                Remember this device
                                            </span>
                                        </label>
                                        {canResetPassword && (
                                            <Link
                                                href={request()}
                                                tabIndex={5}
                                                className="shrink-0 text-[9px] font-semibold tracking-[.12em] text-[#444748] uppercase underline underline-offset-4 hover:text-black"
                                            >
                                                Forgot password?
                                            </Link>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        tabIndex={4}
                                        data-test="login-button"
                                        className="flex w-full items-center justify-center gap-3 bg-black py-5 text-[10px] font-semibold tracking-[.22em] text-white uppercase transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#313030] active:scale-[.98] disabled:translate-y-0 disabled:opacity-60"
                                    >
                                        {processing && <Spinner />}
                                        Sign in
                                    </button>
                                </>
                            )}
                        </Form>

                        <div className="mt-10 text-center text-xs leading-6 text-[#444748]/70">
                            <p>Unauthorized access is strictly prohibited.</p>
                            <Link
                                href={register()}
                                className="mt-3 inline-block text-[10px] font-semibold tracking-[.15em] text-black uppercase hover:opacity-60"
                            >
                                Request access
                            </Link>
                        </div>
                    </div>

                    <p className="mt-7 px-4 text-center font-serif text-lg leading-relaxed text-black/35 italic">
                        “Crafting the future of aesthetic excellence.”
                    </p>
                </div>
            </main>

            <footer className="border-t border-[#c4c7c7]/20 bg-[#fdf8f8] px-5 py-14">
                <div className="mx-auto flex max-w-[1440px] flex-col items-center">
                    <Link href="/" className="font-serif text-4xl">
                        ELLENA
                    </Link>
                    <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-[#444748]">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                        <span className="text-black underline underline-offset-4">
                            Administrative Portal
                        </span>
                    </div>
                    <p className="mt-7 text-[9px] tracking-[.16em] text-[#444748]/60 uppercase">
                        © {new Date().getFullYear()} Ellena Cosmetiques. All
                        rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}

import { Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    LoaderCircle,
    Menu,
    Search,
    ShoppingBag,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import CartDrawer from '@/components/store/cart-drawer';
import { CartDrawerContext } from '@/components/store/cart-drawer-context';
import SearchOverlay from '@/components/store/search-overlay';
import type { Category } from '@/types';
import type { CartSummary } from '@/types';

type SharedProps = {
    cart_count: number;
    auth: { user: { name: string } | null };
    flash: { success?: string };
    storeCategories: Category[];
    cart_summary: CartSummary;
};

export default function StoreLayout({ children }: { children: ReactNode }) {
    const { props, url } = usePage<SharedProps>();
    const { cart_count, cart_summary, auth, flash, storeCategories } = props;
    const [menuOpen, setMenuOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const newsletterForm = useForm({
        email: '',
        consent: false,
        source: 'footer',
        website: '',
    });

    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';

        return () => {
            document.body.style.overflow = '';
        };
    }, [menuOpen]);

    const categoryHref = (slug: string) =>
        slug === 'rituals' ? '/rituals' : `/shop?category=${slug}`;
    const categoryIsActive = (slug: string) =>
        slug === 'rituals'
            ? url.startsWith('/rituals')
            : url.includes(`category=${slug}`);
    const openCartDrawer = useCallback(() => {
        setMenuOpen(false);
        setSearchOpen(false);
        setCartOpen(true);
    }, []);
    const openSearch = () => {
        setMenuOpen(false);
        setCartOpen(false);
        setSearchOpen(true);
    };
    const cartDrawerContext = useMemo(
        () => ({ openCartDrawer }),
        [openCartDrawer],
    );

    return (
        <CartDrawerContext.Provider value={cartDrawerContext}>
            <div className="bg-ivory text-ink min-h-screen overflow-x-clip">
                <header className="fixed inset-x-0 top-0 z-50 border-b border-brand-pink/70 bg-brand-white/92 shadow-[0_8px_30px_rgba(143,40,74,.05)] backdrop-blur-xl">
                    <div className="border-b border-brand-gold/35 bg-brand-rose px-5 py-2.5 text-center text-[9px] font-semibold tracking-[.18em] text-white uppercase">
                        Thoughtful rituals, delivered with care
                    </div>
                    <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-3 items-center px-4 md:h-[76px] md:px-12 lg:px-20">
                        <button
                            type="button"
                            className="grid h-11 w-11 place-items-center justify-self-start md:hidden"
                            onClick={() => setMenuOpen((open) => !open)}
                            aria-label="Toggle menu"
                            aria-expanded={menuOpen}
                        >
                            {menuOpen ? <X size={21} /> : <Menu size={21} />}
                        </button>
                        <nav className="hidden items-center gap-6 md:flex lg:gap-8">
                            <Link
                                href="/shop"
                                className={`nav-link ${url === '/shop' ? 'active' : ''}`}
                                aria-current={
                                    url === '/shop' ? 'page' : undefined
                                }
                            >
                                Shop all
                            </Link>
                            {storeCategories.slice(0, 3).map((category) => (
                                <Link
                                    key={category.id}
                                    href={categoryHref(category.slug)}
                                    className={`nav-link ${categoryIsActive(category.slug) ? 'active' : ''}`}
                                    aria-current={
                                        categoryIsActive(category.slug)
                                            ? 'page'
                                            : undefined
                                    }
                                >
                                    {category.name}
                                </Link>
                            ))}
                        </nav>
                        <Link
                            href="/"
                            className="justify-self-center"
                            aria-label="Ellena home"
                        >
                            <img
                                src="/brand-logo.png?v=2"
                                alt="Ellena"
                                className="h-10 w-auto object-contain md:h-14"
                            />
                        </Link>
                        <div className="flex items-center gap-4 justify-self-end md:gap-5">
                            {auth.user && (
                                <Link
                                    href="/dashboard"
                                    className="nav-link hidden md:block"
                                >
                                    Account
                                </Link>
                            )}
                            <button
                                type="button"
                                onClick={openSearch}
                                aria-label="Search products"
                                className="grid h-11 w-11 place-items-center hover:text-brand-rose"
                            >
                                <Search size={19} />
                            </button>
                            <button
                                type="button"
                                onClick={openCartDrawer}
                                className="relative grid h-11 w-11 place-items-center hover:text-brand-rose"
                                aria-label={`Shopping bag with ${cart_count} items`}
                            >
                                <ShoppingBag size={20} />
                                {cart_count > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-gold px-1 text-[9px] text-brand-ink">
                                        {cart_count}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                    {menuOpen && (
                        <>
                            <button
                                type="button"
                                className="fixed inset-x-0 top-[99px] h-[calc(100vh-99px)] bg-black/25 backdrop-blur-[2px] md:hidden"
                                onClick={() => setMenuOpen(false)}
                                aria-label="Close menu"
                            />
                            <nav className="relative max-h-[calc(100vh-99px)] overflow-y-auto border-t border-brand-pink/70 bg-brand-white px-5 pb-10 md:hidden">
                                <Link
                                    href="/shop"
                                    className="mobile-link"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Shop all
                                    <ArrowRight size={15} />
                                </Link>
                                {storeCategories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={categoryHref(category.slug)}
                                        className="mobile-link"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        {category.name}
                                        <ArrowRight size={15} />
                                    </Link>
                                ))}
                                {auth.user && (
                                    <Link
                                        href="/dashboard"
                                        className="mobile-link"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Account
                                        <ArrowRight size={15} />
                                    </Link>
                                )}
                            </nav>
                        </>
                    )}
                </header>
                {flash?.success && (
                    <div className="fixed top-28 right-5 z-[60] max-w-sm border border-brand-gold/50 bg-brand-rose px-6 py-4 text-sm text-white shadow-xl">
                        {flash.success}
                    </div>
                )}
                <main>{children}</main>
                <CartDrawer
                    cart={cart_summary}
                    open={cartOpen}
                    onOpenChange={setCartOpen}
                />
                <SearchOverlay
                    categories={storeCategories}
                    open={searchOpen}
                    onOpenChange={setSearchOpen}
                />
                <footer className="border-t border-brand-gold/40 bg-brand-rose px-5 py-20 text-white md:px-12 lg:px-20">
                    <div className="mx-auto grid max-w-[1280px] gap-12 md:grid-cols-12 md:gap-8">
                        <div className="md:col-span-5">
                            <h2 className="brand-wordmark text-5xl text-brand-gold">
                                ELLENA
                            </h2>
                            <p className="mt-5 max-w-sm text-sm leading-7 text-white/70">
                                Exceptional beauty rituals, where botanical
                                intelligence meets molecular precision.
                            </p>
                        </div>
                        <div className="md:col-span-3">
                            <p className="eyebrow text-brand-gold">Explore</p>
                            <div className="mt-5 flex flex-col items-start gap-3 text-sm text-white/70">
                                <Link href="/shop" className="hover:text-white">
                                    All products
                                </Link>
                                {storeCategories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={categoryHref(category.slug)}
                                        className="hover:text-white"
                                    >
                                        {category.name}
                                    </Link>
                                ))}
                                <Link href="/cart" className="hover:text-white">
                                    Your bag
                                </Link>
                            </div>
                        </div>
                        <div className="md:col-span-4">
                            <p className="eyebrow text-brand-gold">
                                The private list
                            </p>
                            <p className="mt-5 text-sm leading-7 text-white/70">
                                New rituals, private launches, and thoughtful
                                notes.
                            </p>
                            <form
                                className="mt-5"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    newsletterForm.post('/newsletter', {
                                        preserveScroll: true,
                                        onSuccess: () => newsletterForm.reset(),
                                    });
                                }}
                            >
                                <div className="flex border-b border-brand-gold/60 pb-3 focus-within:border-brand-gold">
                                    <input
                                        type="email"
                                        required
                                        autoComplete="email"
                                        value={newsletterForm.data.email}
                                        onChange={(event) =>
                                            newsletterForm.setData(
                                                'email',
                                                event.target.value,
                                            )
                                        }
                                        className="w-full border-0 bg-transparent p-0 text-sm outline-none"
                                        placeholder="Email address"
                                        aria-label="Email address"
                                    />
                                    <button
                                        type="submit"
                                        disabled={newsletterForm.processing}
                                        className="eyebrow inline-flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {newsletterForm.processing && (
                                            <LoaderCircle
                                                size={13}
                                                className="animate-spin"
                                            />
                                        )}
                                        {newsletterForm.processing
                                            ? 'Joining…'
                                            : 'Join'}
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    tabIndex={-1}
                                    autoComplete="off"
                                    value={newsletterForm.data.website}
                                    onChange={(event) =>
                                        newsletterForm.setData(
                                            'website',
                                            event.target.value,
                                        )
                                    }
                                    className="absolute -left-[9999px]"
                                    aria-hidden="true"
                                />
                                <label className="mt-4 flex cursor-pointer items-start gap-3 text-[10px] leading-5 text-white/60">
                                    <input
                                        type="checkbox"
                                        required
                                        checked={newsletterForm.data.consent}
                                        onChange={(event) =>
                                            newsletterForm.setData(
                                                'consent',
                                                event.target.checked,
                                            )
                                        }
                                        className="mt-1 accent-brand-gold"
                                    />
                                    <span>
                                        I agree to receive Ellena news and can
                                        unsubscribe at any time.
                                    </span>
                                </label>
                                {(newsletterForm.errors.email ||
                                    newsletterForm.errors.consent) && (
                                    <p className="mt-3 text-xs text-red-700">
                                        {newsletterForm.errors.email ??
                                            newsletterForm.errors.consent}
                                    </p>
                                )}
                            </form>
                        </div>
                    </div>
                    <div className="mx-auto mt-16 flex max-w-[1280px] flex-col gap-3 border-t border-brand-gold/30 pt-7 text-[10px] tracking-widest text-white/50 uppercase sm:flex-row sm:justify-between">
                        <span>© {new Date().getFullYear()} Ellena Luxe</span>
                        <span>Crafted for refinement</span>
                    </div>
                </footer>
            </div>
        </CartDrawerContext.Provider>
    );
}

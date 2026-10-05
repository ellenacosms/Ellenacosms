import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ChevronDown,
    Heart,
    LoaderCircle,
    Menu,
    Search,
    ShoppingBag,
    UserRound,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import CartDrawer from '@/components/store/cart-drawer';
import { CartDrawerContext } from '@/components/store/cart-drawer-context';
import CustomerRegisterDialog from '@/components/store/customer-register-dialog';
import SearchPanel from '@/components/store/search-overlay';
import type { Category } from '@/types';
import type { CartSummary } from '@/types';

type SharedProps = {
    cart_count: number;
    auth: { user: { name: string } | null };
    flash: { success?: string };
    storeCategories: Category[];
    cart_summary: CartSummary;
    customerRegistration: {
        passwordRules: string;
        googleEnabled: boolean;
    };
};

export default function StoreLayout({ children }: { children: ReactNode }) {
    const { props, url } = usePage<SharedProps>();
    const {
        cart_count,
        cart_summary,
        auth,
        flash,
        storeCategories,
        customerRegistration,
    } = props;
    const [menuOpen, setMenuOpen] = useState(false);
    const [shopOpen, setShopOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [customerRegistrationOpen, setCustomerRegistrationOpen] = useState(false);
    const [headerSearchQuery, setHeaderSearchQuery] = useState('');
    const newsletterForm = useForm({
        email: '',
        consent: false,
        whatsapp_phone: '',
        whatsapp_marketing_consent: false,
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
        setShopOpen(false);
        setSearchOpen(false);
        setCartOpen(true);
    }, []);
    const openSearch = () => {
        setMenuOpen(false);
        setShopOpen(false);
        setCartOpen(false);
        setSearchOpen(true);
    };
    const openCustomerRegistration = useCallback(() => {
        setMenuOpen(false);
        setShopOpen(false);
        setSearchOpen(false);
        setCartOpen(false);
        setCustomerRegistrationOpen(true);
    }, []);

    useEffect(() => {
        window.addEventListener('ellena:open-registration', openCustomerRegistration);

        return () =>
            window.removeEventListener(
                'ellena:open-registration',
                openCustomerRegistration,
            );
    }, [openCustomerRegistration]);
    const changeSearchOpen = (open: boolean) => {
        setSearchOpen(open);

        if (!open) {
            setHeaderSearchQuery('');
        }
    };
    const submitHeaderSearch = (event: FormEvent) => {
        event.preventDefault();

        const query = headerSearchQuery.trim();

        if (!query) {
            openSearch();

            return;
        }

        changeSearchOpen(false);
        router.get('/shop', { search: query });
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
                        New rituals, thoughtful care, and delivery across Uganda
                    </div>
                    <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 md:h-[76px] md:gap-7 md:px-10 lg:px-16">
                        <button
                            type="button"
                            className="grid h-11 w-11 shrink-0 place-items-center md:hidden"
                            onClick={() => setMenuOpen((open) => !open)}
                            aria-label="Toggle menu"
                            aria-expanded={menuOpen}
                        >
                            {menuOpen ? <X size={21} /> : <Menu size={21} />}
                        </button>
                        <Link
                            href="/"
                            className="shrink-0 md:w-44"
                            aria-label="Ellena home"
                        >
                            <img
                                src="/brand-logo.png?v=2"
                                alt="Ellena"
                                className="h-10 w-auto object-contain md:h-12"
                            />
                        </Link>
                        {!searchOpen && (
                            <form
                                onSubmit={submitHeaderSearch}
                                role="search"
                                className="hidden min-w-0 flex-1 items-center gap-3 rounded-full border border-black/15 bg-white px-5 py-3 text-sm text-stone-700 shadow-sm transition focus-within:border-brand-rose focus-within:shadow-md hover:border-brand-rose hover:shadow-md md:flex"
                            >
                                <Search
                                    size={18}
                                    className="shrink-0 text-brand-rose"
                                />
                                <input
                                    type="search"
                                    value={headerSearchQuery}
                                    onFocus={openSearch}
                                    onChange={(event) => {
                                        setHeaderSearchQuery(
                                            event.target.value,
                                        );

                                        if (!searchOpen) {
                                            openSearch();
                                        }
                                    }}
                                    placeholder="Search products, ingredients, or concerns"
                                    className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-stone-400"
                                    aria-label="Search products"
                                    autoComplete="off"
                                />
                                <button
                                    type="submit"
                                    className="shrink-0 text-[10px] font-semibold tracking-[.14em] text-brand-rose uppercase transition hover:text-brand-ink"
                                >
                                    Search
                                </button>
                            </form>
                        )}
                        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
                            <button
                                type="button"
                                onClick={openSearch}
                                aria-label="Search products"
                                className="grid h-11 w-10 place-items-center hover:text-brand-rose md:hidden"
                            >
                                <Search size={19} />
                            </button>
                            {auth.user ? (
                                <Link
                                    href="/dashboard"
                                    className="hidden min-w-16 flex-col items-center gap-1 text-[9px] font-semibold tracking-[.08em] uppercase hover:text-brand-rose md:flex"
                                >
                                    <UserRound size={19} />
                                    <span>Account</span>
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={openCustomerRegistration}
                                    className="hidden min-w-16 flex-col items-center gap-1 text-[9px] font-semibold tracking-[.08em] uppercase hover:text-brand-rose md:flex"
                                >
                                    <UserRound size={19} />
                                    <span>Sign in</span>
                                </button>
                            )}
                            {auth.user ? (
                                <Link
                                    href="/dashboard#saved"
                                    className="hidden min-w-16 flex-col items-center gap-1 text-[9px] font-semibold tracking-[.08em] uppercase hover:text-brand-rose lg:flex"
                                >
                                    <Heart size={19} />
                                    <span>Wishlist</span>
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={openCustomerRegistration}
                                    className="hidden min-w-16 flex-col items-center gap-1 text-[9px] font-semibold tracking-[.08em] uppercase hover:text-brand-rose lg:flex"
                                >
                                    <Heart size={19} />
                                    <span>Wishlist</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={openCartDrawer}
                                className="relative flex h-11 min-w-11 flex-col items-center justify-center gap-1 px-1 text-[9px] font-semibold tracking-[.08em] uppercase hover:text-brand-rose md:min-w-16"
                                aria-label={`Shopping bag with ${cart_count} items`}
                            >
                                <ShoppingBag size={20} />
                                <span className="hidden md:block">Bag</span>
                                {cart_count > 0 && (
                                    <span className="absolute top-0 right-0 grid h-4 min-w-4 place-items-center rounded-full bg-brand-gold px-1 text-[9px] text-brand-ink">
                                        {cart_count}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                    <nav className="relative hidden border-t border-brand-pink/55 bg-brand-white md:block">
                        <div className="mx-auto flex h-11 max-w-[1280px] items-center justify-center gap-7 px-8 lg:gap-10">
                            <button
                                type="button"
                                onClick={() => setShopOpen((open) => !open)}
                                className={`nav-link inline-flex items-center gap-1 ${url.startsWith('/shop') ? 'active' : ''}`}
                                aria-expanded={shopOpen}
                                aria-haspopup="true"
                            >
                                Shop <ChevronDown size={13} />
                            </button>
                            <Link
                                href="/discover"
                                className={`nav-link ${url.startsWith('/discover') ? 'active' : ''}`}
                            >
                                Discover
                            </Link>
                            <Link
                                href="/shop?edit=new-noteworthy"
                                className="nav-link"
                            >
                                New
                            </Link>
                            {storeCategories.map((category) => (
                                <Link
                                    key={category.id}
                                    href={categoryHref(category.slug)}
                                    className={`nav-link ${categoryIsActive(category.slug) ? 'active' : ''}`}
                                >
                                    {category.name}
                                </Link>
                            ))}
                            <Link
                                href="/shop?edit=available-now"
                                className="nav-link hidden lg:block"
                            >
                                Available now
                            </Link>
                            <Link
                                href="/find-your-ellena"
                                className="nav-link hidden lg:block"
                            >
                                Find your Ellena
                            </Link>
                            <Link
                                href="/beauty-guide"
                                className="nav-link hidden xl:block"
                            >
                                Beauty guide
                            </Link>
                        </div>
                        {shopOpen && (
                            <div className="absolute inset-x-0 top-full border-y border-brand-pink bg-brand-white shadow-[0_24px_60px_rgba(43,32,36,.16)]">
                                <div className="mx-auto grid max-w-[1180px] grid-cols-4 gap-10 px-10 py-8">
                                    <MenuColumn
                                        title="Hair care"
                                        links={[
                                            [
                                                'Hair food',
                                                '/shop?category=hair-care&search=hair+food',
                                            ],
                                            [
                                                'Hair oil',
                                                '/shop?category=hair-care&search=hair+oil',
                                            ],
                                            [
                                                'Styling',
                                                '/shop?category=hair-care&search=styling',
                                            ],
                                            [
                                                'Shop all hair',
                                                '/shop?category=hair-care',
                                            ],
                                        ]}
                                        onNavigate={() => setShopOpen(false)}
                                    />
                                    <MenuColumn
                                        title="Body & baby"
                                        links={[
                                            [
                                                'Body lotion',
                                                '/shop?category=body-care&search=lotion',
                                            ],
                                            [
                                                'Body oils',
                                                '/shop?category=body-care&search=oil',
                                            ],
                                            [
                                                'Baby care',
                                                '/shop?category=baby-care',
                                            ],
                                            [
                                                'Shop all body',
                                                '/shop?category=body-care',
                                            ],
                                        ]}
                                        onNavigate={() => setShopOpen(false)}
                                    />
                                    <MenuColumn
                                        title="Fragrance"
                                        links={[
                                            [
                                                'Perfume',
                                                '/shop?category=fragrance&search=perfume',
                                            ],
                                            [
                                                'Everyday fragrance',
                                                '/shop?category=fragrance',
                                            ],
                                            [
                                                'Shop fragrance',
                                                '/shop?category=fragrance',
                                            ],
                                        ]}
                                        onNavigate={() => setShopOpen(false)}
                                    />
                                    <MenuColumn
                                        title="Discover"
                                        links={[
                                            ['Discovery room', '/discover'],
                                            [
                                                'New arrivals',
                                                '/shop?edit=new-noteworthy',
                                            ],
                                            [
                                                'Available now',
                                                '/shop?edit=available-now',
                                            ],
                                            ['Ritual sets', '/rituals'],
                                            [
                                                'Find your Ellena',
                                                '/find-your-ellena',
                                            ],
                                        ]}
                                        onNavigate={() => setShopOpen(false)}
                                    />
                                </div>
                            </div>
                        )}
                    </nav>
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
                                    Shop all products
                                    <ArrowRight size={15} />
                                </Link>
                                <Link
                                    href="/discover"
                                    className="mobile-link"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Discover <ArrowRight size={15} />
                                </Link>
                                <Link
                                    href="/shop?edit=new-noteworthy"
                                    className="mobile-link"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    New arrivals <ArrowRight size={15} />
                                </Link>
                                <Link
                                    href="/shop?edit=available-now"
                                    className="mobile-link"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Available now <ArrowRight size={15} />
                                </Link>
                                <Link
                                    href="/find-your-ellena"
                                    className="mobile-link"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Find your Ellena <ArrowRight size={15} />
                                </Link>
                                <Link
                                    href="/beauty-guide"
                                    className="mobile-link"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Beauty guide <ArrowRight size={15} />
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
                                {!auth.user && (
                                    <button
                                        type="button"
                                        className="mobile-link w-full text-left"
                                        onClick={openCustomerRegistration}
                                    >
                                        Create account
                                        <ArrowRight size={15} />
                                    </button>
                                )}
                                <div className="mt-5 border-t border-brand-pink/70 pt-5">
                                    <p className="eyebrow mb-2 text-stone-500">
                                        Discover Ellena
                                    </p>
                                    <Link
                                        href="/about"
                                        className="mobile-link"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        About Ellena
                                        <ArrowRight size={15} />
                                    </Link>
                                    <Link
                                        href="/contact"
                                        className="mobile-link"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Contact & help
                                        <ArrowRight size={15} />
                                    </Link>
                                </div>
                            </nav>
                        </>
                    )}
                    <SearchPanel
                        categories={storeCategories}
                        open={searchOpen}
                        onOpenChange={changeSearchOpen}
                        initialQuery={headerSearchQuery}
                        onQueryChange={setHeaderSearchQuery}
                    />
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
                <footer className="border-t border-brand-gold/40 bg-brand-rose text-white">
                    <div className="mx-auto grid max-w-[1280px] gap-12 px-5 py-16 md:px-10 md:py-20 lg:grid-cols-[1.15fr_.85fr_.85fr_1.25fr] lg:gap-10">
                        <div>
                            <h2 className="brand-wordmark text-5xl text-brand-gold">
                                ELLENA
                            </h2>
                            <p className="mt-5 max-w-sm text-sm leading-7 text-white/70">
                                Exceptional beauty rituals for hair, body, baby
                                care, and fragrance. Thoughtfully selected for
                                everyday glow.
                            </p>
                            <div className="mt-7 space-y-2 text-sm text-white/65">
                                <p>Delivery across Uganda</p>
                                <p>WhatsApp support for product guidance</p>
                                <p>Secure checkout and order updates</p>
                            </div>
                        </div>
                        <div>
                            <p className="eyebrow text-brand-gold">Shop</p>
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
                                <Link
                                    href="/shop?sort=newest"
                                    className="hover:text-white"
                                >
                                    New arrivals
                                </Link>
                                <Link
                                    href="/shop?edit=available-now"
                                    className="hover:text-white"
                                >
                                    Available now
                                </Link>
                            </div>
                        </div>
                        <div>
                            <p className="eyebrow text-brand-gold">Discover</p>
                            <div className="mt-5 flex flex-col items-start gap-3 text-sm text-white/70">
                                <Link
                                    href="/discover"
                                    className="hover:text-white"
                                >
                                    Discovery room
                                </Link>
                                <Link
                                    href="/find-your-ellena"
                                    className="hover:text-white"
                                >
                                    Find your Ellena
                                </Link>
                                <Link
                                    href="/beauty-guide"
                                    className="hover:text-white"
                                >
                                    Beauty guide
                                </Link>
                                <Link
                                    href="/rituals"
                                    className="hover:text-white"
                                >
                                    Ritual sets
                                </Link>
                                <Link href="/cart" className="hover:text-white">
                                    Your bag
                                </Link>
                            </div>
                        </div>
                        <div className="border border-brand-gold/35 bg-white/10 p-5 backdrop-blur-sm sm:p-6">
                            <p className="eyebrow text-brand-gold">
                                The private list
                            </p>
                            <p className="mt-4 text-sm leading-7 text-white/70">
                                Join for private launches, restock notes, beauty
                                guides, and WhatsApp-friendly offers.
                            </p>
                            <form
                                className="mt-6 space-y-4"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    newsletterForm.post('/newsletter', {
                                        preserveScroll: true,
                                        onSuccess: () => newsletterForm.reset(),
                                    });
                                }}
                            >
                                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
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
                                        className="min-h-12 border border-brand-gold/45 bg-brand-rose-dark/45 px-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-brand-gold"
                                        placeholder="Email address"
                                        aria-label="Email address"
                                    />
                                    <button
                                        type="submit"
                                        disabled={newsletterForm.processing}
                                        className="inline-flex min-h-12 items-center justify-center gap-2 border border-brand-gold bg-brand-gold px-5 text-[10px] font-semibold tracking-[.16em] text-brand-ink uppercase transition hover:bg-white disabled:opacity-50"
                                    >
                                        {newsletterForm.processing && (
                                            <LoaderCircle
                                                size={13}
                                                className="animate-spin"
                                            />
                                        )}
                                        {newsletterForm.processing
                                            ? 'Joining...'
                                            : 'Join'}
                                    </button>
                                </div>
                                <input
                                    type="tel"
                                    autoComplete="tel"
                                    value={newsletterForm.data.whatsapp_phone}
                                    onChange={(event) =>
                                        newsletterForm.setData(
                                            'whatsapp_phone',
                                            event.target.value,
                                        )
                                    }
                                    className="min-h-12 w-full border border-brand-gold/35 bg-brand-rose-dark/35 px-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-brand-gold"
                                    placeholder="WhatsApp number (optional)"
                                    aria-label="WhatsApp number"
                                />
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
                                <div className="space-y-3 border-t border-brand-gold/25 pt-4">
                                    <label className="flex cursor-pointer items-start gap-3 text-[10px] leading-5 text-white/60">
                                        <input
                                            type="checkbox"
                                            required
                                            checked={
                                                newsletterForm.data.consent
                                            }
                                            onChange={(event) =>
                                                newsletterForm.setData(
                                                    'consent',
                                                    event.target.checked,
                                                )
                                            }
                                            className="mt-1 accent-brand-gold"
                                        />
                                        <span>
                                            I agree to receive Ellena news and
                                            can unsubscribe at any time.
                                        </span>
                                    </label>
                                    <label className="flex cursor-pointer items-start gap-3 text-[10px] leading-5 text-white/60">
                                        <input
                                            type="checkbox"
                                            checked={
                                                newsletterForm.data
                                                    .whatsapp_marketing_consent
                                            }
                                            onChange={(event) =>
                                                newsletterForm.setData(
                                                    'whatsapp_marketing_consent',
                                                    event.target.checked,
                                                )
                                            }
                                            className="mt-1 accent-brand-gold"
                                        />
                                        <span>
                                            Send me Ellena product and offer
                                            updates on WhatsApp.
                                        </span>
                                    </label>
                                </div>
                                {(newsletterForm.errors.email ||
                                    newsletterForm.errors.consent ||
                                    newsletterForm.errors.whatsapp_phone ||
                                    newsletterForm.errors
                                        .whatsapp_marketing_consent) && (
                                    <p className="text-xs text-red-100">
                                        {newsletterForm.errors.email ??
                                            newsletterForm.errors.consent ??
                                            newsletterForm.errors
                                                .whatsapp_phone ??
                                            newsletterForm.errors
                                                .whatsapp_marketing_consent}
                                    </p>
                                )}
                            </form>
                        </div>
                        <div className="lg:col-span-4">
                            <div className="grid gap-6 border-t border-brand-gold/30 pt-8 md:grid-cols-[1fr_auto] md:items-end">
                                <div>
                                    <p className="eyebrow text-brand-gold">
                                        Support
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-white/70">
                                        <Link
                                            href="/about"
                                            className="hover:text-white"
                                        >
                                            About Ellena
                                        </Link>
                                        <Link
                                            href="/contact"
                                            className="hover:text-white"
                                        >
                                            Contact & help
                                        </Link>
                                        <Link
                                            href="/delivery-returns"
                                            className="hover:text-white"
                                        >
                                            Delivery & returns
                                        </Link>
                                        <Link
                                            href="/faqs"
                                            className="hover:text-white"
                                        >
                                            FAQs
                                        </Link>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 text-[10px] tracking-[.16em] text-white/50 uppercase md:items-end">
                                    <span>
                                        (c) {new Date().getFullYear()} Ellena
                                        Luxe
                                    </span>
                                    <span>Crafted for refinement</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
            <CustomerRegisterDialog
                open={customerRegistrationOpen}
                onOpenChange={setCustomerRegistrationOpen}
                passwordRules={customerRegistration.passwordRules}
                googleEnabled={customerRegistration.googleEnabled}
            />
        </CartDrawerContext.Provider>
    );
}

function MenuColumn({
    title,
    links,
    onNavigate,
}: {
    title: string;
    links: Array<[string, string]>;
    onNavigate: () => void;
}) {
    return (
        <div>
            <p className="eyebrow text-brand-gold">{title}</p>
            <div className="mt-5 flex flex-col items-start gap-3">
                {links.map(([label, href]) => (
                    <Link
                        key={label}
                        href={href}
                        onClick={onNavigate}
                        className="text-sm text-stone-600 hover:text-brand-rose"
                    >
                        {label}
                    </Link>
                ))}
            </div>
        </div>
    );
}

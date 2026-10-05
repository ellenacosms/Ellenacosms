import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Droplets,
    FlaskConical,
    HeartHandshake,
    Leaf,
    PackageCheck,
    Rabbit,
    Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import ProductCard from '@/components/store/product-card';
import SeoHead from '@/components/store/seo-head';
import StoreImage from '@/components/store/store-image';
import type { Banner, Category, MerchandisingEdit, Product } from '@/types';

const defaultHero = '/images/campaign/ellena-braids-hero-v2.png';
const collectionImages = [
    '/images/campaign/ellena-hair-care-dark.png',
    '/images/campaign/ellena-body-care-dark.png',
    '/images/campaign/ellena-rituals-dark.png',
];
const collectionImageBySlug: Record<string, string> = {
    'hair-care': '/images/catalog/hair-care-editorial.png',
    'body-care': '/images/catalog/body-care-editorial.png',
    'baby-care': '/images/campaign/ellena-family-care-banner.png',
    fragrance: '/images/catalog/rituals-editorial.png',
};
const categoryEditorialBySlug: Record<
    string,
    { kicker: string; copy: string }
> = {
    'hair-care': {
        kicker: 'The crown ritual',
        copy: 'Moisture, strength, and polish for every texture and every style.',
    },
    'body-care': {
        kicker: 'Skin, considered',
        copy: 'Daily nourishment designed to leave skin soft and beautifully cared for.',
    },
    'baby-care': {
        kicker: 'Gentle beginnings',
        copy: 'Comforting family essentials for delicate everyday moments.',
    },
    fragrance: {
        kicker: 'Your signature',
        copy: 'Memorable notes selected to complete the ritual.',
    },
};
const categoryLayout = [
    'min-h-[500px] sm:col-span-2 lg:col-span-7 lg:row-span-2 lg:min-h-0',
    'min-h-[340px] lg:col-span-5 lg:min-h-0',
    'min-h-[320px] lg:col-span-3 lg:min-h-0',
    'min-h-[320px] lg:col-span-2 lg:min-h-0',
];
const categoryHref = (slug: string) =>
    slug === 'rituals' ? '/rituals' : `/shop?category=${slug}`;
const concernCards = [
    {
        title: 'Hydration',
        copy: 'Bring lasting comfort back to dry hair and skin.',
        href: '/find-your-ellena',
        icon: Droplets,
    },
    {
        title: 'Strength & repair',
        copy: 'Give stressed lengths a more restorative starting point.',
        href: '/shop?category=hair-care&concern=strength-repair',
        icon: Sparkles,
    },
    {
        title: 'Everyday care',
        copy: 'Build a simple routine you will want to return to.',
        href: '/rituals',
        icon: HeartHandshake,
    },
];

const guidePreviews = [
    ['Hair care', 'Build a moisture-first hair ritual'],
    ['Body care', 'Body lotion, oil, or both?'],
    ['Beauty rituals', 'Make an evening ritual feel restorative'],
];

export default function Home({
    featured,
    latestProducts,
    categories,
    heroBanner,
    promotionBanners,
    merchandisingEdits,
}: {
    featured: Product[];
    latestProducts: Product[];
    categories: Category[];
    heroBanner?: Banner | null;
    promotionBanners: Banner[];
    merchandisingEdits: MerchandisingEdit[];
}) {
    const [promotionIndex, setPromotionIndex] = useState(0);
    const [heroLoaded, setHeroLoaded] = useState(false);
    const [categoryOffset, setCategoryOffset] = useState(0);
    const [categoryRotationPaused, setCategoryRotationPaused] = useState(false);
    const featuredCategories = categories.slice(0, 4);
    const rotatingCategories = featuredCategories.map(
        (_, index) =>
            featuredCategories[
                (index + categoryOffset) % featuredCategories.length
            ],
    );

    useEffect(() => {
        if (promotionBanners.length < 2) {
            return;
        }

        const interval = window.setInterval(() => {
            setPromotionIndex(
                (current) => (current + 1) % promotionBanners.length,
            );
        }, 7000);

        return () => window.clearInterval(interval);
    }, [promotionBanners.length]);

    useEffect(() => {
        if (featuredCategories.length < 2 || categoryRotationPaused) {
            return;
        }

        const interval = window.setInterval(() => {
            setCategoryOffset(
                (current) => (current + 1) % featuredCategories.length,
            );
        }, 6000);

        return () => window.clearInterval(interval);
    }, [featuredCategories.length, categoryRotationPaused]);

    return (
        <>
            <SeoHead
                title="Beauty, Hair Care & Body Care Products in Uganda"
                description="Shop Ellena Beauty online for thoughtful hair care, body care, and beauty essentials in Uganda."
            />
            <section className="relative flex min-h-[760px] items-center overflow-hidden pt-24 md:min-h-screen">
                {!heroLoaded && (
                    <div
                        className="skeleton-shimmer absolute inset-0"
                        aria-hidden="true"
                    />
                )}
                <picture className="absolute inset-0">
                    {heroBanner?.mobile_image && (
                        <source
                            media="(max-width: 767px)"
                            srcSet={heroBanner.mobile_image}
                        />
                    )}
                    <img
                        src={heroBanner?.image ?? defaultHero}
                        alt={
                            heroBanner?.name ??
                            'Radiant skin in soft morning light'
                        }
                        onLoad={() => setHeroLoaded(true)}
                        fetchPriority="high"
                        decoding="async"
                        className={`h-full w-full animate-[editorial-drift_18s_ease-in-out_infinite_alternate] object-cover transition-opacity duration-1000 ${heroLoaded ? 'opacity-100' : 'opacity-0'}`}
                    />
                </picture>
                <div
                    className="absolute inset-0 bg-black"
                    style={{
                        opacity: (heroBanner?.overlay_opacity ?? 0) / 100,
                    }}
                />
                {!heroBanner && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/5 to-transparent" />
                )}
                <div className="relative mx-auto w-full max-w-[1440px] px-5 py-28 md:px-12 lg:px-20">
                    <div
                        className={`max-w-2xl ${heroBanner?.text_position === 'center' ? 'mx-auto text-center' : heroBanner?.text_position === 'right' ? 'ml-auto text-right' : ''} ${heroBanner ? 'text-white' : ''}`}
                    >
                        <p className="eyebrow mb-6">
                            {heroBanner?.eyebrow ?? 'Hair + body rituals'}
                        </p>
                        <h1 className="hero-heading whitespace-pre-line">
                            {heroBanner?.title ?? 'The Aura of\nRefinement'}
                        </h1>
                        <p
                            className={`mt-8 max-w-lg text-base leading-8 font-light ${heroBanner ? 'text-white/85' : 'text-stone-700'} ${heroBanner?.text_position === 'center' ? 'mx-auto' : heroBanner?.text_position === 'right' ? 'ml-auto' : ''}`}
                        >
                            {heroBanner?.subtitle ??
                                'Considered formulas for the moments that make up your day. Sensory care for hair, body, and every ritual in between.'}
                        </p>
                        <div
                            className={`mt-10 flex flex-wrap gap-3 ${heroBanner?.text_position === 'center' ? 'justify-center' : heroBanner?.text_position === 'right' ? 'justify-end' : ''}`}
                        >
                            <Link
                                href={heroBanner?.cta_url ?? '/shop'}
                                className={
                                    heroBanner ? 'button-light' : 'button-dark'
                                }
                            >
                                {heroBanner?.cta_label ?? 'Shop the collection'}
                            </Link>
                            {!heroBanner && (
                                <Link href="/rituals" className="button-light">
                                    Explore your ritual
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-y border-brand-pink/70 bg-brand-blush px-5 py-6">
                <div className="mx-auto grid max-w-[1100px] grid-cols-2 gap-x-6 gap-y-5 text-[9px] font-semibold tracking-[.14em] uppercase md:grid-cols-4 md:text-[10px]">
                    {[
                        [Rabbit, 'Cruelty free'],
                        [Leaf, '100% vegan'],
                        [FlaskConical, 'Clean ingredients'],
                        [PackageCheck, 'Considered packaging'],
                    ].map(([Icon, label]) => {
                        const TrustIcon = Icon as typeof Rabbit;

                        return (
                            <span
                                key={label as string}
                                className="flex items-center justify-center gap-3 text-brand-rose"
                            >
                                <TrustIcon size={17} />
                                {label as string}
                            </span>
                        );
                    })}
                </div>
            </section>

            <section className="store-container py-14 md:py-20">
                <div className="grid gap-7 border border-brand-pink bg-white/55 p-6 sm:p-9 lg:grid-cols-[1.05fr_1.95fr] lg:items-center">
                    <div>
                        <p className="eyebrow text-gold">Find your Ellena</p>
                        <h2 className="subsection-heading mt-4">
                            Care, chosen for your moment.
                        </h2>
                        <p className="mt-4 max-w-sm text-sm leading-7 text-stone-600">
                            Answer two simple questions and discover a more
                            considered starting point for your ritual.
                        </p>
                        <Link
                            href="/find-your-ellena"
                            className="button-dark mt-7 inline-flex"
                        >
                            Start the finder <ArrowRight size={15} />
                        </Link>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {concernCards.map(
                            ({ title, copy, href, icon: Icon }) => (
                                <Link
                                    key={title}
                                    href={href}
                                    className="group border border-brand-pink bg-brand-blush p-5 transition hover:-translate-y-1 hover:border-brand-gold hover:bg-white"
                                >
                                    <Icon
                                        size={18}
                                        className="text-brand-rose"
                                    />
                                    <h3 className="mt-7 font-serif text-2xl">
                                        {title}
                                    </h3>
                                    <p className="mt-3 text-sm leading-6 text-stone-600">
                                        {copy}
                                    </p>
                                    <span className="mt-5 inline-flex items-center gap-2 text-[9px] font-semibold tracking-[.13em] uppercase group-hover:text-brand-rose">
                                        Explore <ArrowRight size={12} />
                                    </span>
                                </Link>
                            ),
                        )}
                    </div>
                </div>
            </section>

            <section className="store-container store-section">
                <div className="mb-12 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
                    <div className="max-w-2xl">
                        <p className="eyebrow">The Ellena departments</p>
                        <h2 className="section-heading mt-4">
                            Begin with your ritual.
                        </h2>
                    </div>
                    <p className="body-copy max-w-md md:text-right">
                        Four considered worlds of care, composed to make every
                        discovery feel beautifully simple.
                    </p>
                </div>
                <div
                    className="grid gap-4 sm:grid-cols-2 lg:auto-rows-[300px] lg:grid-cols-12"
                    onMouseEnter={() => setCategoryRotationPaused(true)}
                    onMouseLeave={() => setCategoryRotationPaused(false)}
                    onFocusCapture={() => setCategoryRotationPaused(true)}
                    onBlurCapture={() => setCategoryRotationPaused(false)}
                >
                    {rotatingCategories.map((category, index) => {
                        const editorial = categoryEditorialBySlug[
                            category.slug
                        ] ?? {
                            kicker: 'The collection',
                            copy: 'Thoughtful essentials for a beautifully considered routine.',
                        };

                        return (
                            <Link
                                key={`${category.id}-${categoryOffset}`}
                                href={categoryHref(category.slug)}
                                className={`group relative isolate animate-in overflow-hidden bg-stone-800 text-white shadow-[0_18px_48px_rgba(45,37,28,.12)] duration-700 zoom-in-95 fade-in ${categoryLayout[index]}`}
                            >
                                <StoreImage
                                    src={
                                        category.image ??
                                        collectionImageBySlug[category.slug] ??
                                        collectionImages[
                                            index % collectionImages.length
                                        ]
                                    }
                                    alt={`${category.name} collection`}
                                    loading="lazy"
                                    decoding="async"
                                    wrapperClassName="absolute inset-0"
                                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.045]"
                                />
                                <span className="absolute inset-0 z-10 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />
                                <span className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-6 lg:p-7">
                                    <span className="eyebrow text-white/75">
                                        {editorial.kicker}
                                    </span>
                                    <span className="font-serif text-sm text-white/70">
                                        0{index + 1}
                                    </span>
                                </span>
                                <span className="absolute inset-x-0 bottom-0 z-20 p-6 lg:p-8">
                                    <span className="eyebrow text-white/65">
                                        {category.products_count
                                            ? `${category.products_count} formulas`
                                            : 'Explore the collection'}
                                    </span>
                                    <span
                                        className={`mt-3 block font-serif leading-[.95] tracking-[-.025em] ${index === 0 ? 'text-5xl sm:text-6xl lg:text-7xl' : index === 3 ? 'text-3xl xl:text-4xl' : 'text-4xl lg:text-5xl'}`}
                                    >
                                        {category.name}
                                    </span>
                                    <span
                                        className={`mt-4 max-w-md text-sm leading-6 text-white/75 ${index > 1 ? 'hidden' : 'block'}`}
                                    >
                                        {category.description || editorial.copy}
                                    </span>
                                    <span className="mt-6 inline-flex items-center gap-3 border-b border-white/70 pb-1.5 text-[10px] font-semibold tracking-[.15em] uppercase transition-all group-hover:gap-5 group-hover:border-brand-gold group-hover:text-brand-gold">
                                        Shop products <ArrowRight size={12} />
                                    </span>
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </section>

            <section className="border-y border-brand-pink/70 bg-brand-blush px-5 py-16 md:py-20">
                <div className="mx-auto max-w-[1280px]">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div>
                            <p className="eyebrow">Shop by concern</p>
                            <h2 className="section-heading mt-4">
                                Start with what you need.
                            </h2>
                        </div>
                        <Link
                            href="/find-your-ellena"
                            className="text-link shrink-0"
                        >
                            Need guidance? <ArrowRight size={13} />
                        </Link>
                    </div>
                    <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            [
                                'Hydration',
                                '/shop?category=hair-care&concern=hydration',
                            ],
                            [
                                'Strength & repair',
                                '/shop?category=hair-care&concern=strength-repair',
                            ],
                            [
                                'Scalp care',
                                '/shop?category=hair-care&concern=scalp-care',
                            ],
                            [
                                'Softness',
                                '/shop?category=hair-care&concern=softness',
                            ],
                        ].map(([label, href]) => (
                            <Link
                                key={label}
                                href={href}
                                className="border border-brand-pink bg-white/60 px-5 py-6 font-serif text-2xl transition hover:border-brand-rose hover:bg-brand-rose hover:text-white"
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {promotionBanners.length > 0 && (
                <section className="store-container pb-20 md:pb-28">
                    <div className="relative min-h-[500px] overflow-hidden bg-stone-900 text-white shadow-[0_24px_60px_rgba(40,32,24,.12)]">
                        {promotionBanners.map((banner) => (
                            <Link
                                key={banner.id}
                                href={banner.cta_url ?? '/shop'}
                                aria-hidden={
                                    promotionBanners[promotionIndex].id !==
                                    banner.id
                                }
                                tabIndex={
                                    promotionBanners[promotionIndex].id ===
                                    banner.id
                                        ? 0
                                        : -1
                                }
                                className={`group absolute inset-0 transition-opacity duration-1000 ease-out ${promotionBanners[promotionIndex].id === banner.id ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'}`}
                            >
                                <picture className="absolute inset-0">
                                    {banner.mobile_image && (
                                        <source
                                            media="(max-width: 767px)"
                                            srcSet={banner.mobile_image}
                                        />
                                    )}
                                    <img
                                        src={banner.image}
                                        alt={banner.name}
                                        className="h-full w-full animate-[editorial-drift_18s_ease-in-out_infinite_alternate] object-cover transition duration-[7000ms] ease-out group-hover:scale-105"
                                    />
                                </picture>
                                <div
                                    className="absolute inset-0 bg-black"
                                    style={{
                                        opacity: banner.overlay_opacity / 100,
                                    }}
                                />
                                <div
                                    className={`relative flex h-full min-h-[430px] flex-col justify-end p-8 md:p-12 ${banner.text_position === 'center' ? 'items-center text-center' : banner.text_position === 'right' ? 'items-end text-right' : 'items-start'}`}
                                >
                                    {banner.eyebrow && (
                                        <p className="eyebrow text-white/70">
                                            {banner.eyebrow}
                                        </p>
                                    )}
                                    <h2 className="section-heading mt-3 max-w-xl whitespace-pre-line">
                                        {banner.title}
                                    </h2>
                                    {banner.subtitle && (
                                        <p className="mt-4 max-w-lg text-sm leading-7 text-white/80">
                                            {banner.subtitle}
                                        </p>
                                    )}
                                    {banner.cta_label && (
                                        <span className="mt-7 border-b border-white pb-2 text-xs font-semibold tracking-widest uppercase">
                                            {banner.cta_label}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))}
                        {promotionBanners.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPromotionIndex(
                                            (current) =>
                                                (current -
                                                    1 +
                                                    promotionBanners.length) %
                                                promotionBanners.length,
                                        )
                                    }
                                    className="absolute top-1/2 left-5 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-black/20 text-white backdrop-blur-sm transition hover:bg-black/50"
                                    aria-label="Previous promotion"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPromotionIndex(
                                            (current) =>
                                                (current + 1) %
                                                promotionBanners.length,
                                        )
                                    }
                                    className="absolute top-1/2 right-5 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-black/20 text-white backdrop-blur-sm transition hover:bg-black/50"
                                    aria-label="Next promotion"
                                >
                                    <ChevronRight size={18} />
                                </button>
                                <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                                    {promotionBanners.map((banner, index) => (
                                        <button
                                            key={banner.id}
                                            type="button"
                                            onClick={() =>
                                                setPromotionIndex(index)
                                            }
                                            className={`h-1 transition-all duration-500 ${index === promotionIndex ? 'w-10 bg-white' : 'w-5 bg-white/50'}`}
                                            aria-label={`Go to promotion ${index + 1}`}
                                            aria-current={
                                                index === promotionIndex
                                            }
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </section>
            )}

            {merchandisingEdits.length > 0 && (
                <section className="store-container pb-20 md:pb-28">
                    <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div>
                            <p className="eyebrow">Curated discovery</p>
                            <h2 className="section-heading mt-4">
                                See the collection differently.
                            </h2>
                        </div>
                        <Link href="/discover" className="text-link shrink-0">
                            Enter the discovery room <ArrowRight size={13} />
                        </Link>
                    </div>
                    <div className="grid gap-px overflow-hidden border border-brand-pink bg-brand-pink sm:grid-cols-2 lg:grid-cols-4">
                        {merchandisingEdits.map((edit, index) => (
                            <Link
                                key={edit.slug}
                                href={edit.href}
                                className="group relative isolate min-h-80 overflow-hidden bg-stone-900 text-white"
                            >
                                <StoreImage
                                    src={edit.image}
                                    alt={edit.title}
                                    className="object-cover transition duration-1000 group-hover:scale-[1.04]"
                                    wrapperClassName="absolute inset-0"
                                />
                                <span className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/20 to-black/5" />
                                <span className="absolute inset-x-0 top-0 z-20 flex justify-between p-5">
                                    <span className="eyebrow text-white/70">
                                        {edit.eyebrow}
                                    </span>
                                    <span className="font-serif text-sm text-white/60">
                                        0{index + 1}
                                    </span>
                                </span>
                                <span className="absolute inset-x-0 bottom-0 z-20 p-5">
                                    <span className="block font-serif text-3xl leading-tight">
                                        {edit.title}
                                    </span>
                                    <span className="mt-3 block text-xs leading-5 text-white/70">
                                        {edit.products_count}{' '}
                                        {edit.products_count === 1
                                            ? 'formula'
                                            : 'formulas'}{' '}
                                        in this product collection
                                    </span>
                                    <span className="mt-5 inline-flex items-center gap-2 text-[9px] font-semibold tracking-[.13em] uppercase group-hover:text-brand-gold">
                                        Explore <ArrowRight size={11} />
                                    </span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {featured.length > 0 && (
                <section className="store-container pb-20 md:pb-28">
                    <div className="mb-12 flex items-end justify-between">
                        <div>
                            <p className="eyebrow">Most loved</p>
                            <h2 className="section-heading mt-3">
                                Bestsellers
                            </h2>
                            <p className="mt-4 max-w-lg text-sm leading-7 text-stone-600">
                                Signature formulas chosen for exceptional
                                performance and a refined daily ritual.
                            </p>
                        </div>
                        <Link
                            href="/shop?edit=available-now"
                            className="text-link hidden md:inline-flex"
                        >
                            Shop bestsellers <ArrowRight size={15} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4">
                        {featured.map((product) => (
                            <ProductCard product={product} key={product.id} />
                        ))}
                    </div>
                </section>
            )}

            {latestProducts.length > 0 && (
                <section className="border-y border-brand-pink/70 bg-brand-blush">
                    <div className="store-container store-section">
                        <div className="mb-12 flex items-end justify-between gap-6">
                            <div>
                                <p className="eyebrow">Just arrived</p>
                                <h2 className="section-heading mt-3">
                                    Latest products
                                </h2>
                                <p className="mt-4 max-w-lg text-sm leading-7 text-stone-600">
                                    Discover the newest additions to the ELLENA
                                    collection.
                                </p>
                            </div>
                            <Link
                                href="/shop?edit=new-noteworthy"
                                className="text-link hidden md:inline-flex"
                            >
                                Shop new arrivals <ArrowRight size={15} />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4">
                            {latestProducts.map((product) => (
                                <ProductCard
                                    product={product}
                                    key={product.id}
                                />
                            ))}
                        </div>
                        <Link
                            href="/shop?edit=new-noteworthy"
                            className="button-dark mt-12 md:hidden"
                        >
                            Shop new arrivals
                        </Link>
                    </div>
                </section>
            )}

            <section className="store-container store-section">
                <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div>
                        <p className="eyebrow">The Ellena beauty guide</p>
                        <h2 className="section-heading mt-4">
                            Better rituals begin with useful guidance.
                        </h2>
                    </div>
                    <Link href="/beauty-guide" className="text-link shrink-0">
                        Visit the guide <ArrowRight size={13} />
                    </Link>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {guidePreviews.map(([category, title]) => (
                        <Link
                            key={title}
                            href="/beauty-guide"
                            className="group border border-brand-pink bg-white/55 p-6 transition hover:-translate-y-1 hover:border-brand-gold"
                        >
                            <BookOpen size={18} className="text-brand-rose" />
                            <p className="eyebrow text-gold mt-7">{category}</p>
                            <h3 className="mt-4 font-serif text-3xl leading-tight">
                                {title}
                            </h3>
                            <span className="mt-7 inline-flex items-center gap-2 text-[10px] font-semibold tracking-[.12em] uppercase group-hover:text-brand-rose">
                                Read guide <ArrowRight size={13} />
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            <section
                id="ritual"
                className="grid bg-brand-rose text-white lg:grid-cols-2"
            >
                <div className="flex items-center px-6 py-20 md:px-20 lg:py-32">
                    <div className="max-w-lg">
                        <p className="eyebrow text-brand-gold">
                            Guided discovery
                        </p>
                        <h2 className="section-heading mt-5">
                            Find the ritual
                            <br />
                            made for you
                        </h2>
                        <p className="mt-7 leading-8 font-light text-white/70">
                            A few thoughtful answers can guide you toward the
                            care that suits your needs and daily rhythm.
                        </p>
                        <Link
                            href="/find-your-ellena"
                            className="mt-10 inline-flex items-center gap-3 border-b border-brand-gold pb-2 text-xs font-semibold tracking-widest uppercase hover:text-brand-gold"
                        >
                            Find your Ellena <ArrowRight size={15} />
                        </Link>
                    </div>
                </div>
                <StoreImage
                    src="/images/campaign/ellena-braids-hero-v2.png"
                    alt="An elevated Ellena care ritual"
                    className="object-cover"
                    wrapperClassName="min-h-[480px] lg:min-h-[620px]"
                    loading="lazy"
                />
            </section>
            {categories.length === 0 && (
                <div className="p-10 text-center">
                    The collection is being prepared.
                </div>
            )}
        </>
    );
}

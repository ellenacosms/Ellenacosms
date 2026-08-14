import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    FlaskConical,
    Leaf,
    PackageCheck,
    Rabbit,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import ProductCard from '@/components/store/product-card';
import SeoHead from '@/components/store/seo-head';
import StoreImage from '@/components/store/store-image';
import type { Banner, Category, Product } from '@/types';

const defaultHero = '/images/campaign/ellena-braids-hero-v2.png';
const collectionImages = [
    '/images/campaign/ellena-hair-care-dark.png',
    '/images/campaign/ellena-body-care-dark.png',
    '/images/campaign/ellena-rituals-dark.png',
];
const categoryHref = (slug: string) =>
    slug === 'rituals' ? '/rituals' : `/shop?category=${slug}`;

export default function Home({
    featured,
    latestProducts,
    categories,
    heroBanner,
    promotionBanners,
}: {
    featured: Product[];
    latestProducts: Product[];
    categories: Category[];
    heroBanner?: Banner | null;
    promotionBanners: Banner[];
}) {
    const [promotionIndex, setPromotionIndex] = useState(0);
    const [heroLoaded, setHeroLoaded] = useState(false);

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

            <section className="store-container store-section">
                <div className="mb-12 max-w-2xl">
                    <p className="eyebrow">Shop by ritual</p>
                    <h2 className="section-heading mt-4">
                        Care that belongs in your day.
                    </h2>
                    <p className="body-copy mt-5 max-w-xl">
                        Start with the ritual that feels like you. Each edit is
                        composed to make choosing beautifully simple.
                    </p>
                </div>
                <div className="grid gap-5 md:grid-cols-12">
                    {categories.slice(0, 3).map((category, index) => (
                        <Link
                            key={category.id}
                            href={categoryHref(category.slug)}
                            className={`collection-tile ${index === 0 ? 'md:col-span-7 md:row-span-2' : 'aspect-[4/3] md:col-span-5'}`}
                        >
                            <StoreImage
                                src={
                                    category.image ??
                                    collectionImages[
                                        index % collectionImages.length
                                    ]
                                }
                                alt={`${category.name} collection`}
                                loading="lazy"
                                decoding="async"
                                className="object-cover"
                            />
                            <div>
                                <p className="eyebrow text-white/70">
                                    {category.products_count
                                        ? `${category.products_count} formulas`
                                        : 'The collection'}
                                </p>
                                <h2>{category.name}</h2>
                                <span>Explore edit</span>
                            </div>
                        </Link>
                    ))}
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

            {featured.length > 0 && (
                <section className="store-container pb-20 md:pb-28">
                    <div className="mb-12 flex items-end justify-between">
                        <div>
                            <p className="eyebrow">Selected by ELLENA</p>
                            <h2 className="section-heading mt-3">
                                Featured products
                            </h2>
                            <p className="mt-4 max-w-lg text-sm leading-7 text-stone-600">
                                Signature formulas chosen for exceptional
                                performance and a refined daily ritual.
                            </p>
                        </div>
                        <Link
                            href="/shop"
                            className="text-link hidden md:inline-flex"
                        >
                            View all <ArrowRight size={15} />
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
                                href="/shop"
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
                            href="/shop"
                            className="button-dark mt-12 md:hidden"
                        >
                            Shop new arrivals
                        </Link>
                    </div>
                </section>
            )}

            <section
                id="ritual"
                className="grid bg-brand-rose text-white lg:grid-cols-2"
            >
                <div className="flex items-center px-6 py-20 md:px-20 lg:py-32">
                    <div className="max-w-lg">
                        <p className="eyebrow text-brand-gold">
                            Personal consultation
                        </p>
                        <h2 className="section-heading mt-5">
                            Find your
                            <br />
                            signature glow
                        </h2>
                        <p className="mt-7 leading-8 font-light text-white/70">
                            Build a considered regimen around your hair and body
                            needs, preferred textures, and daily rhythm.
                        </p>
                        <Link
                            href="/rituals"
                            className="mt-10 inline-flex items-center gap-3 border-b border-brand-gold pb-2 text-xs font-semibold tracking-widest uppercase hover:text-brand-gold"
                        >
                            Begin the ritual <ArrowRight size={15} />
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

import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Droplets,
    Leaf,
    LoaderCircle,
    Minus,
    Plus,
    ShieldCheck,
    Sparkles,
    Star,
    Truck,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useCartDrawer } from '@/components/store/cart-drawer-context';
import ProductCard from '@/components/store/product-card';
import SeoHead from '@/components/store/seo-head';
import StoreImage from '@/components/store/store-image';
import WishlistButton from '@/components/store/wishlist-button';
import { money } from '@/lib/money';
import type { Product as ProductType, Review } from '@/types';

export default function Product({
    product,
    related,
    reviews,
    canReview,
    recentlyViewed,
}: {
    product: ProductType;
    related: ProductType[];
    reviews: Review[];
    canReview: boolean;
    recentlyViewed: ProductType[];
}) {
    const [quantity, setQuantity] = useState(1);
    const [imageIndex, setImageIndex] = useState(0);
    const [isAdding, setIsAdding] = useState(false);
    const { openCartDrawer } = useCartDrawer();
    const reviewForm = useForm({ rating: 5, title: '', body: '' });
    const { storeSettings } = usePage<{
        storeSettings: Record<string, string>;
    }>().props;
    const lowStockThreshold = Number(storeSettings.low_stock_threshold ?? 10);
    const freeShippingThreshold = Number(
        storeSettings.free_shipping_threshold ?? 150,
    );
    const add = () =>
        router.post(
            `/cart/${product.id}`,
            { quantity },
            {
                preserveScroll: true,
                onStart: () => setIsAdding(true),
                onSuccess: openCartDrawer,
                onFinish: () => setIsAdding(false),
            },
        );
    const submitReview = (event: FormEvent) => {
        event.preventDefault();
        reviewForm.post(`/products/${product.slug}/reviews`, {
            preserveScroll: true,
            onSuccess: () => reviewForm.reset(),
        });
    };
    const images = product.images?.length ? product.images : [''];
    const benefits = product.benefits?.slice(0, 3) ?? [];
    const concerns = product.concerns ?? [];
    const ritualSteps = product.ritual_steps?.length
        ? product.ritual_steps
        : product.usage
          ? [product.usage]
          : [];
    const keyIngredients =
        product.ingredients
            ?.split(/\r?\n|,/)
            .map((ingredient) => ingredient.trim())
            .filter(Boolean)
            .slice(0, 4) ?? [];
    const reviewAverage = reviews.length
        ? reviews.reduce((total, review) => total + review.rating, 0) /
          reviews.length
        : 0;
    const featuredReview = reviews[0];
    const categoryKeyword = product.category?.name
        ? `${product.category.name} Uganda`
        : 'Beauty Products Uganda';
    const seoTitle = `${product.name} | ${categoryKeyword}`;
    const seoDescription = [
        `Buy ${product.name} online in Uganda from Ellena Beauty.`,
        product.subtitle || product.description,
    ]
        .join(' ')
        .replace(/\s+/g, ' ')
        .slice(0, 160);

    return (
        <>
            <SeoHead
                title={seoTitle}
                description={seoDescription}
                canonicalPath={`/products/${product.slug}`}
                image={product.images?.[0]}
                type="product"
                structuredData={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Product',
                        name: product.name,
                        description: seoDescription,
                        sku: product.sku,
                        image: product.images,
                        brand: { '@type': 'Brand', name: 'Ellena Beauty' },
                        offers: {
                            '@type': 'Offer',
                            priceCurrency: 'UGX',
                            price: product.price,
                            availability:
                                product.stock > 0
                                    ? 'https://schema.org/InStock'
                                    : 'https://schema.org/OutOfStock',
                            url: `/products/${product.slug}`,
                        },
                    },
                    {
                        '@context': 'https://schema.org',
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                            {
                                '@type': 'ListItem',
                                position: 1,
                                name: 'Home',
                                item: '/',
                            },
                            {
                                '@type': 'ListItem',
                                position: 2,
                                name: 'Shop',
                                item: '/shop',
                            },
                            ...(product.category
                                ? [
                                      {
                                          '@type': 'ListItem',
                                          position: 3,
                                          name: product.category.name,
                                          item: `/shop?category=${product.category.slug}`,
                                      },
                                  ]
                                : []),
                            {
                                '@type': 'ListItem',
                                position: product.category ? 4 : 3,
                                name: product.name,
                                item: `/products/${product.slug}`,
                            },
                        ],
                    },
                ]}
            />
            <section className="mx-auto grid max-w-[1440px] gap-12 px-5 pt-36 pb-36 md:grid-cols-12 md:px-10 md:pb-28 lg:gap-16 lg:px-20">
                <div className="md:col-span-7">
                    <div className="relative aspect-[4/5] overflow-hidden bg-stone-100 md:aspect-[5/4]">
                        {images.map((image, index) => (
                            <div
                                key={image + index}
                                className={`absolute inset-0 transition-opacity duration-1000 ease-out ${index === imageIndex ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'}`}
                            >
                                {image ? (
                                    <StoreImage
                                        src={image}
                                        alt={`${product.name} view ${index + 1}`}
                                        className="object-cover"
                                    />
                                ) : (
                                    <span className="grid h-full place-items-center font-serif text-5xl text-stone-400">
                                        ELLENA
                                    </span>
                                )}
                            </div>
                        ))}
                        {images.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setImageIndex(
                                            (current) =>
                                                (current - 1 + images.length) %
                                                images.length,
                                        )
                                    }
                                    className="icon-button absolute top-1/2 left-4 z-20 -translate-y-1/2"
                                    aria-label="Previous product image"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setImageIndex(
                                            (current) =>
                                                (current + 1) % images.length,
                                        )
                                    }
                                    className="icon-button absolute top-1/2 right-4 z-20 -translate-y-1/2"
                                    aria-label="Next product image"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </>
                        )}
                    </div>
                    {images.length > 1 && (
                        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                            {images.map((image, index) => (
                                <button
                                    key={image + index}
                                    type="button"
                                    onClick={() => setImageIndex(index)}
                                    className={`h-20 w-16 shrink-0 overflow-hidden border-2 bg-stone-100 transition ${index === imageIndex ? 'border-black' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    aria-label={`View product image ${index + 1}`}
                                    aria-current={index === imageIndex}
                                >
                                    {image && (
                                        <StoreImage
                                            src={image}
                                            alt=""
                                            className="object-cover"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="md:col-span-5 lg:col-span-4 lg:col-start-9">
                    <div className="sticky top-28">
                        <div className="flex gap-2 text-[10px] font-semibold tracking-widest text-stone-500 uppercase">
                            <Link href="/shop">Shop all</Link>
                            {product.category && (
                                <>
                                    <span>/</span>
                                    <Link
                                        href={`/shop?category=${product.category.slug}`}
                                    >
                                        {product.category.name}
                                    </Link>
                                </>
                            )}
                        </div>
                        <h1 className="product-heading mt-6">{product.name}</h1>
                        {product.subtitle && (
                            <p className="eyebrow mt-4 text-stone-500">
                                {product.subtitle}
                            </p>
                        )}
                        <div className="mt-5 flex items-center gap-3">
                            <p className="price-text">{money(product.price)}</p>
                            {product.compare_price && (
                                <p className="text-xs text-stone-400 line-through">
                                    {money(product.compare_price)}
                                </p>
                            )}
                        </div>
                        <p className="body-copy mt-7 !text-sm !leading-7">
                            {product.description}
                        </p>
                        {benefits.length > 0 && (
                            <div className="mt-8 grid gap-3 border-y border-black/10 py-6">
                                {benefits.map((benefit, index) => {
                                    const BenefitIcon =
                                        [Sparkles, Droplets, ShieldCheck][
                                            index
                                        ] ?? Sparkles;

                                    return (
                                        <div
                                            key={benefit}
                                            className="flex items-center gap-3 text-sm"
                                        >
                                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-blush text-brand-rose">
                                                <BenefitIcon size={16} />
                                            </span>
                                            <span>{benefit}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {concerns.length > 0 && (
                            <div className="mt-6">
                                <p className="eyebrow text-stone-500">
                                    Best for
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {concerns.map((concern) => (
                                        <span
                                            key={concern}
                                            className="rounded-full border border-black/15 px-3 py-2 text-[10px] font-semibold tracking-wider uppercase"
                                        >
                                            {concern}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="mt-9 flex gap-3">
                            <div className="flex h-14 items-center border border-black/20 bg-white/50">
                                <button
                                    onClick={() =>
                                        setQuantity(Math.max(1, quantity - 1))
                                    }
                                    className="px-4"
                                    aria-label="Decrease quantity"
                                >
                                    <Minus size={15} />
                                </button>
                                <span className="w-8 text-center text-xs">
                                    {quantity}
                                </span>
                                <button
                                    onClick={() =>
                                        setQuantity(
                                            Math.min(
                                                product.stock,
                                                quantity + 1,
                                            ),
                                        )
                                    }
                                    className="px-4"
                                    aria-label="Increase quantity"
                                >
                                    <Plus size={15} />
                                </button>
                            </div>
                            <button
                                onClick={add}
                                disabled={product.stock < 1 || isAdding}
                                className="button-dark h-14 flex-1 disabled:opacity-40"
                            >
                                {isAdding && (
                                    <LoaderCircle
                                        className="mr-2 animate-spin"
                                        size={15}
                                    />
                                )}
                                {isAdding
                                    ? 'Adding…'
                                    : product.stock > 0
                                      ? 'Add to bag'
                                      : 'Sold out'}
                            </button>
                            <WishlistButton
                                product={product}
                                className="h-14 w-14 shrink-0 border border-black/20 bg-white/50 hover:border-black hover:bg-white"
                            />
                        </div>
                        <p className="mt-3 text-center text-[10px] tracking-widest text-stone-500 uppercase">
                            {product.stock < 1
                                ? 'Currently sold out'
                                : product.stock > lowStockThreshold
                                  ? 'In stock · Dispatches in 1–2 days'
                                  : `Only ${product.stock} remaining`}
                        </p>
                        <div className="mt-8 grid grid-cols-3 gap-3 border-y border-black/10 py-5 text-center">
                            {[
                                [Truck, 'Fast dispatch'],
                                [ShieldCheck, 'Secure checkout'],
                                [Sparkles, 'Thoughtful formula'],
                            ].map(([Icon, label]) => {
                                const ProductIcon = Icon as typeof Truck;

                                return (
                                    <div
                                        key={label as string}
                                        className="flex flex-col items-center gap-2"
                                    >
                                        <ProductIcon size={17} />
                                        <span className="text-[9px] leading-4 font-semibold tracking-wider text-stone-500 uppercase">
                                            {label as string}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-10 border-t border-black/15">
                            {[
                                ['Ingredients', product.ingredients],
                                ['How to use', product.usage],
                                [
                                    'Delivery & returns',
                                    `Complimentary delivery on orders over ${money(freeShippingThreshold)}. Returns accepted within 30 days in original condition.`,
                                ],
                            ].map(([label, content]) => (
                                <details
                                    key={label}
                                    className="group border-b border-black/15"
                                >
                                    <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-xs font-semibold tracking-widest uppercase">
                                        {label}
                                        <ChevronDown
                                            size={16}
                                            className="group-open:rotate-180"
                                        />
                                    </summary>
                                    <p className="pb-6 text-sm leading-7 whitespace-pre-line text-stone-600">
                                        {content}
                                    </p>
                                </details>
                            ))}
                        </div>
                        {featuredReview && (
                            <div className="mt-8 border-l border-black/20 pl-5">
                                <div className="text-gold flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={14}
                                            fill={
                                                star <= featuredReview.rating
                                                    ? 'currentColor'
                                                    : 'none'
                                            }
                                        />
                                    ))}
                                </div>
                                <p className="mt-4 text-sm leading-6 text-stone-600 italic">
                                    “{featuredReview.body}”
                                </p>
                                <p className="mt-3 text-[10px] tracking-widest uppercase">
                                    — {featuredReview.customer_name}
                                    {featuredReview.is_verified_purchase &&
                                        ', verified purchase'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
            {(keyIngredients.length > 0 || ritualSteps.length > 0) && (
                <section className="border-y border-brand-pink/70 bg-brand-blush">
                    <div className="store-container store-section grid gap-16 lg:grid-cols-2">
                        <div>
                            <p className="eyebrow">Inside the formula</p>
                            <h2 className="section-heading mt-4 max-w-lg">
                                Ingredients with intention.
                            </h2>
                            <p className="mt-5 max-w-lg text-sm leading-7 text-stone-600">
                                A focused edit of ingredients selected to
                                support this formula’s core ritual benefits.
                            </p>
                            <div className="mt-9 grid gap-3 sm:grid-cols-2">
                                {keyIngredients.map((ingredient, index) => (
                                    <div
                                        key={`${ingredient}-${index}`}
                                        className="surface-card flex min-h-24 items-start gap-4 p-5"
                                    >
                                        <Leaf
                                            size={17}
                                            className="mt-0.5 shrink-0"
                                        />
                                        <p className="text-sm leading-6">
                                            {ingredient}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="eyebrow">The method</p>
                            <h2 className="section-heading mt-4">
                                Your ritual, step by step.
                            </h2>
                            <div className="mt-9 border-t border-black/15">
                                {ritualSteps.map((step, index) => (
                                    <div
                                        key={`${step}-${index}`}
                                        className="grid grid-cols-[48px_1fr] gap-5 border-b border-black/15 py-6"
                                    >
                                        <span className="font-serif text-2xl text-stone-400">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <p className="text-sm leading-7 text-stone-700">
                                            {step}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}
            <section className="store-container store-section grid gap-12 lg:grid-cols-[1fr_380px]">
                <div>
                    <p className="eyebrow">Collector notes</p>
                    <div className="mt-4 flex flex-wrap items-end gap-5">
                        <h2 className="section-heading">Reviews</h2>
                        {reviews.length > 0 && (
                            <p className="mb-1 text-xs tracking-widest text-stone-500 uppercase">
                                {reviewAverage.toFixed(1)} / 5 ·{' '}
                                {reviews.length}{' '}
                                {reviews.length === 1 ? 'note' : 'notes'}
                            </p>
                        )}
                    </div>
                    <div className="mt-10 divide-y divide-black/10 border-y border-black/10">
                        {!reviews.length && (
                            <p className="py-8 text-sm text-stone-500">
                                Be the first verified collector to share a note.
                            </p>
                        )}
                        {reviews.map((review) => (
                            <article key={review.id} className="py-7">
                                <div className="text-gold flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={13}
                                            fill={
                                                star <= review.rating
                                                    ? 'currentColor'
                                                    : 'none'
                                            }
                                        />
                                    ))}
                                </div>
                                <h3 className="card-heading mt-3 !text-2xl">
                                    {review.title || 'A collector note'}
                                </h3>
                                <p className="mt-2 text-sm leading-7 text-stone-600">
                                    {review.body}
                                </p>
                                <p className="mt-4 text-[10px] tracking-widest text-stone-500 uppercase">
                                    {review.customer_name}
                                    {review.is_verified_purchase &&
                                        ' · Verified purchase'}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
                <div>
                    {canReview ? (
                        <form
                            onSubmit={submitReview}
                            className="surface-card p-7"
                        >
                            <p className="eyebrow">Your experience</p>
                            <h3 className="subsection-heading mt-3">
                                Leave a review
                            </h3>
                            <label className="mt-6 block text-xs font-semibold tracking-wider uppercase">
                                Rating
                                <select
                                    value={reviewForm.data.rating}
                                    onChange={(event) =>
                                        reviewForm.setData(
                                            'rating',
                                            Number(event.target.value),
                                        )
                                    }
                                    className="mt-2 block w-full border border-black/15 bg-white px-3 py-3"
                                >
                                    {[5, 4, 3, 2, 1].map((rating) => (
                                        <option key={rating} value={rating}>
                                            {rating} stars
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="mt-5 block text-xs font-semibold tracking-wider uppercase">
                                Title
                                <input
                                    value={reviewForm.data.title}
                                    onChange={(event) =>
                                        reviewForm.setData(
                                            'title',
                                            event.target.value,
                                        )
                                    }
                                    className="mt-2 block w-full border border-black/15 bg-white px-3 py-3"
                                />
                            </label>
                            <label className="mt-5 block text-xs font-semibold tracking-wider uppercase">
                                Review
                                <textarea
                                    required
                                    minLength={10}
                                    value={reviewForm.data.body}
                                    onChange={(event) =>
                                        reviewForm.setData(
                                            'body',
                                            event.target.value,
                                        )
                                    }
                                    className="mt-2 block min-h-32 w-full border border-black/15 bg-white px-3 py-3"
                                />
                            </label>
                            <button
                                disabled={reviewForm.processing}
                                className="button-dark mt-6 w-full disabled:opacity-50"
                            >
                                {reviewForm.processing && (
                                    <LoaderCircle
                                        className="mr-2 animate-spin"
                                        size={15}
                                    />
                                )}
                                {reviewForm.processing
                                    ? 'Submitting…'
                                    : 'Submit for approval'}
                            </button>
                        </form>
                    ) : (
                        <p className="surface-card p-7 text-sm leading-7 text-stone-600">
                            Complete a purchase of this product to leave a
                            verified review.
                        </p>
                    )}
                </div>
            </section>
            {related.length > 0 && (
                <section className="store-container pb-20 md:pb-28">
                    <p className="eyebrow">Complete the ritual</p>
                    <h2 className="section-heading mt-4">Refine the ritual</h2>
                    <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                        {related.map((item) => (
                            <ProductCard key={item.id} product={item} />
                        ))}
                    </div>
                </section>
            )}
            {recentlyViewed.length > 0 && (
                <section className="border-t border-brand-pink/70 bg-brand-blush">
                    <div className="store-container store-section">
                        <p className="eyebrow">Return to your edit</p>
                        <h2 className="section-heading mt-4">
                            Recently viewed
                        </h2>
                        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                            {recentlyViewed.map((item) => (
                                <ProductCard key={item.id} product={item} />
                            ))}
                        </div>
                    </div>
                </section>
            )}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-pink/70 bg-brand-white/95 px-4 py-3 shadow-[0_-12px_35px_rgba(143,40,74,.12)] backdrop-blur lg:hidden">
                <div className="mx-auto flex max-w-xl items-center gap-3">
                    <p className="min-w-0 flex-1 font-serif text-xl leading-tight">
                        {money(product.price)}
                    </p>
                    <button
                        type="button"
                        onClick={add}
                        disabled={product.stock < 1 || isAdding}
                        className="button-dark h-12 min-w-[190px] disabled:opacity-40"
                    >
                        {isAdding
                            ? 'Adding…'
                            : product.stock > 0
                              ? 'Add to bag'
                              : 'Sold out'}
                    </button>
                </div>
            </div>
        </>
    );
}

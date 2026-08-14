import { Link, router } from '@inertiajs/react';
import { Eye, LoaderCircle, ShoppingBag, Star } from 'lucide-react';
import { useState } from 'react';
import { useCartDrawer } from '@/components/store/cart-drawer-context';
import ProductQuickView from '@/components/store/product-quick-view';
import StoreImage from '@/components/store/store-image';
import WishlistButton from '@/components/store/wishlist-button';
import { money } from '@/lib/money';
import type { Product } from '@/types';

export default function ProductCard({ product }: { product: Product }) {
    const [isAdding, setIsAdding] = useState(false);
    const { openCartDrawer } = useCartDrawer();
    const primaryImage = product.images?.[0];
    const secondaryImage = product.images?.[1];
    const price = Number(product.price);
    const comparePrice = Number(product.compare_price ?? 0);
    const isOnSale = comparePrice > price;
    const savingPercentage = isOnSale
        ? Math.round(((comparePrice - price) / comparePrice) * 100)
        : 0;
    const reviewCount = Number(product.reviews_count ?? 0);
    const averageRating = Number(product.reviews_avg_rating ?? 0);
    const lowStock = product.stock > 0 && product.stock <= 5;

    return (
        <article
            className={`product-card group h-full ${secondaryImage ? 'has-secondary' : ''}`}
        >
            <div className="product-card__image">
                <Link
                    href={`/products/${product.slug}`}
                    aria-label={`View ${product.name}`}
                    className="block h-full"
                >
                    {primaryImage ? (
                        <>
                            <StoreImage
                                src={primaryImage}
                                alt={product.name}
                                loading="lazy"
                                decoding="async"
                                className="object-cover"
                                wrapperClassName="product-card__primary-image"
                            />
                            {secondaryImage && (
                                <StoreImage
                                    src={secondaryImage}
                                    alt=""
                                    aria-hidden="true"
                                    loading="lazy"
                                    decoding="async"
                                    className="object-cover"
                                    wrapperClassName="product-card__secondary-image"
                                />
                            )}
                        </>
                    ) : (
                        <span className="grid h-full place-items-center font-serif text-4xl text-stone-400">
                            ELLENA
                        </span>
                    )}
                </Link>
                <div className="product-card__badges">
                    {product.stock < 1 ? (
                        <span className="product-card__badge">Sold out</span>
                    ) : (
                        <>
                            {isOnSale && (
                                <span className="product-card__badge product-card__badge--sale">
                                    Save {savingPercentage}%
                                </span>
                            )}
                            {product.is_featured && (
                                <span className="product-card__badge">
                                    Bestseller
                                </span>
                            )}
                            {lowStock && (
                                <span className="product-card__badge product-card__badge--stock">
                                    Only {product.stock} left
                                </span>
                            )}
                        </>
                    )}
                </div>
                <WishlistButton
                    product={product}
                    className="product-card__wishlist"
                />
                <ProductQuickView product={product}>
                    <button
                        type="button"
                        className="product-card__quick-view"
                        aria-label={`Quick view ${product.name}`}
                    >
                        <Eye size={15} />
                        <span>Quick view</span>
                    </button>
                </ProductQuickView>
                <button
                    type="button"
                    disabled={product.stock < 1 || isAdding}
                    onClick={() =>
                        router.post(
                            `/cart/${product.id}`,
                            { quantity: 1 },
                            {
                                preserveScroll: true,
                                onStart: () => setIsAdding(true),
                                onSuccess: openCartDrawer,
                                onFinish: () => setIsAdding(false),
                            },
                        )
                    }
                    className="product-card__cart"
                    aria-label={`${product.stock > 0 ? 'Add' : 'Unavailable'} ${product.name}`}
                >
                    {isAdding ? (
                        <LoaderCircle className="animate-spin" size={15} />
                    ) : (
                        <ShoppingBag size={15} />
                    )}
                    {isAdding
                        ? 'Adding…'
                        : product.stock > 0
                          ? 'Add to bag'
                          : 'Unavailable'}
                </button>
            </div>
            <div className="mt-5 px-0.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-stone-500">
                    {product.category?.name && (
                        <p className="eyebrow">{product.category.name}</p>
                    )}
                    {reviewCount > 0 ? (
                        <p
                            className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[.08em]"
                            aria-label={`${averageRating.toFixed(1)} out of 5 stars from ${reviewCount} reviews`}
                        >
                            <Star
                                size={11}
                                fill="currentColor"
                                aria-hidden="true"
                            />
                            {averageRating.toFixed(1)} ({reviewCount})
                        </p>
                    ) : (
                        <p className="text-[9px] font-semibold tracking-[.14em] uppercase">
                            New formula
                        </p>
                    )}
                </div>
                <div className="mt-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <Link href={`/products/${product.slug}`}>
                            <h3 className="card-heading hover:text-stone-500">
                                {product.name}
                            </h3>
                        </Link>
                        {product.subtitle && (
                            <p className="meta-text mt-2 line-clamp-2">
                                {product.subtitle}
                            </p>
                        )}
                        {product.concerns?.[0] && (
                            <p className="mt-3 text-[9px] font-semibold tracking-[.12em] text-stone-500 uppercase">
                                Best for {product.concerns[0]}
                            </p>
                        )}
                    </div>
                    <div className="shrink-0 text-right">
                        <p
                            className={`price-text ${isOnSale ? '!text-brand-rose' : ''}`}
                        >
                            {money(product.price)}
                        </p>
                        {isOnSale && (
                            <p className="mt-1 text-xs text-stone-400 line-through">
                                {money(product.compare_price!)}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

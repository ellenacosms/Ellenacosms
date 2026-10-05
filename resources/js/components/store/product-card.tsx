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

    const addToCart = () => {
        router.post(
            `/cart/${product.id}`,
            { quantity: 1 },
            {
                preserveScroll: true,
                onStart: () => setIsAdding(true),
                onSuccess: openCartDrawer,
                onFinish: () => setIsAdding(false),
            },
        );
    };

    return (
        <article
            className={`product-card group flex h-full flex-col overflow-hidden rounded-[5px] border border-black/10 bg-white shadow-[0_2px_7px_rgba(45,37,28,.12)] transition-shadow duration-300 hover:shadow-[0_8px_22px_rgba(45,37,28,.16)] ${secondaryImage ? 'has-secondary' : ''}`}
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
                                className="object-contain object-center"
                                wrapperClassName="product-card__primary-image"
                            />
                            {secondaryImage && (
                                <StoreImage
                                    src={secondaryImage}
                                    alt=""
                                    aria-hidden="true"
                                    loading="lazy"
                                    decoding="async"
                                    className="object-contain object-center"
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
                    onClick={addToCart}
                    className="product-card__cart hidden md:flex"
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
            <div className="flex flex-1 flex-col p-4 sm:p-5">
                {product.category?.name && (
                    <p className="eyebrow text-stone-500">
                        {product.category.name}
                    </p>
                )}
                <Link href={`/products/${product.slug}`} className="mt-2">
                    <h3 className="line-clamp-2 min-h-[2.45em] font-serif text-base leading-[1.2] font-semibold text-black hover:text-stone-600 sm:text-lg">
                        {product.name}
                    </h3>
                </Link>
                {product.subtitle && (
                    <p className="mt-2 line-clamp-1 text-xs leading-4 text-stone-600">
                        {product.subtitle}
                    </p>
                )}
                <div className="mt-4 flex items-end gap-2">
                    <p
                        className={`text-base font-bold tracking-[-.01em] ${isOnSale ? 'text-brand-rose' : 'text-black'}`}
                    >
                        {money(product.price)}
                    </p>
                    {isOnSale && (
                        <p className="text-xs text-stone-400 line-through">
                            {money(product.compare_price!)}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    disabled={product.stock < 1 || isAdding}
                    onClick={addToCart}
                    className="product-card__cart--mobile md:hidden"
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
                <div className="mt-3 flex min-h-4 flex-wrap items-center gap-x-2 gap-y-1 text-stone-600">
                    {reviewCount > 0 ? (
                        <p
                            className="inline-flex items-center gap-1 text-[11px]"
                            aria-label={`${averageRating.toFixed(1)} out of 5 stars from ${reviewCount} reviews`}
                        >
                            <Star
                                size={13}
                                fill="currentColor"
                                aria-hidden="true"
                            />
                            <span className="font-semibold">
                                {averageRating.toFixed(1)}
                            </span>
                            <span>({reviewCount})</span>
                        </p>
                    ) : (
                        <p className="text-[9px] font-semibold tracking-[.12em] uppercase">
                            New formula
                        </p>
                    )}
                    {product.concerns?.[0] && (
                        <p className="text-[9px] font-semibold tracking-[.1em] text-stone-500 uppercase">
                            Best for {product.concerns[0]}
                        </p>
                    )}
                </div>
            </div>
        </article>
    );
}

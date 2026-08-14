import { Link, router } from '@inertiajs/react';
import * as Dialog from '@radix-ui/react-dialog';
import {
    ArrowUpRight,
    Check,
    ChevronLeft,
    ChevronRight,
    LoaderCircle,
    ShoppingBag,
    Star,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { useCartDrawer } from '@/components/store/cart-drawer-context';
import StoreImage from '@/components/store/store-image';
import { money } from '@/lib/money';
import type { Product } from '@/types';

export default function ProductQuickView({
    product,
    children,
}: {
    product: Product;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [activeImage, setActiveImage] = useState(0);
    const [isAdding, setIsAdding] = useState(false);
    const { openCartDrawer } = useCartDrawer();
    const images = product.images ?? [];
    const price = Number(product.price);
    const comparePrice = Number(product.compare_price ?? 0);
    const isOnSale = comparePrice > price;
    const reviewCount = Number(product.reviews_count ?? 0);
    const averageRating = Number(product.reviews_avg_rating ?? 0);
    const benefits = product.benefits?.slice(0, 3) ?? [];
    const concerns = product.concerns?.slice(0, 3) ?? [];

    const changeOpen = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (nextOpen) {
            setActiveImage(0);
        }
    };

    const moveImage = (direction: number) => {
        setActiveImage(
            (current) => (current + direction + images.length) % images.length,
        );
    };

    const addToCart = () => {
        router.post(
            `/cart/${product.id}`,
            { quantity: 1 },
            {
                preserveScroll: true,
                onStart: () => setIsAdding(true),
                onSuccess: () => {
                    setOpen(false);
                    openCartDrawer();
                },
                onFinish: () => setIsAdding(false),
            },
        );
    };

    return (
        <Dialog.Root open={open} onOpenChange={changeOpen}>
            <Dialog.Trigger asChild>{children}</Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <Dialog.Content className="bg-ivory text-ink fixed inset-x-0 bottom-0 z-[90] max-h-[92vh] overflow-y-auto outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4 md:top-1/2 md:right-auto md:bottom-auto md:left-1/2 md:max-h-[88vh] md:w-[min(1040px,calc(100vw-48px))] md:-translate-x-1/2 md:-translate-y-1/2 md:overflow-hidden md:shadow-[0_32px_100px_rgba(0,0,0,.25)]">
                    <Dialog.Title className="sr-only">
                        Quick view: {product.name}
                    </Dialog.Title>
                    <Dialog.Description className="sr-only">
                        Review product details and add {product.name} to your
                        bag.
                    </Dialog.Description>

                    <Dialog.Close className="absolute top-4 right-4 z-20 grid h-11 w-11 place-items-center rounded-full border border-black/15 bg-white/85 shadow-sm backdrop-blur transition hover:border-black hover:bg-white">
                        <X size={18} />
                        <span className="sr-only">Close quick view</span>
                    </Dialog.Close>

                    <div className="grid md:max-h-[88vh] md:grid-cols-[1.05fr_.95fr]">
                        <div className="relative min-h-[390px] overflow-hidden bg-[#eee8df] sm:min-h-[520px] md:h-[88vh] md:min-h-0">
                            {images.length > 0 ? (
                                <StoreImage
                                    key={images[activeImage]}
                                    src={images[activeImage]}
                                    alt={`${product.name}, view ${activeImage + 1}`}
                                    className="h-full w-full object-cover"
                                    wrapperClassName="absolute inset-0"
                                />
                            ) : (
                                <div className="grid h-full place-items-center font-serif text-4xl text-stone-400">
                                    ELLENA
                                </div>
                            )}

                            {images.length > 1 && (
                                <>
                                    <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between gap-4">
                                        <div className="flex gap-2">
                                            {images
                                                .slice(0, 5)
                                                .map((image, index) => (
                                                    <button
                                                        key={image}
                                                        type="button"
                                                        onClick={() =>
                                                            setActiveImage(
                                                                index,
                                                            )
                                                        }
                                                        className={`h-14 w-11 overflow-hidden border bg-white transition sm:h-16 sm:w-13 ${activeImage === index ? 'border-black' : 'border-white/70 opacity-75 hover:opacity-100'}`}
                                                        aria-label={`Show image ${index + 1}`}
                                                        aria-current={
                                                            activeImage ===
                                                            index
                                                        }
                                                    >
                                                        <img
                                                            src={image}
                                                            alt=""
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </button>
                                                ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => moveImage(-1)}
                                                className="grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-sm hover:bg-white"
                                                aria-label="Previous image"
                                            >
                                                <ChevronLeft size={17} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moveImage(1)}
                                                className="grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-sm hover:bg-white"
                                                aria-label="Next image"
                                            >
                                                <ChevronRight size={17} />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex flex-col px-6 py-9 sm:px-10 sm:py-12 md:max-h-[88vh] md:overflow-y-auto md:px-12 md:py-12">
                            <div className="flex items-center justify-between gap-4">
                                <p className="eyebrow text-stone-500">
                                    {product.category?.name ?? 'Ellena care'}
                                </p>
                                {reviewCount > 0 && (
                                    <p className="flex items-center gap-1.5 text-[11px] font-semibold">
                                        <Star size={12} fill="currentColor" />
                                        {averageRating.toFixed(1)} (
                                        {reviewCount})
                                    </p>
                                )}
                            </div>

                            <h2 className="mt-5 font-serif text-4xl leading-[1.02] tracking-[-.035em] sm:text-5xl">
                                {product.name}
                            </h2>
                            {product.subtitle && (
                                <p className="mt-5 text-sm leading-7 text-stone-600">
                                    {product.subtitle}
                                </p>
                            )}

                            <div className="mt-7 flex items-end gap-3 border-b border-black/10 pb-7">
                                <p className="text-base font-semibold">
                                    {money(product.price)}
                                </p>
                                {isOnSale && (
                                    <p className="text-sm text-stone-400 line-through">
                                        {money(product.compare_price!)}
                                    </p>
                                )}
                            </div>

                            {benefits.length > 0 && (
                                <div className="mt-7">
                                    <p className="eyebrow text-stone-500">
                                        Why you’ll love it
                                    </p>
                                    <ul className="mt-4 space-y-3 text-sm leading-6">
                                        {benefits.map((benefit) => (
                                            <li
                                                key={benefit}
                                                className="flex items-start gap-3"
                                            >
                                                <Check
                                                    size={15}
                                                    className="mt-1 shrink-0"
                                                />
                                                {benefit}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {concerns.length > 0 && (
                                <div className="mt-7 flex flex-wrap gap-2">
                                    {concerns.map((concern) => (
                                        <span
                                            key={concern}
                                            className="border border-black/10 bg-white/55 px-3 py-2 text-[9px] font-semibold tracking-[.12em] uppercase"
                                        >
                                            Best for {concern}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="bg-ivory sticky bottom-0 mt-auto border-t border-black/10 pt-6 pb-1">
                                <button
                                    type="button"
                                    onClick={addToCart}
                                    disabled={product.stock < 1 || isAdding}
                                    className="button-dark flex w-full items-center justify-center gap-3 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isAdding ? (
                                        <LoaderCircle
                                            size={16}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <ShoppingBag size={16} />
                                    )}
                                    {isAdding
                                        ? 'Adding…'
                                        : product.stock > 0
                                          ? 'Add to bag'
                                          : 'Unavailable'}
                                </button>
                                <Link
                                    href={`/products/${product.slug}`}
                                    onClick={() => setOpen(false)}
                                    className="mt-5 flex items-center justify-center gap-2 text-[10px] font-semibold tracking-[.15em] uppercase underline-offset-4 hover:underline"
                                >
                                    View full details <ArrowUpRight size={14} />
                                </Link>
                                <p className="mt-5 text-center text-[10px] tracking-wide text-stone-500">
                                    {product.stock > 5
                                        ? 'In stock · Ready to dispatch'
                                        : product.stock > 0
                                          ? `Low stock · ${product.stock} remaining`
                                          : 'Currently out of stock'}
                                </p>
                            </div>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

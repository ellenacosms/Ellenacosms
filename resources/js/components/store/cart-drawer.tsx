import { Link, router } from '@inertiajs/react';
import { LoaderCircle, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import StoreImage from '@/components/store/store-image';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { money } from '@/lib/money';
import type { CartSummary } from '@/types';

export default function CartDrawer({
    cart,
    open,
    onOpenChange,
}: {
    cart: CartSummary;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [updatingProduct, setUpdatingProduct] = useState<number | null>(null);

    const updateQuantity = (productId: number, quantity: number) => {
        router.patch(
            `/cart/${productId}`,
            { quantity },
            {
                preserveScroll: true,
                onStart: () => setUpdatingProduct(productId),
                onFinish: () => setUpdatingProduct(null),
            },
        );
    };

    const remove = (productId: number) => {
        router.delete(`/cart/${productId}`, {
            preserveScroll: true,
            onStart: () => setUpdatingProduct(productId),
            onFinish: () => setUpdatingProduct(null),
        });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="bg-ivory text-ink !w-full !max-w-[460px] gap-0 border-black/10 p-0">
                <SheetHeader className="border-b border-black/10 px-6 py-6 sm:px-8">
                    <div className="flex items-center gap-3 pr-10">
                        <ShoppingBag size={18} />
                        <SheetTitle className="font-serif text-3xl font-normal tracking-[-.03em]">
                            Your bag
                        </SheetTitle>
                        <span className="rounded-full bg-brand-rose px-2 py-1 text-[9px] font-semibold text-white">
                            {cart.count}
                        </span>
                    </div>
                    <SheetDescription className="text-xs leading-5 text-stone-500">
                        Your Ellena ritual, ready when you are.
                    </SheetDescription>
                </SheetHeader>

                {cart.items.length ? (
                    <>
                        <div className="border-b border-black/10 px-6 py-5 sm:px-8">
                            <p className="text-[10px] font-semibold tracking-[.13em] uppercase">
                                Delivery calculated at checkout
                            </p>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-6 sm:px-8">
                            <div className="divide-y divide-black/10">
                                {cart.items.map(
                                    ({ product, quantity, line_total }) => {
                                        const isUpdating =
                                            updatingProduct === product.id;

                                        return (
                                            <article
                                                key={product.id}
                                                className="grid grid-cols-[88px_1fr] gap-4 py-6"
                                            >
                                                <Link
                                                    href={`/products/${product.slug}`}
                                                    onClick={() =>
                                                        onOpenChange(false)
                                                    }
                                                >
                                                    <StoreImage
                                                        src={
                                                            product.images?.[0]
                                                        }
                                                        alt={product.name}
                                                        className="object-contain object-center p-2 mix-blend-multiply"
                                                        wrapperClassName="aspect-[3/4] bg-[#faf9f7]"
                                                    />
                                                </Link>
                                                <div className="flex min-w-0 flex-col">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="eyebrow text-stone-500">
                                                                {product
                                                                    .category
                                                                    ?.name ??
                                                                    'Ellena care'}
                                                            </p>
                                                            <Link
                                                                href={`/products/${product.slug}`}
                                                                onClick={() =>
                                                                    onOpenChange(
                                                                        false,
                                                                    )
                                                                }
                                                                className="mt-2 block truncate font-serif text-xl leading-tight hover:text-stone-500"
                                                            >
                                                                {product.name}
                                                            </Link>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                remove(
                                                                    product.id,
                                                                )
                                                            }
                                                            disabled={
                                                                isUpdating
                                                            }
                                                            className="p-1 text-stone-400 transition hover:text-black disabled:opacity-40"
                                                            aria-label={`Remove ${product.name}`}
                                                        >
                                                            {isUpdating ? (
                                                                <LoaderCircle
                                                                    size={15}
                                                                    className="animate-spin"
                                                                />
                                                            ) : (
                                                                <Trash2
                                                                    size={15}
                                                                />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                                                        <div className="inline-flex h-9 items-center border border-black/15 bg-white/60">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    updateQuantity(
                                                                        product.id,
                                                                        quantity -
                                                                            1,
                                                                    )
                                                                }
                                                                disabled={
                                                                    isUpdating
                                                                }
                                                                className="grid h-full w-9 place-items-center hover:bg-stone-100 disabled:opacity-40"
                                                                aria-label={`Decrease ${product.name} quantity`}
                                                            >
                                                                <Minus
                                                                    size={12}
                                                                />
                                                            </button>
                                                            <span className="w-7 text-center text-xs">
                                                                {isUpdating ? (
                                                                    <LoaderCircle
                                                                        size={
                                                                            12
                                                                        }
                                                                        className="mx-auto animate-spin"
                                                                    />
                                                                ) : (
                                                                    quantity
                                                                )}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    updateQuantity(
                                                                        product.id,
                                                                        quantity +
                                                                            1,
                                                                    )
                                                                }
                                                                disabled={
                                                                    isUpdating ||
                                                                    quantity >=
                                                                        Math.min(
                                                                            product.stock,
                                                                            20,
                                                                        )
                                                                }
                                                                className="grid h-full w-9 place-items-center hover:bg-stone-100 disabled:opacity-40"
                                                                aria-label={`Increase ${product.name} quantity`}
                                                            >
                                                                <Plus
                                                                    size={12}
                                                                />
                                                            </button>
                                                        </div>
                                                        <p className="price-text">
                                                            {money(line_total)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    },
                                )}
                            </div>
                        </div>

                        <div className="border-t border-brand-pink/70 bg-brand-blush px-6 py-6 sm:px-8">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold tracking-[.13em] uppercase">
                                    Subtotal
                                </span>
                                <span className="font-serif text-2xl">
                                    {money(cart.subtotal)}
                                </span>
                            </div>
                            {cart.bundle_discount && (
                                <div className="mt-3 flex items-center justify-between text-xs text-emerald-700">
                                    <span>Ritual savings</span>
                                    <span>
                                        -{money(cart.bundle_discount.amount)}
                                    </span>
                                </div>
                            )}
                            <p className="mt-2 text-[10px] leading-5 tracking-wide text-stone-500">
                                Delivery and discounts are confirmed in your
                                bag.
                            </p>
                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <Link
                                    href="/cart"
                                    onClick={() => onOpenChange(false)}
                                    className="button-light px-4 text-center"
                                >
                                    View bag
                                </Link>
                                <Link
                                    href="/checkout/access"
                                    onClick={() => onOpenChange(false)}
                                    className="button-dark px-4 text-center"
                                >
                                    Checkout
                                </Link>
                            </div>
                            <p className="mt-4 text-center text-[9px] font-semibold tracking-[.14em] text-stone-500 uppercase">
                                Secure checkout · Thoughtful delivery
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="grid flex-1 place-items-center px-8 text-center">
                        <div>
                            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-rose text-white">
                                <ShoppingBag size={23} />
                            </span>
                            <h2 className="mt-6 font-serif text-3xl">
                                Your bag is empty
                            </h2>
                            <p className="mx-auto mt-3 max-w-xs text-sm leading-7 text-stone-500">
                                Discover considered hair and body care for your
                                daily ritual.
                            </p>
                            <Link
                                href="/shop"
                                onClick={() => onOpenChange(false)}
                                className="button-dark mt-7"
                            >
                                Explore the collection
                            </Link>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

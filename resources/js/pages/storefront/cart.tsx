import { Head, Link, router, useForm } from '@inertiajs/react';
import { LoaderCircle, Minus, Plus, X } from 'lucide-react';
import { useState } from 'react';
import StoreImage from '@/components/store/store-image';
import { money } from '@/lib/money';
import type { BundleDiscount, CartDiscount, CartItem } from '@/types';

export default function Cart({
    items,
    subtotal,
    total,
    discount,
    bundle_discount: bundleDiscount,
}: {
    items: CartItem[];
    subtotal: number;
    shipping: number;
    total: number;
    free_shipping_threshold: number;
    discount: CartDiscount | null;
    bundle_discount: BundleDiscount | null;
}) {
    const discountForm = useForm({ code: '' });
    const [updatingProduct, setUpdatingProduct] = useState<number | null>(null);
    const update = (id: number, quantity: number) =>
        router.patch(
            `/cart/${id}`,
            { quantity },
            {
                preserveScroll: true,
                onStart: () => setUpdatingProduct(id),
                onFinish: () => setUpdatingProduct(null),
            },
        );

    return (
        <>
            <Head title="Your Bag" />
            <section className="store-container pt-40 pb-20 md:pt-44 md:pb-28">
                <p className="eyebrow">Your selection</p>
                <h1 className="display-heading mt-4">Shopping bag</h1>
                {!items.length ? (
                    <div className="surface-card mt-12 px-6 py-24 text-center">
                        <p className="subsection-heading">
                            Your bag is beautifully empty.
                        </p>
                        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-stone-500">
                            Explore considered hair and body care, then return
                            here when your ritual is ready.
                        </p>
                        <Link
                            href="/shop"
                            className="button-dark mt-8 inline-block"
                        >
                            Explore the collection
                        </Link>
                    </div>
                ) : (
                    <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_380px] lg:items-start">
                        <div className="divide-y divide-black/10 border-y border-black/10">
                            {items.map(({ product, quantity, line_total }) => (
                                <div
                                    key={product.id}
                                    className="grid grid-cols-[100px_1fr] gap-5 py-6 sm:grid-cols-[140px_1fr_auto] sm:gap-7"
                                >
                                    <StoreImage
                                        src={product.images?.[0]}
                                        alt={product.name}
                                        className="object-contain object-center p-3 mix-blend-multiply sm:p-5"
                                        wrapperClassName="aspect-[4/5] h-full bg-[#faf9f7] shadow-[0_10px_28px_rgba(45,37,28,.07)]"
                                    />
                                    <div className="py-2">
                                        <Link
                                            href={`/products/${product.slug}`}
                                            className="card-heading !text-2xl"
                                        >
                                            {product.name}
                                        </Link>
                                        <p className="mt-2 text-[10px] tracking-widest text-stone-500 uppercase">
                                            {product.subtitle}
                                        </p>
                                        <div className="mt-7 inline-flex h-11 items-center border border-black/20 bg-white/50">
                                            <button
                                                onClick={() =>
                                                    update(
                                                        product.id,
                                                        quantity - 1,
                                                    )
                                                }
                                                className="grid h-full w-10 place-items-center hover:bg-stone-100"
                                                aria-label={`Decrease ${product.name} quantity`}
                                                disabled={
                                                    updatingProduct ===
                                                    product.id
                                                }
                                            >
                                                <Minus size={13} />
                                            </button>
                                            <span className="w-8 text-center text-xs">
                                                {updatingProduct ===
                                                product.id ? (
                                                    <LoaderCircle
                                                        className="mx-auto animate-spin"
                                                        size={13}
                                                    />
                                                ) : (
                                                    quantity
                                                )}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    update(
                                                        product.id,
                                                        quantity + 1,
                                                    )
                                                }
                                                className="grid h-full w-10 place-items-center hover:bg-stone-100"
                                                aria-label={`Increase ${product.name} quantity`}
                                                disabled={
                                                    updatingProduct ===
                                                    product.id
                                                }
                                            >
                                                <Plus size={13} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-start-2 flex items-center justify-between sm:col-start-auto sm:flex-col sm:items-end sm:py-2">
                                        <button
                                            onClick={() =>
                                                router.delete(
                                                    `/cart/${product.id}`,
                                                    {
                                                        preserveScroll: true,
                                                        onStart: () =>
                                                            setUpdatingProduct(
                                                                product.id,
                                                            ),
                                                        onFinish: () =>
                                                            setUpdatingProduct(
                                                                null,
                                                            ),
                                                    },
                                                )
                                            }
                                            aria-label={`Remove ${product.name}`}
                                            disabled={
                                                updatingProduct === product.id
                                            }
                                        >
                                            {updatingProduct === product.id ? (
                                                <LoaderCircle
                                                    className="animate-spin"
                                                    size={17}
                                                />
                                            ) : (
                                                <X size={17} />
                                            )}
                                        </button>
                                        <p className="price-text">
                                            {money(line_total)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <aside className="surface-card h-fit p-7 sm:p-8 lg:sticky lg:top-32">
                            <h2 className="subsection-heading">
                                Order summary
                            </h2>
                            <div className="mt-7 space-y-4 border-b border-black/10 pb-6 text-sm">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>{money(subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Delivery</span>
                                    <span>Delivery calculated at checkout</span>
                                </div>
                                {bundleDiscount && (
                                    <div className="flex justify-between gap-4 text-emerald-700">
                                        <span>
                                            Ritual savings
                                            <small className="mt-1 block text-[9px] leading-4 tracking-wide uppercase opacity-75">
                                                {bundleDiscount.rituals
                                                    .map(
                                                        (ritual) => ritual.name,
                                                    )
                                                    .join(', ')}
                                            </small>
                                        </span>
                                        <span>
                                            -{money(bundleDiscount.amount)}
                                        </span>
                                    </div>
                                )}
                                {discount && (
                                    <div className="flex justify-between text-emerald-700">
                                        <span>Discount ({discount.code})</span>
                                        <span>-{money(discount.amount)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between py-6 font-semibold">
                                <span>Total</span>
                                <span>{money(total)}</span>
                            </div>
                            <Link
                                href="/checkout/access"
                                className="button-dark block w-full text-center"
                            >
                                Proceed to checkout
                            </Link>
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    discountForm.post('/cart/discount', {
                                        preserveScroll: true,
                                    });
                                }}
                                className="mt-6 flex gap-2"
                            >
                                <input
                                    value={discountForm.data.code}
                                    onChange={(event) =>
                                        discountForm.setData(
                                            'code',
                                            event.target.value.toUpperCase(),
                                        )
                                    }
                                    placeholder="Discount code"
                                    className="min-w-0 flex-1 border border-black/20 bg-white px-3 py-3 text-xs uppercase outline-none focus:border-black"
                                />
                                <button
                                    disabled={discountForm.processing}
                                    className="inline-flex items-center gap-2 border border-brand-gold/50 px-4 py-3 text-[10px] font-semibold tracking-wider uppercase hover:border-brand-rose hover:bg-brand-rose hover:text-white disabled:opacity-50"
                                >
                                    {discountForm.processing && (
                                        <LoaderCircle
                                            className="animate-spin"
                                            size={13}
                                        />
                                    )}
                                    {discountForm.processing
                                        ? 'Applying…'
                                        : 'Apply'}
                                </button>
                            </form>
                            {discount && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.delete('/cart/discount', {
                                            preserveScroll: true,
                                        })
                                    }
                                    className="mt-3 text-[10px] tracking-wider text-stone-500 uppercase underline"
                                >
                                    Remove discount
                                </button>
                            )}
                            <p className="mt-5 text-center text-[10px] leading-5 tracking-wider text-stone-500 uppercase">
                                Secure checkout · 30-day returns
                            </p>
                            <Link
                                href="/shop"
                                className="mt-5 block text-center text-[10px] font-semibold tracking-widest uppercase underline underline-offset-4"
                            >
                                Continue shopping
                            </Link>
                        </aside>
                    </div>
                )}
            </section>
            {items.length > 0 && (
                <Link
                    href="/checkout/access"
                    className="button-dark fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 block text-center shadow-[0_12px_35px_rgba(143,40,74,.25)] lg:hidden"
                >
                    Checkout · {money(total)}
                </Link>
            )}
        </>
    );
}

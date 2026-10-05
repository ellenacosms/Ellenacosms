import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Clock3,
    Heart,
    History,
    PackageCheck,
    ReceiptText,
    ShoppingBag,
} from 'lucide-react';
import StoreImage from '@/components/store/store-image';
import WishlistButton from '@/components/store/wishlist-button';
import { money } from '@/lib/money';
import { dashboard } from '@/routes';
import type { Order, Product } from '@/types';

export default function Dashboard({
    orders,
    summary,
    wishlistProducts,
    recentlyViewed,
}: {
    orders: Order[];
    summary: { orders: number; active: number; spent: number };
    wishlistProducts: Product[];
    recentlyViewed: Product[];
}) {
    const user = usePage().props.auth.user;
    const firstName = user.name.split(' ')[0];

    return (
        <>
            <Head title="My account" />
            <div className="flex flex-1 flex-col gap-8 overflow-x-auto p-4 md:p-7">
                <section className="overflow-hidden bg-[#171715] px-6 py-10 text-white md:px-10">
                    <p className="text-[10px] font-semibold tracking-[.2em] text-white/50 uppercase">
                        Ellena private account
                    </p>
                    <div className="mt-4 flex flex-col justify-between gap-7 md:flex-row md:items-end">
                        <div>
                            <h1 className="font-serif text-4xl tracking-tight md:text-5xl">
                                Welcome back, {firstName}.
                            </h1>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
                                Follow your orders and revisit the formulas that
                                have become part of your ritual.
                            </p>
                        </div>
                        <Link
                            href="/shop"
                            className="inline-flex items-center gap-3 self-start border-b border-white pb-2 text-[10px] font-semibold tracking-widest uppercase"
                        >
                            Continue shopping <ArrowRight size={14} />
                        </Link>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-3">
                    {[
                        {
                            label: 'Orders placed',
                            value: summary.orders,
                            icon: ReceiptText,
                        },
                        {
                            label: 'In progress',
                            value: summary.active,
                            icon: Clock3,
                        },
                        {
                            label: 'Lifetime spend',
                            value: money(summary.spent),
                            icon: ShoppingBag,
                        },
                    ].map(({ label, value, icon: Icon }) => (
                        <div
                            key={label}
                            className="border border-sidebar-border/70 bg-white p-6 dark:bg-sidebar"
                        >
                            <div className="flex items-center justify-between text-muted-foreground">
                                <p className="text-[10px] font-semibold tracking-wider uppercase">
                                    {label}
                                </p>
                                <Icon size={17} />
                            </div>
                            <p className="mt-6 text-3xl font-semibold">
                                {value}
                            </p>
                        </div>
                    ))}
                </section>

                <ProductCollection
                    id="saved"
                    eyebrow="Your private edit"
                    title="Saved rituals"
                    products={wishlistProducts}
                    emptyIcon={Heart}
                    emptyTitle="Your saved ritual is waiting"
                    emptyCopy="Use the heart on any product to build a personal edit you can return to here."
                />

                {recentlyViewed.length > 0 && (
                    <ProductCollection
                        id="recently-viewed"
                        eyebrow="Continue exploring"
                        title="Recently viewed"
                        products={recentlyViewed}
                        emptyIcon={History}
                        emptyTitle="No recent products"
                        emptyCopy="Products you explore will appear here."
                    />
                )}

                <section id="orders">
                    <div className="mb-5">
                        <p className="text-[10px] font-semibold tracking-[.18em] text-muted-foreground uppercase">
                            Purchase history
                        </p>
                        <h2 className="mt-2 font-serif text-3xl">
                            Your orders
                        </h2>
                    </div>
                    {orders.length ? (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <OrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    ) : (
                        <div className="border border-sidebar-border/70 bg-white px-6 py-16 text-center dark:bg-sidebar">
                            <PackageCheck
                                className="mx-auto text-muted-foreground"
                                size={32}
                            />
                            <h3 className="mt-5 font-serif text-2xl">
                                No orders yet
                            </h3>
                            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                                Your order history and delivery progress will
                                appear here after checkout.
                            </p>
                            <Link
                                href="/shop"
                                className="mt-6 inline-block bg-black px-6 py-3 text-[10px] font-semibold tracking-widest text-white uppercase"
                            >
                                Explore the collection
                            </Link>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

function ProductCollection({
    id,
    eyebrow,
    title,
    products,
    emptyIcon: EmptyIcon,
    emptyTitle,
    emptyCopy,
}: {
    id: string;
    eyebrow: string;
    title: string;
    products: Product[];
    emptyIcon: typeof Heart;
    emptyTitle: string;
    emptyCopy: string;
}) {
    return (
        <section id={id} className="scroll-mt-24">
            <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                    <p className="text-[10px] font-semibold tracking-[.18em] text-muted-foreground uppercase">
                        {eyebrow}
                    </p>
                    <h2 className="mt-2 font-serif text-3xl">{title}</h2>
                </div>
                {products.length > 0 && (
                    <Link
                        href="/shop"
                        className="hidden items-center gap-2 text-[10px] font-semibold tracking-widest uppercase sm:inline-flex"
                    >
                        Explore more <ArrowRight size={13} />
                    </Link>
                )}
            </div>
            {products.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                    {products.map((product) => (
                        <AccountProductCard
                            key={product.id}
                            product={product}
                        />
                    ))}
                </div>
            ) : (
                <div className="border border-sidebar-border/70 bg-white px-6 py-12 text-center dark:bg-sidebar">
                    <EmptyIcon
                        className="mx-auto text-muted-foreground"
                        size={29}
                    />
                    <h3 className="mt-4 font-serif text-2xl">{emptyTitle}</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                        {emptyCopy}
                    </p>
                    <Link
                        href="/shop"
                        className="mt-6 inline-block border-b border-foreground pb-1 text-[10px] font-semibold tracking-widest uppercase"
                    >
                        Browse products
                    </Link>
                </div>
            )}
        </section>
    );
}

function AccountProductCard({ product }: { product: Product }) {
    const image = product.images?.[0];

    return (
        <article className="group min-w-0">
            <div className="relative aspect-[3/4] overflow-hidden bg-[#faf9f7]">
                <Link
                    href={`/products/${product.slug}`}
                    className="block h-full"
                >
                    {image ? (
                        <StoreImage
                            src={image}
                            alt={product.name}
                            className="object-contain object-center p-6 mix-blend-multiply sm:p-8"
                        />
                    ) : (
                        <span className="grid h-full place-items-center font-serif text-xl text-stone-400 sm:text-3xl">
                            ELLENA
                        </span>
                    )}
                </Link>
                <WishlistButton
                    product={product}
                    className="absolute top-3 right-3 h-10 w-10 rounded-full border border-black/10 bg-white/90 text-black shadow-sm hover:border-black"
                />
            </div>
            <div className="pt-4">
                {product.category?.name && (
                    <p className="text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
                        {product.category.name}
                    </p>
                )}
                <div className="mt-2 flex items-start justify-between gap-3">
                    <Link
                        href={`/products/${product.slug}`}
                        className="min-w-0 font-serif text-lg leading-tight hover:text-muted-foreground"
                    >
                        {product.name}
                    </Link>
                    <p className="shrink-0 text-xs font-semibold">
                        {money(product.price)}
                    </p>
                </div>
            </div>
        </article>
    );
}

function OrderCard({ order }: { order: Order }) {
    const itemCount =
        order.items?.reduce((total, item) => total + item.quantity, 0) ?? 0;
    const images =
        order.items
            ?.map((item) => item.product?.images?.[0])
            .filter((image): image is string => Boolean(image))
            .slice(0, 3) ?? [];

    return (
        <article className="border border-sidebar-border/70 bg-white dark:bg-sidebar">
            <div className="flex flex-col justify-between gap-4 border-b border-sidebar-border/70 px-5 py-4 sm:flex-row sm:items-center">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    <div>
                        <p className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Order
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                            {order.number}
                        </p>
                    </div>
                    <div>
                        <p className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Placed
                        </p>
                        <p className="mt-1 text-sm">
                            {new Date(order.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Status value={order.status} />
                    <Status value={order.payment_status} payment />
                </div>
            </div>
            <div className="flex flex-col justify-between gap-6 p-5 md:flex-row md:items-center">
                <div className="flex items-center gap-5">
                    <div className="flex -space-x-3">
                        {images.map((image, index) => (
                            <img
                                key={`${image}-${index}`}
                                src={image}
                                alt=""
                                className="h-16 w-14 border-2 border-white bg-[#faf9f7] object-contain object-center p-1 mix-blend-multiply"
                            />
                        ))}
                    </div>
                    <div>
                        <p className="text-sm font-semibold">
                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Total {money(order.total)}
                        </p>
                    </div>
                </div>
                <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="inline-flex items-center justify-center gap-2 border border-black/15 px-5 py-3 text-[10px] font-semibold tracking-widest uppercase hover:bg-black hover:text-white dark:border-white/20"
                >
                    View order <ArrowRight size={13} />
                </Link>
            </div>
        </article>
    );
}

function Status({
    value,
    payment = false,
}: {
    value: string;
    payment?: boolean;
}) {
    const tone =
        value === 'delivered' || value === 'paid'
            ? 'bg-emerald-100 text-emerald-800'
            : value === 'cancelled' || value === 'refunded'
              ? 'bg-red-100 text-red-700'
              : value === 'shipped'
                ? 'bg-violet-100 text-violet-800'
                : 'bg-amber-100 text-amber-800';

    return (
        <span
            className={`rounded-full px-3 py-1 text-[9px] font-bold tracking-wider uppercase ${tone}`}
        >
            {payment ? `Payment ${value}` : value}
        </span>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'My account',
            href: dashboard(),
        },
    ],
};

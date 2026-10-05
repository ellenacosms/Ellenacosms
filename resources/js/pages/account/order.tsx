import { Head, Link } from '@inertiajs/react';
import {
    Check,
    ChevronLeft,
    Circle,
    CreditCard,
    MapPin,
    PackageCheck,
} from 'lucide-react';
import { money } from '@/lib/money';
import type { Order } from '@/types';

const steps = ['pending', 'processing', 'shipped', 'delivered'];

export default function OrderDetail({ order }: { order: Order }) {
    const currentStep = steps.indexOf(order.status);

    return (
        <>
            <Head title={`Order ${order.number}`} />
            {order.payment_status !== 'paid' && (
                <Link
                    className="button-dark mx-4 mt-4"
                    href={`/order/${order.id}/success`}
                >
                    Review delivery and payment
                </Link>
            )}
            <div className="flex flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-7">
                <div>
                    <Link
                        href="/dashboard#orders"
                        className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase"
                    >
                        <ChevronLeft size={14} /> All orders
                    </Link>
                    <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                        <div>
                            <p className="text-[10px] font-semibold tracking-[.18em] text-muted-foreground uppercase">
                                Order details
                            </p>
                            <h1 className="mt-2 font-serif text-4xl">
                                {order.number}
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Placed{' '}
                                {new Date(order.created_at).toLocaleString()}
                            </p>
                        </div>
                        <span className="self-start rounded-full bg-amber-100 px-4 py-2 text-[10px] font-bold tracking-wider text-amber-800 uppercase">
                            {order.status}
                        </span>
                    </div>
                </div>

                {order.status !== 'cancelled' && (
                    <section className="border border-sidebar-border/70 bg-white p-6 md:p-8 dark:bg-sidebar">
                        <h2 className="text-sm font-semibold">
                            Order progress
                        </h2>
                        <div className="mt-7 grid grid-cols-4">
                            {steps.map((step, index) => {
                                const complete = index <= currentStep;

                                return (
                                    <div
                                        key={step}
                                        className="relative flex flex-col items-center text-center"
                                    >
                                        {index > 0 && (
                                            <div
                                                className={`absolute top-3 right-1/2 h-px w-full ${index <= currentStep ? 'bg-black dark:bg-white' : 'bg-stone-200 dark:bg-stone-700'}`}
                                            />
                                        )}
                                        <div
                                            className={`relative z-10 grid h-7 w-7 place-items-center rounded-full ${complete ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-stone-100 text-stone-400 dark:bg-stone-800'}`}
                                        >
                                            {complete ? (
                                                <Check size={13} />
                                            ) : (
                                                <Circle size={9} />
                                            )}
                                        </div>
                                        <span className="mt-3 text-[9px] font-semibold tracking-wider uppercase">
                                            {step}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
                    <section className="border border-sidebar-border/70 bg-white dark:bg-sidebar">
                        <div className="border-b border-sidebar-border/70 p-6">
                            <h2 className="font-serif text-2xl">Your items</h2>
                        </div>
                        <div className="divide-y divide-sidebar-border/70">
                            {order.items?.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex gap-5 p-5 md:p-6"
                                >
                                    <img
                                        src={item.product?.images?.[0]}
                                        alt={item.product_name}
                                        className="h-24 w-20 shrink-0 bg-[#faf9f7] object-contain object-center p-1 mix-blend-multiply"
                                    />
                                    <div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row">
                                        <div>
                                            <p className="font-serif text-xl">
                                                {item.product_name}
                                            </p>
                                            <p className="mt-1 text-[9px] tracking-wider text-muted-foreground uppercase">
                                                {item.sku}
                                            </p>
                                            <p className="mt-3 text-xs text-muted-foreground">
                                                Quantity {item.quantity} ·{' '}
                                                {money(item.price)} each
                                            </p>
                                        </div>
                                        <p className="text-sm font-semibold">
                                            {money(item.total)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="ml-auto w-full max-w-sm space-y-3 border-t border-sidebar-border/70 p-6 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Subtotal
                                </span>
                                <span>
                                    {money(order.subtotal, order.currency)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Delivery
                                </span>
                                <span>
                                    {order.delivery_fee_status ===
                                    'awaiting_quote'
                                        ? 'To be confirmed'
                                        : Number(order.shipping)
                                          ? money(
                                                order.shipping,
                                                order.currency,
                                            )
                                          : 'Complimentary'}
                                </span>
                            </div>
                            {Number(order.discount_amount) > 0 && (
                                <div className="flex justify-between text-emerald-700">
                                    <span>
                                        Discount{' '}
                                        {order.discount_code &&
                                            `(${order.discount_code})`}
                                    </span>
                                    <span>
                                        -
                                        {money(
                                            order.discount_amount,
                                            order.currency,
                                        )}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between border-t border-sidebar-border/70 pt-4 text-base font-semibold">
                                <span>Total</span>
                                <span>
                                    {money(order.total, order.currency)}
                                </span>
                            </div>
                        </div>
                    </section>

                    <aside className="space-y-5">
                        <div className="border border-sidebar-border/70 bg-white p-6 dark:bg-sidebar">
                            <div className="flex items-center gap-3">
                                <MapPin size={17} />
                                <h2 className="text-sm font-semibold">
                                    Delivery address
                                </h2>
                            </div>
                            <div className="mt-5 text-sm leading-7 text-muted-foreground">
                                <p className="font-semibold text-foreground">
                                    {order.customer_name}
                                </p>
                                <p>{order.address}</p>
                                <p>
                                    {order.city}, {order.country}
                                </p>
                                {order.phone && <p>{order.phone}</p>}
                            </div>
                        </div>
                        <div className="border border-sidebar-border/70 bg-white p-6 dark:bg-sidebar">
                            <div className="flex items-center gap-3">
                                <CreditCard size={17} />
                                <h2 className="text-sm font-semibold">
                                    Payment
                                </h2>
                            </div>
                            <div className="mt-5 flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Payment status
                                </span>
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-[9px] font-bold tracking-wider text-amber-800 uppercase">
                                    {order.payment_status}
                                </span>
                            </div>
                        </div>
                        <div className="border border-sidebar-border/70 bg-white p-6 dark:bg-sidebar">
                            <PackageCheck size={18} />
                            <h2 className="mt-3 text-sm font-semibold">
                                Need assistance?
                            </h2>
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                Contact the Ellena concierge with your order
                                number for delivery or return support.
                            </p>
                            <a
                                href="mailto:ellenacosms@gmail.com"
                                className="mt-4 inline-block text-[10px] font-semibold tracking-widest uppercase underline underline-offset-4"
                            >
                                Contact concierge
                            </a>
                        </div>
                    </aside>
                </div>
            </div>
        </>
    );
}

OrderDetail.layout = {
    breadcrumbs: [
        { title: 'My account', href: '/dashboard' },
        { title: 'Order details', href: '#' },
    ],
};

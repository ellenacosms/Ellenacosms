import { Head, Link, usePage } from '@inertiajs/react';
import { Check, LoaderCircle, PackageCheck } from 'lucide-react';
import { useState } from 'react';
import { money } from '@/lib/money';
import type { Order } from '@/types';

export default function OrderSuccess({
    order,
    pesapalReady,
}: {
    order: Order;
    pesapalReady: boolean;
}) {
    const { errors, flash } = usePage<{
        errors: { payment?: string };
        flash: { payment_message?: string };
    }>().props;
    const pesapalOrder = order.payment_method === 'pesapal';
    const paymentComplete = order.payment_status === 'paid';
    const paymentFailed = order.payment_status === 'failed';
    const paymentPending = pesapalOrder && !paymentComplete && !paymentFailed;
    const [openingPayment, setOpeningPayment] = useState(false);

    const openPesapalInNewTab = async () => {
        const paymentWindow = window.open('', 'pesapal-payment');

        if (!paymentWindow) {
            window.alert('Please allow pop-ups to open Pesapal securely.');

            return;
        }

        paymentWindow.document.title = 'Opening secure payment…';
        setOpeningPayment(true);

        try {
            const response = await fetch(
                `/orders/${order.id}/payments/pesapal`,
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') ?? '',
                    },
                    body: '{}',
                },
            );
            const payload = await response.json();

            if (!response.ok || !payload.payment_url) {
                throw new Error(
                    payload.message ?? 'Pesapal could not be opened.',
                );
            }

            paymentWindow.location.href = payload.payment_url;
        } catch (error) {
            paymentWindow.close();
            window.alert(
                error instanceof Error
                    ? error.message
                    : 'Pesapal could not be opened. Please try again.',
            );
        } finally {
            setOpeningPayment(false);
        }
    };

    return (
        <>
            <Head title="Order received" />
            <section className="mx-auto max-w-3xl px-5 pt-40 pb-24 text-center md:pt-44 md:pb-32">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-black bg-white shadow-[0_12px_30px_rgba(45,37,28,.08)]">
                    <Check size={25} />
                </div>
                <p className="eyebrow mt-8">Order {order.number}</p>
                <h1 className="display-heading mt-5">
                    {paymentComplete
                        ? 'Thank you for shopping with us.'
                        : paymentFailed
                          ? 'Sorry, your payment failed.'
                          : paymentPending
                            ? 'Your payment is pending.'
                            : 'Your ritual is confirmed.'}
                </h1>
                <p className="body-copy mx-auto mt-6 max-w-lg">
                    Thank you, {order.customer_name}. We’ve received your order
                    and will send updates to {order.email}.
                </p>
                {pesapalOrder && (
                    <p
                        className={`mx-auto mt-5 w-fit px-4 py-2 text-[10px] font-semibold tracking-widest uppercase ${paymentComplete ? 'bg-emerald-100 text-emerald-800' : paymentFailed ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}
                    >
                        Payment {order.payment_status}
                    </p>
                )}
                {flash.payment_message && (
                    <p className="mx-auto mt-5 max-w-xl border border-black/10 bg-white/50 px-5 py-4 text-sm text-stone-600">
                        {flash.payment_message}
                    </p>
                )}
                {paymentFailed && order.payment_status_message && (
                    <p className="mx-auto mt-5 max-w-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                        {order.payment_status_message} You can retry securely
                        below.
                    </p>
                )}
                {errors.payment && (
                    <p className="mx-auto mt-5 max-w-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                        {errors.payment}
                    </p>
                )}
                {order.estimated_delivery_date && (
                    <p className="mx-auto mt-5 flex w-fit items-center gap-2 border border-black/10 bg-white/50 px-4 py-3 text-xs text-stone-600">
                        <PackageCheck size={15} /> Estimated by{' '}
                        {new Date(
                            `${order.estimated_delivery_date}T12:00:00`,
                        ).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>
                )}
                <div className="surface-card mt-10 p-6 text-left sm:p-8">
                    {order.items?.map((item) => (
                        <div
                            key={item.id}
                            className="flex justify-between border-b border-black/10 py-3 text-sm"
                        >
                            <span>
                                {item.quantity} × {item.product_name}
                            </span>
                            <span>{money(item.total)}</span>
                        </div>
                    ))}
                    {Number(order.discount_amount) > 0 && (
                        <div className="flex justify-between pt-5 text-emerald-700">
                            <span>
                                Discount{' '}
                                {order.discount_code &&
                                    `(${order.discount_code})`}
                            </span>
                            <span>-{money(order.discount_amount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between pt-5 font-semibold">
                        <span>Total</span>
                        <span>{money(order.total)}</span>
                    </div>
                </div>
                {pesapalOrder && !paymentComplete && pesapalReady && (
                    <button
                        type="button"
                        disabled={openingPayment}
                        onClick={openPesapalInNewTab}
                        className="button-dark mt-9 gap-2 disabled:cursor-wait disabled:opacity-55"
                    >
                        {openingPayment && (
                            <LoaderCircle size={15} className="animate-spin" />
                        )}
                        {openingPayment
                            ? 'Opening Pesapal…'
                            : paymentFailed
                              ? 'Retry payment with Pesapal'
                              : 'Pay securely with Pesapal'}
                    </button>
                )}
                <Link href="/shop" className="button-dark mt-9 inline-block">
                    Continue exploring
                </Link>
            </section>
        </>
    );
}

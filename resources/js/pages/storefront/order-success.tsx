import { Head, Link } from '@inertiajs/react';
import DGatewayPayment from '@/components/store/dgateway-payment';
import { money } from '@/lib/money';
import type { Order } from '@/types';

export default function OrderSuccess({
    order,
    gatewayReady,
    cardsEnabled,
}: {
    order: Order;
    gatewayReady: boolean;
    cardsEnabled: boolean;
}) {
    const payAtShop = order.payment_method === 'pay_at_shop';
    const pickup = order.delivery_method === 'pickup';
    const paid = order.payment_status === 'paid';
    const quoteRequired = order.delivery_fee_status !== 'confirmed';
    const legacy = Boolean(
        order.payment_provider && order.payment_provider !== 'dgateway',
    );

    return (
        <>
            <Head title={paid ? 'Payment confirmed' : 'Order received'} />
            <section className="mx-auto max-w-3xl px-5 pt-40 pb-24">
                <p className="eyebrow">Order {order.number}</p>
                <h1 className="display-heading mt-5">
                    {paid
                        ? 'Thank you for shopping with us.'
                        : payAtShop
                          ? 'Your pickup order is recorded.'
                          : quoteRequired
                            ? 'We will confirm your delivery fee.'
                            : 'Your order is ready for payment.'}
                </h1>
                <p className="mt-5 text-sm leading-7 text-stone-600">
                    {paid
                        ? 'Your payment is confirmed. We will keep you updated on your order.'
                        : payAtShop
                          ? 'Bring your order code to the shop and pay when collecting your items. No online payment is needed.'
                          : quoteRequired
                            ? 'Your order has been received. We will email a delivery quote and payment link. Nothing has been charged.'
                            : 'Review your delivery details and total below before paying.'}
                </p>
                {pickup && (
                    <div className="surface-card mt-8 space-y-3 p-6">
                        <h2 className="font-semibold">Your pickup code</h2>
                        <p className="font-mono text-2xl font-bold tracking-wider break-all">
                            {order.number}
                        </p>
                        <p className="text-sm">
                            Save this code and show it to staff when collecting
                            your order.
                        </p>
                        <p className="text-sm">
                            Pickup location: {order.address}
                        </p>
                        {!paid && order.expires_at && (
                            <p className="text-sm">
                                Reserved until{' '}
                                {new Date(order.expires_at).toLocaleString()}.
                                Please contact the shop if you need more time.
                            </p>
                        )}
                        {order.status === 'cancelled' && (
                            <p role="alert">
                                This reservation has ended. Contact the shop
                                before travelling.
                            </p>
                        )}
                        {order.status === 'delivered' && (
                            <p>Collection recorded.</p>
                        )}
                    </div>
                )}
                <div className="surface-card mt-8 space-y-4 p-6 text-sm">
                    <p>
                        {order.customer_name} · {order.email}
                    </p>
                    <p>
                        {order.delivery_area}
                        <br />
                        {order.address}
                        <br />
                        {order.city}, {order.country}
                    </p>
                    <div className="space-y-2 border-t pt-4">
                        {order.items?.map((item) => (
                            <div
                                className="flex justify-between gap-4"
                                key={item.id}
                            >
                                <span>
                                    {item.product_name} × {item.quantity}
                                </span>
                                <span>{money(item.total)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between">
                        <span>Discounts</span>
                        <span>
                            −{money(order.discount_amount, order.currency)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Delivery</span>
                        <span>
                            {quoteRequired
                                ? 'To be confirmed'
                                : money(order.shipping, order.currency)}
                        </span>
                    </div>
                    <div className="flex justify-between border-t pt-4 font-semibold">
                        <span>
                            {quoteRequired ? 'Total before delivery' : 'Total'}
                        </span>
                        <span>{money(order.total, order.currency)}</span>
                    </div>
                    <p role="status">
                        Payment: {order.payment_status}.{' '}
                        {order.payment_status_message}
                    </p>
                </div>
                {!paid &&
                    !payAtShop &&
                    !quoteRequired &&
                    !legacy &&
                    order.payment_status !== 'refunded' &&
                    gatewayReady && (
                        <DGatewayPayment
                            order={order}
                            cardsEnabled={cardsEnabled}
                        />
                    )}
                {!paid &&
                    !payAtShop &&
                    !quoteRequired &&
                    (!gatewayReady || legacy) && (
                        <p className="mt-6 text-sm">
                            Please contact Ellena for payment assistance. Your
                            order and payment history are saved.
                        </p>
                    )}
                <Link href="/shop" className="text-link mt-8">
                    Continue shopping
                </Link>
            </section>
        </>
    );
}

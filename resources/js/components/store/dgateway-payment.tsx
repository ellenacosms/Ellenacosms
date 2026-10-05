import { router } from '@inertiajs/react';
import {
    Elements,
    PaymentElement,
    useElements,
    useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useMemo, useState } from 'react';
import DeliveryCostWarning from '@/components/store/delivery-cost-warning';
import { money } from '@/lib/money';
import type { Order } from '@/types';

type Payment = {
    status: string;
    provider: string;
    client_secret?: string;
    publishable_key?: string;
};

function CardForm({ onConfirmed }: { onConfirmed: () => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    return (
        <form
            className="mt-5 space-y-4"
            onSubmit={async (e) => {
                e.preventDefault();

                if (!stripe || !elements || busy) {
                    return;
                }

                setBusy(true);

                try {
                    const result = await stripe.confirmPayment({
                        elements,
                        confirmParams: { return_url: window.location.href },
                        redirect: 'if_required',
                    });

                    if (result.error) {
                        setError(
                            result.error.message ??
                                'Card payment could not be completed.',
                        );
                    } else {
                        onConfirmed();
                    }
                } catch {
                    setError(
                        'Connection interrupted. Check payment status before trying again.',
                    );
                } finally {
                    setBusy(false);
                }
            }}
        >
            <PaymentElement />
            <button className="button-dark w-full" disabled={!stripe || busy}>
                Confirm card payment
            </button>
            {error && (
                <p role="alert" className="text-red-700">
                    {error}
                </p>
            )}
        </form>
    );
}

export default function DGatewayPayment({
    order,
    cardsEnabled,
}: {
    order: Order;
    cardsEnabled: boolean;
}) {
    const [phone, setPhone] = useState(order.phone ?? '');
    const [method, setMethod] = useState('mobile');
    const [payment, setPayment] = useState<Payment | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [polling, setPolling] = useState(
        Boolean(order.payment_reference && order.payment_status === 'pending'),
    );
    const [acceptedDeliveryCost, setAcceptedDeliveryCost] = useState('');
    const merchandiseTotal = Math.max(
        0,
        Number(order.total) - Number(order.shipping),
    );
    const deliveryCostsMore =
        order.delivery_fee_status === 'confirmed' &&
        Math.round(Number(order.shipping) * 100) >
            Math.round(merchandiseTotal * 100);
    const deliveryCostKey = `${order.id}:${order.shipping}:${order.total}`;
    const deliveryCostAccepted = acceptedDeliveryCost === deliveryCostKey;
    const publishableKey = payment?.publishable_key;
    const stripe = useMemo(
        () => (publishableKey ? loadStripe(publishableKey) : null),
        [publishableKey],
    );
    useEffect(() => {
        if (!polling) {
            return;
        }

        const abort = new AbortController();
        let checks = 0;
        const timer = window.setInterval(async () => {
            if (++checks > 60) {
                setPolling(false);
                setError(
                    'Still awaiting confirmation. You can check again later; do not make a second payment.',
                );

                return;
            }

            try {
                const response = await fetch(
                    `/orders/${order.id}/payments/dgateway/status`,
                    {
                        headers: { Accept: 'application/json' },
                        signal: abort.signal,
                    },
                );

                if (!response.ok) {
                    return;
                }

                const data = await response.json();

                if (
                    ['paid', 'failed', 'refunded'].includes(data.payment_status)
                ) {
                    setPolling(false);
                    router.reload();
                }
            } catch {
                /* A webhook or the next check can recover a transient failure. */
            }
        }, 10000);

        return () => {
            clearInterval(timer);
            abort.abort();
        };
    }, [order.id, polling]);
    const start = async () => {
        if (busy) {
            return;
        }

        if (
            deliveryCostsMore &&
            !deliveryCostAccepted &&
            !order.payment_reference &&
            !payment
        ) {
            document.getElementById('delivery-cost-warning')?.focus();

            return;
        }

        setBusy(true);
        setError('');

        try {
            const response = await fetch(
                `/orders/${order.id}/payments/dgateway`,
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') ?? '',
                    },
                    body: JSON.stringify({
                        phone,
                        method,
                        expected_total: order.total,
                    }),
                },
            );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.errors?.payment?.[0] ??
                        data.errors?.phone?.[0] ??
                        data.message ??
                        'Payment could not be started.',
                );
            }

            setPayment(data);

            if (data.status === 'paid' || data.status === 'failed') {
                router.reload();

                return;
            }

            setPolling(true);
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : 'Payment is unavailable.',
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="surface-card mt-7 space-y-4 p-6 text-left">
            <h2 className="font-serif text-2xl">Pay securely with D-Gateway</h2>
            <p className="text-sm">
                Total including delivery:{' '}
                <strong>{money(order.total, order.currency)}</strong>
            </p>
            {deliveryCostsMore &&
                !polling &&
                !order.payment_reference &&
                !payment && (
                    <DeliveryCostWarning
                        merchandiseTotal={merchandiseTotal}
                        deliveryFee={Number(order.shipping)}
                        currency={order.currency ?? undefined}
                        acknowledged={deliveryCostAccepted}
                        onContinue={() =>
                            setAcceptedDeliveryCost(deliveryCostKey)
                        }
                        orderPlaced
                    />
                )}
            {!polling && (
                <>
                    <label className="block text-sm">
                        Payment method
                        <select
                            className="mt-2 block w-full border p-3"
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                        >
                            <option value="mobile">Mobile money</option>
                            {cardsEnabled && <option value="card">Card</option>}
                        </select>
                    </label>
                    {method === 'mobile' && (
                        <label className="block text-sm">
                            Mobile-money phone number
                            <input
                                className="mt-2 block w-full border p-3"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="256…"
                            />
                        </label>
                    )}
                    <button
                        className="button-dark w-full"
                        disabled={busy}
                        onClick={start}
                    >
                        {busy
                            ? 'Requesting payment…'
                            : order.payment_reference
                              ? 'Check or resume payment'
                              : `Pay ${money(order.total, order.currency)}`}
                    </button>
                </>
            )}
            {polling && (
                <p role="status" className="text-sm">
                    {payment?.provider === 'stripe'
                        ? 'Complete the card form below. We will verify the payment automatically.'
                        : 'Check your phone and approve the payment prompt. Waiting for confirmation…'}
                </p>
            )}
            {polling && !payment && cardsEnabled && (
                <button className="text-link" disabled={busy} onClick={start}>
                    Resume payment form
                </button>
            )}
            {payment?.provider === 'stripe' &&
                payment.client_secret &&
                stripe && (
                    <Elements
                        stripe={stripe}
                        options={{ clientSecret: payment.client_secret }}
                    >
                        <CardForm onConfirmed={() => setPolling(true)} />
                    </Elements>
                )}
            {error && (
                <p role="alert" className="text-sm text-red-700">
                    {error}
                </p>
            )}
        </section>
    );
}

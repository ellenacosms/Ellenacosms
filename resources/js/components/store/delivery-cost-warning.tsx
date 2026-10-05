import { Link } from '@inertiajs/react';
import { Truck } from 'lucide-react';
import { money } from '@/lib/money';

export default function DeliveryCostWarning({
    merchandiseTotal,
    deliveryFee,
    currency,
    acknowledged,
    onContinue,
    onPickup,
    orderPlaced = false,
}: {
    merchandiseTotal: number;
    deliveryFee: number;
    currency?: string;
    acknowledged: boolean;
    onContinue: () => void;
    onPickup?: () => void;
    orderPlaced?: boolean;
}) {
    return (
        <section
            id="delivery-cost-warning"
            tabIndex={-1}
            aria-label="Review delivery cost"
            className="mt-7 scroll-mt-32 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-700"
        >
            <h2 className="flex items-center gap-2 font-semibold">
                <Truck size={18} aria-hidden="true" /> Delivery costs more than
                your items
            </h2>
            <p className="mt-3 leading-6">
                Your items after discounts cost{' '}
                {money(merchandiseTotal, currency)}. Delivery is{' '}
                {money(deliveryFee, currency)}, bringing your total to{' '}
                <strong>
                    {money(merchandiseTotal + deliveryFee, currency)}
                </strong>
                .
            </p>
            <p className="mt-2 leading-6">
                {orderPlaced
                    ? 'You can keep shopping or continue with this order. Shopping again will not change this saved order.'
                    : `You can add more items${onPickup ? ', choose pickup,' : ''} or continue with delivery.`}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
                <Link href="/shop" className="text-link">
                    Continue shopping
                </Link>
                {onPickup && (
                    <button
                        type="button"
                        className="text-link"
                        onClick={onPickup}
                    >
                        Choose pickup
                    </button>
                )}
                {!acknowledged && (
                    <button
                        type="button"
                        className="button-dark"
                        onClick={onContinue}
                    >
                        Continue anyway
                    </button>
                )}
            </div>
            {acknowledged && (
                <p role="status" className="mt-4">
                    Delivery cost accepted. You can continue below.
                </p>
            )}
        </section>
    );
}

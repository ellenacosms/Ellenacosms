import { Head, Link } from '@inertiajs/react';

export default function PaymentsPaused() {
    return (
        <>
            <Head title="Visit our shop" />
            <section className="mx-auto max-w-3xl px-5 pt-40 pb-24">
                <p className="eyebrow">Checkout</p>
                <h1 className="display-heading mt-5">
                    Visit shop to complete purchase
                </h1>
                <p className="mt-5 text-sm leading-7 text-stone-600">
                    Online payments are temporarily unavailable. Please visit
                    our physical shop to complete your purchase. Your cart is
                    saved, but items have not been reserved and no order has
                    been placed.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                    <Link href="/contact" className="button-dark">
                        Contact the shop
                    </Link>
                    <Link href="/cart" className="text-link self-center">
                        Back to cart
                    </Link>
                </div>
            </section>
        </>
    );
}

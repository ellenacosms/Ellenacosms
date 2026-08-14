import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    ChevronDown,
    Clock3,
    Headphones,
    LoaderCircle,
    LockKeyhole,
    PackageCheck,
    RotateCcw,
    ShieldCheck,
    Truck,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import StoreImage from '@/components/store/store-image';
import { money } from '@/lib/money';
import type { BundleDiscount, CartDiscount, CartItem } from '@/types';

type CheckoutStage = 'delivery' | 'review';

type DeliveryOption = {
    id: string;
    label: string;
    description: string;
    fee: number;
    estimate: string;
    estimatedDeliveryDate: string;
};

type PaymentOption = {
    id: 'pesapal' | 'manual_confirmation';
    label: string;
    description: string;
    enabled: boolean;
};

type CheckoutFormData = {
    customer_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    notes: string;
    delivery_method: string;
    checkout_token: string;
    payment_method: PaymentOption['id'];
};

type CheckoutField = keyof Pick<
    CheckoutFormData,
    | 'customer_name'
    | 'email'
    | 'phone'
    | 'address'
    | 'city'
    | 'country'
    | 'notes'
>;

export default function Checkout({
    items,
    subtotal,
    shipping,
    total,
    discount,
    bundle_discount: bundleDiscount,
    customer,
    checkoutToken,
    deliveryOptions,
    paymentOptions,
    defaultPaymentMethod,
}: {
    items: CartItem[];
    subtotal: number;
    shipping: number;
    total: number;
    free_shipping_threshold: number;
    discount: CartDiscount | null;
    bundle_discount: BundleDiscount | null;
    customer: { name?: string; email?: string; phone?: string } | null;
    checkoutToken: string;
    deliveryOptions: DeliveryOption[];
    paymentOptions: PaymentOption[];
    defaultPaymentMethod: PaymentOption['id'];
}) {
    const [stage, setStage] = useState<CheckoutStage>('delivery');
    const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
    const [pesapalPrepared, setPesapalPrepared] = useState(false);
    const form = useForm<CheckoutFormData>(
        `checkout:${customer?.email ?? 'guest'}`,
        {
            customer_name: customer?.name ?? '',
            email: customer?.email ?? '',
            phone: '',
            address: '',
            city: '',
            country: '',
            notes: '',
            delivery_method: deliveryOptions[0]?.id ?? 'standard',
            checkout_token: checkoutToken,
            payment_method: defaultPaymentMethod,
        },
    );
    const selectedDelivery = useMemo(
        () =>
            deliveryOptions.find(
                (option) => option.id === form.data.delivery_method,
            ) ?? deliveryOptions[0],
        [deliveryOptions, form.data.delivery_method],
    );
    const payableTotal = Math.max(
        0,
        total - shipping + (selectedDelivery?.fee ?? shipping),
    );

    useEffect(() => {
        if (
            stage !== 'review' ||
            form.data.payment_method !== 'pesapal' ||
            pesapalPrepared
        ) {
            return;
        }

        const csrfToken = document
            .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.getAttribute('content');

        if (!csrfToken) {
            return;
        }

        const controller = new AbortController();

        const preparePesapal = async () => {
            try {
                const response = await fetch('/payments/pesapal/prepare', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    signal: controller.signal,
                });

                if (response.ok && !controller.signal.aborted) {
                    setPesapalPrepared(true);
                }
            } catch {
                return;
            }
        };

        void preparePesapal();

        return () => controller.abort();
    }, [form.data.payment_method, pesapalPrepared, stage]);

    const validateField = (field: CheckoutField): string | null => {
        const value = form.data[field].trim();

        if (field === 'customer_name' && value.length < 2) {
            return 'Enter the full name for this delivery.';
        }

        if (field === 'email' && !/^\S+@\S+\.\S+$/.test(value)) {
            return 'Enter a valid email address for order updates.';
        }

        if (field === 'address' && value.length < 5) {
            return 'Enter a complete street or delivery address.';
        }

        if ((field === 'city' || field === 'country') && value.length < 2) {
            return `Enter your ${field}.`;
        }

        if (field === 'phone' && value && value.length < 7) {
            return 'Enter a valid phone number or leave this field empty.';
        }

        if (field === 'notes' && value.length > 1000) {
            return 'Delivery notes must be 1,000 characters or fewer.';
        }

        return null;
    };

    const validateDelivery = (): boolean => {
        const fields: CheckoutField[] = [
            'customer_name',
            'email',
            'phone',
            'address',
            'city',
            'country',
            'notes',
        ];
        let firstInvalidField: CheckoutField | null = null;

        form.clearErrors();

        fields.forEach((field) => {
            const error = validateField(field);

            if (!error) {
                return;
            }

            firstInvalidField ??= field;
            form.setError(field, error);
        });

        if (!selectedDelivery) {
            form.setError('delivery_method', 'Select a delivery option.');
        }

        if (firstInvalidField) {
            document.getElementById(`checkout-${firstInvalidField}`)?.focus();

            return false;
        }

        return Boolean(selectedDelivery);
    };

    const continueToReview = () => {
        if (!validateDelivery()) {
            return;
        }

        setStage('review');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        if (stage !== 'review' || form.processing) {
            return;
        }

        form.post('/checkout', {
            preserveScroll: true,
            onError: (errors) => {
                setStage(errors.payment_method ? 'review' : 'delivery');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
        });
    };

    const updateField = (field: CheckoutField, value: string) => {
        form.setData(field, value);
        form.clearErrors(field);
    };

    const validateOnBlur = (field: CheckoutField) => {
        const error = validateField(field);

        if (error) {
            form.setError(field, error);
        } else {
            form.clearErrors(field);
        }
    };

    return (
        <>
            <Head title="Checkout" />
            <section className="store-container pt-36 pb-48 md:pt-40 md:pb-28">
                <Link href="/cart" className="text-link">
                    <ArrowLeft size={14} /> Return to bag
                </Link>

                <CheckoutProgress
                    stage={stage}
                    onEdit={() => setStage('delivery')}
                />

                <div className="mt-10 flex flex-col justify-between gap-4 border-b border-black/10 pb-8 md:flex-row md:items-end">
                    <div>
                        <p className="eyebrow text-stone-500">
                            Secure checkout
                        </p>
                        <h1 className="display-heading mt-4">
                            {stage === 'delivery'
                                ? 'Where should we send your ritual?'
                                : 'Review every detail.'}
                        </h1>
                    </div>
                    <p className="max-w-sm text-sm leading-6 text-stone-500">
                        {stage === 'delivery'
                            ? 'Your details are remembered on this device while you complete checkout.'
                            : 'Nothing is charged yet. Confirm your order and we will send secure payment instructions.'}
                    </p>
                </div>

                <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_400px] lg:items-start">
                    <form id="checkout-form" onSubmit={submit} noValidate>
                        {stage === 'delivery' ? (
                            <DeliveryStep
                                form={form}
                                emailLocked={Boolean(customer?.email)}
                                deliveryOptions={deliveryOptions}
                                selectedDelivery={selectedDelivery}
                                updateField={updateField}
                                validateOnBlur={validateOnBlur}
                                onDeliveryChange={(value) => {
                                    form.setData('delivery_method', value);
                                    form.clearErrors('delivery_method');
                                }}
                            />
                        ) : (
                            <ReviewStep
                                form={form.data}
                                delivery={selectedDelivery}
                                paymentOptions={paymentOptions}
                                paymentError={form.errors.payment_method}
                                pesapalPrepared={pesapalPrepared}
                                onPaymentChange={(value) => {
                                    form.setData('payment_method', value);
                                    form.clearErrors('payment_method');
                                }}
                                onEdit={() => setStage('delivery')}
                            />
                        )}

                        {stage === 'delivery' ? (
                            <button
                                type="button"
                                onClick={continueToReview}
                                className="button-dark mt-8 w-full"
                            >
                                Continue to review
                            </button>
                        ) : (
                            <div className="mt-8">
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="button-dark w-full gap-2 disabled:cursor-wait disabled:opacity-55"
                                >
                                    {form.processing && (
                                        <LoaderCircle
                                            className="animate-spin"
                                            size={15}
                                        />
                                    )}
                                    {form.processing
                                        ? 'Securing your order…'
                                        : `${form.data.payment_method === 'pesapal' ? 'Continue to secure payment' : 'Place order'} · ${money(payableTotal)}`}
                                </button>
                                <p className="mt-4 flex items-center justify-center gap-2 text-center text-[10px] leading-5 text-stone-500">
                                    <LockKeyhole size={13} /> Protected against
                                    accidental duplicate orders
                                </p>
                            </div>
                        )}
                    </form>

                    <OrderSummary
                        items={items}
                        subtotal={subtotal}
                        deliveryFee={selectedDelivery?.fee ?? shipping}
                        discount={discount}
                        bundleDiscount={bundleDiscount}
                        total={payableTotal}
                        delivery={selectedDelivery}
                        className="hidden lg:sticky lg:top-32 lg:block"
                    />
                </div>
            </section>

            <MobileOrderSummary
                open={mobileSummaryOpen}
                onToggle={() => setMobileSummaryOpen((open) => !open)}
                items={items}
                subtotal={subtotal}
                deliveryFee={selectedDelivery?.fee ?? shipping}
                discount={discount}
                bundleDiscount={bundleDiscount}
                total={payableTotal}
                delivery={selectedDelivery}
                stage={stage}
                processing={form.processing}
                onContinue={() => {
                    if (stage === 'delivery') {
                        continueToReview();

                        return;
                    }

                    const checkoutForm =
                        document.getElementById('checkout-form');

                    if (checkoutForm instanceof HTMLFormElement) {
                        checkoutForm.requestSubmit();
                    }
                }}
            />
        </>
    );
}

function CheckoutProgress({
    stage,
    onEdit,
}: {
    stage: CheckoutStage;
    onEdit: () => void;
}) {
    return (
        <ol className="mt-10 grid grid-cols-3 border-y border-black/10">
            <li>
                <Link
                    href="/cart"
                    className="flex items-center gap-3 py-4 text-[9px] font-semibold tracking-[.15em] uppercase"
                >
                    <ProgressMark complete>1</ProgressMark>
                    <span className="hidden sm:inline">Bag</span>
                </Link>
            </li>
            <li>
                <button
                    type="button"
                    onClick={onEdit}
                    className="flex w-full items-center gap-3 py-4 text-left text-[9px] font-semibold tracking-[.15em] uppercase"
                >
                    <ProgressMark
                        complete={stage === 'review'}
                        active={stage === 'delivery'}
                    >
                        2
                    </ProgressMark>
                    <span className="hidden sm:inline">Delivery</span>
                </button>
            </li>
            <li className="flex items-center gap-3 py-4 text-[9px] font-semibold tracking-[.15em] uppercase">
                <ProgressMark active={stage === 'review'}>3</ProgressMark>
                <span className="hidden sm:inline">Review</span>
            </li>
        </ol>
    );
}

function ProgressMark({
    children,
    active = false,
    complete = false,
}: {
    children: React.ReactNode;
    active?: boolean;
    complete?: boolean;
}) {
    return (
        <span
            className={`grid h-7 w-7 place-items-center rounded-full border text-[9px] ${active || complete ? 'border-brand-rose bg-brand-rose text-white' : 'border-brand-pink text-stone-400'}`}
        >
            {complete ? <Check size={12} /> : children}
        </span>
    );
}

function DeliveryStep({
    form,
    emailLocked,
    deliveryOptions,
    selectedDelivery,
    updateField,
    validateOnBlur,
    onDeliveryChange,
}: {
    form: ReturnType<typeof useForm<CheckoutFormData>>;
    emailLocked: boolean;
    deliveryOptions: DeliveryOption[];
    selectedDelivery?: DeliveryOption;
    updateField: (field: CheckoutField, value: string) => void;
    validateOnBlur: (field: CheckoutField) => void;
    onDeliveryChange: (value: string) => void;
}) {
    return (
        <>
            <section>
                <div className="flex items-center justify-between gap-4">
                    <h2 className="subsection-heading">Delivery details</h2>
                    <span className="text-[9px] tracking-widest text-stone-400 uppercase">
                        * Required
                    </span>
                </div>
                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <Field
                        id="checkout-customer_name"
                        label="Full name *"
                        value={form.data.customer_name}
                        error={form.errors.customer_name}
                        autoComplete="name"
                        onBlur={() => validateOnBlur('customer_name')}
                        onChange={(value) =>
                            updateField('customer_name', value)
                        }
                    />
                    <Field
                        id="checkout-email"
                        label="Email address"
                        type="email"
                        value={form.data.email}
                        error={form.errors.email}
                        autoComplete="email"
                        readOnly={emailLocked}
                        onBlur={() => validateOnBlur('email')}
                        onChange={(value) => updateField('email', value)}
                    />
                    <Field
                        id="checkout-phone"
                        label="Phone (optional)"
                        type="tel"
                        value={form.data.phone}
                        error={form.errors.phone}
                        autoComplete="tel"
                        required={false}
                        onBlur={() => validateOnBlur('phone')}
                        onChange={(value) => updateField('phone', value)}
                    />
                    <Field
                        id="checkout-country"
                        label="Country *"
                        value={form.data.country}
                        error={form.errors.country}
                        autoComplete="country-name"
                        onBlur={() => validateOnBlur('country')}
                        onChange={(value) => updateField('country', value)}
                    />
                    <div className="sm:col-span-2">
                        <Field
                            id="checkout-address"
                            label="Street address *"
                            value={form.data.address}
                            error={form.errors.address}
                            autoComplete="street-address"
                            onBlur={() => validateOnBlur('address')}
                            onChange={(value) => updateField('address', value)}
                        />
                    </div>
                    <Field
                        id="checkout-city"
                        label="City *"
                        value={form.data.city}
                        error={form.errors.city}
                        autoComplete="address-level2"
                        onBlur={() => validateOnBlur('city')}
                        onChange={(value) => updateField('city', value)}
                    />
                    <label className="field">
                        <span>Delivery note (optional)</span>
                        <textarea
                            id="checkout-notes"
                            value={form.data.notes}
                            maxLength={1000}
                            aria-invalid={Boolean(form.errors.notes)}
                            aria-describedby={
                                form.errors.notes
                                    ? 'checkout-notes-error'
                                    : undefined
                            }
                            onBlur={() => validateOnBlur('notes')}
                            onChange={(event) =>
                                updateField('notes', event.target.value)
                            }
                            className={`min-h-28 resize-y ${form.errors.notes ? '!border-red-500' : ''}`}
                        />
                        <span className="text-right text-[9px] font-normal tracking-normal text-stone-400 normal-case">
                            {form.data.notes.length}/1000
                        </span>
                        {form.errors.notes && (
                            <small id="checkout-notes-error" role="alert">
                                {form.errors.notes}
                            </small>
                        )}
                    </label>
                </div>
            </section>

            <fieldset className="mt-12">
                <legend className="subsection-heading">Choose delivery</legend>
                <div className="mt-6 grid gap-3">
                    {deliveryOptions.map((option) => {
                        const selected = selectedDelivery?.id === option.id;

                        return (
                            <label
                                key={option.id}
                                className={`flex cursor-pointer gap-4 border p-5 transition ${selected ? 'border-black bg-white shadow-[0_10px_30px_rgba(45,37,28,.06)]' : 'border-black/10 bg-white/35 hover:border-black/35'}`}
                            >
                                <input
                                    type="radio"
                                    name="delivery_method"
                                    value={option.id}
                                    checked={selected}
                                    onChange={() => onDeliveryChange(option.id)}
                                    className="mt-1 h-4 w-4 accent-black"
                                />
                                <span className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-between">
                                    <span>
                                        <span className="block text-sm font-semibold">
                                            {option.label}
                                        </span>
                                        <span className="mt-1 block text-xs leading-5 text-stone-500">
                                            {option.description}
                                        </span>
                                        <span className="mt-2 flex items-center gap-2 text-[10px] font-semibold tracking-wider uppercase">
                                            <Clock3 size={13} /> Estimated{' '}
                                            {option.estimate}
                                        </span>
                                    </span>
                                    <span className="text-sm font-semibold">
                                        {option.fee
                                            ? money(option.fee)
                                            : 'Complimentary'}
                                    </span>
                                </span>
                            </label>
                        );
                    })}
                </div>
                {form.errors.delivery_method && (
                    <p className="mt-3 text-xs text-red-600" role="alert">
                        {form.errors.delivery_method}
                    </p>
                )}
            </fieldset>
        </>
    );
}

function ReviewStep({
    form,
    delivery,
    paymentOptions,
    paymentError,
    pesapalPrepared,
    onPaymentChange,
    onEdit,
}: {
    form: CheckoutFormData;
    delivery?: DeliveryOption;
    paymentOptions: PaymentOption[];
    paymentError?: string;
    pesapalPrepared: boolean;
    onPaymentChange: (value: PaymentOption['id']) => void;
    onEdit: () => void;
}) {
    return (
        <div className="space-y-5">
            <ReviewCard title="Contact and delivery" onEdit={onEdit}>
                <p className="font-semibold text-black">{form.customer_name}</p>
                <p>{form.email}</p>
                {form.phone && <p>{form.phone}</p>}
                <p className="mt-3">
                    {form.address}
                    <br />
                    {form.city}, {form.country}
                </p>
                {form.notes && (
                    <p className="mt-4 border-t border-black/10 pt-4">
                        Note: {form.notes}
                    </p>
                )}
            </ReviewCard>

            <ReviewCard title="Delivery option" onEdit={onEdit}>
                <div className="flex items-start justify-between gap-5">
                    <div>
                        <p className="font-semibold text-black">
                            {delivery?.label}
                        </p>
                        <p className="mt-1">
                            Estimated arrival {delivery?.estimate}
                        </p>
                    </div>
                    <Truck size={20} className="shrink-0 text-black" />
                </div>
            </ReviewCard>

            <fieldset className="surface-card p-6 sm:p-7">
                <legend className="flex items-center gap-3 px-1 text-sm font-semibold">
                    <LockKeyhole size={18} /> Payment method
                </legend>
                <div className="mt-4 grid gap-3">
                    {paymentOptions.map((option) => (
                        <label
                            key={option.id}
                            className={`flex gap-4 border p-4 transition ${option.enabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-55'} ${form.payment_method === option.id ? 'border-black bg-white' : 'border-black/10 bg-white/30'}`}
                        >
                            <input
                                type="radio"
                                name="payment_method"
                                value={option.id}
                                checked={form.payment_method === option.id}
                                disabled={!option.enabled}
                                onChange={() => onPaymentChange(option.id)}
                                className="mt-1 h-4 w-4 accent-black"
                            />
                            <span>
                                <span className="block text-sm font-semibold">
                                    {option.label}
                                </span>
                                <span className="mt-1 block text-xs leading-5 text-stone-500">
                                    {option.description}
                                </span>
                                {!option.enabled && (
                                    <span className="mt-2 block text-[9px] font-semibold tracking-wider uppercase">
                                        Available after merchant setup
                                    </span>
                                )}
                            </span>
                        </label>
                    ))}
                </div>
                {paymentError && (
                    <p className="mt-3 text-xs text-red-600" role="alert">
                        {paymentError}
                    </p>
                )}
                {form.payment_method === 'pesapal' && (
                    <p
                        className={`mt-4 flex items-center gap-2 text-[10px] font-semibold tracking-wider uppercase ${pesapalPrepared ? 'text-emerald-700' : 'text-stone-500'}`}
                        aria-live="polite"
                    >
                        {pesapalPrepared ? (
                            <Check size={13} />
                        ) : (
                            <LoaderCircle size={13} className="animate-spin" />
                        )}
                        {pesapalPrepared
                            ? 'Secure connection ready'
                            : 'Preparing secure connection'}
                    </p>
                )}
                <p className="mt-4 text-[10px] leading-5 text-stone-500">
                    Pesapal securely handles mobile-money and card details;
                    Ellena never stores them.
                </p>
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-3">
                <TrustPoint icon={ShieldCheck} label="Secure order" />
                <TrustPoint icon={RotateCcw} label="30-day returns" />
                <TrustPoint icon={Headphones} label="Human support" />
            </div>
        </div>
    );
}

function ReviewCard({
    title,
    onEdit,
    children,
}: {
    title: string;
    onEdit: () => void;
    children: React.ReactNode;
}) {
    return (
        <section className="border border-black/10 bg-white/45 p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-4">
                <h2 className="text-sm font-semibold">{title}</h2>
                <button
                    type="button"
                    onClick={onEdit}
                    className="text-[9px] font-semibold tracking-widest uppercase underline underline-offset-4"
                >
                    Edit
                </button>
            </div>
            <div className="mt-5 text-sm leading-6 text-stone-600">
                {children}
            </div>
        </section>
    );
}

function TrustPoint({
    icon: Icon,
    label,
}: {
    icon: typeof ShieldCheck;
    label: string;
}) {
    return (
        <div className="flex items-center gap-3 border border-black/10 bg-white/35 p-4 text-[9px] font-semibold tracking-wider uppercase">
            <Icon size={15} /> {label}
        </div>
    );
}

function OrderSummary({
    items,
    subtotal,
    deliveryFee,
    discount,
    bundleDiscount,
    total,
    delivery,
    className = '',
}: {
    items: CartItem[];
    subtotal: number;
    deliveryFee: number;
    discount: CartDiscount | null;
    bundleDiscount: BundleDiscount | null;
    total: number;
    delivery?: DeliveryOption;
    className?: string;
}) {
    return (
        <aside className={`surface-card h-fit p-7 ${className}`}>
            <div className="flex items-center justify-between gap-4">
                <h2 className="subsection-heading">Your ritual</h2>
                <span className="text-[10px] text-stone-500">
                    {items.reduce((count, item) => count + item.quantity, 0)}{' '}
                    items
                </span>
            </div>
            <div className="mt-6 divide-y divide-black/10">
                {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex gap-4 py-4">
                        <div className="relative h-20 w-16 shrink-0">
                            <StoreImage
                                src={product.images?.[0]}
                                className="object-cover"
                                alt=""
                            />
                            <span className="absolute -top-2 -right-2 grid h-5 w-5 place-items-center rounded-full bg-brand-rose text-[10px] text-white">
                                {quantity}
                            </span>
                        </div>
                        <div className="flex flex-1 justify-between gap-3 py-2">
                            <div>
                                <p className="font-serif text-lg leading-tight">
                                    {product.name}
                                </p>
                                <p className="mt-1 text-[9px] tracking-widest text-stone-500 uppercase">
                                    {product.subtitle}
                                </p>
                            </div>
                            <p className="text-xs">
                                {money(Number(product.price) * quantity)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-5 space-y-3 border-t border-black/10 pt-5 text-sm">
                <SummaryLine label="Subtotal" value={money(subtotal)} />
                <SummaryLine
                    label={delivery?.label ?? 'Delivery'}
                    value={deliveryFee ? money(deliveryFee) : 'Complimentary'}
                />
                {discount && (
                    <SummaryLine
                        label={`Discount (${discount.code})`}
                        value={`-${money(discount.amount)}`}
                        accent
                    />
                )}
                {bundleDiscount && (
                    <SummaryLine
                        label="Ritual savings"
                        value={`-${money(bundleDiscount.amount)}`}
                        accent
                    />
                )}
                <div className="flex justify-between border-t border-black/10 pt-4 font-semibold">
                    <span>Total</span>
                    <span>{money(total)}</span>
                </div>
            </div>
            {delivery && (
                <p className="mt-5 flex items-center gap-2 border-t border-black/10 pt-5 text-[10px] text-stone-500">
                    <PackageCheck size={14} /> Estimated arrival{' '}
                    {delivery.estimate}
                </p>
            )}
        </aside>
    );
}

function SummaryLine({
    label,
    value,
    accent = false,
}: {
    label: string;
    value: string;
    accent?: boolean;
}) {
    return (
        <div
            className={`flex justify-between gap-4 ${accent ? 'text-emerald-700' : ''}`}
        >
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}

function MobileOrderSummary({
    open,
    onToggle,
    stage,
    processing,
    onContinue,
    ...summary
}: {
    open: boolean;
    onToggle: () => void;
    stage: CheckoutStage;
    processing: boolean;
    onContinue: () => void;
    items: CartItem[];
    subtotal: number;
    deliveryFee: number;
    discount: CartDiscount | null;
    bundleDiscount: BundleDiscount | null;
    total: number;
    delivery?: DeliveryOption;
}) {
    return (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-pink/70 bg-brand-white/95 shadow-[0_-16px_45px_rgba(143,40,74,.12)] backdrop-blur lg:hidden">
            {open && (
                <div
                    id="mobile-order-summary"
                    className="max-h-[68vh] overflow-y-auto border-b border-black/10 p-4"
                >
                    <div className="mx-auto max-w-xl">
                        <div className="mb-3 flex justify-end">
                            <button
                                type="button"
                                onClick={onToggle}
                                aria-label="Close order summary"
                                className="grid h-9 w-9 place-items-center rounded-full border border-black/10 bg-white"
                            >
                                <X size={15} />
                            </button>
                        </div>
                        <OrderSummary {...summary} />
                    </div>
                </div>
            )}
            <div className="mx-auto grid w-full max-w-xl grid-cols-[1fr_auto] items-center gap-3 px-4 py-3">
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={open}
                    aria-controls="mobile-order-summary"
                    className="flex min-w-0 items-center justify-between gap-3 text-left"
                >
                    <span>
                        <span className="flex items-center gap-2 text-[9px] font-semibold tracking-widest uppercase">
                            Order summary
                            <ChevronDown
                                size={14}
                                className={`transition ${open ? 'rotate-180' : ''}`}
                            />
                        </span>
                        <span className="mt-1 block font-serif text-xl">
                            {money(summary.total)}
                        </span>
                    </span>
                </button>
                <button
                    type="button"
                    onClick={onContinue}
                    disabled={processing}
                    className="button-dark h-12 min-w-[182px] disabled:opacity-55"
                >
                    {processing
                        ? 'Securing…'
                        : stage === 'delivery'
                          ? 'Continue'
                          : 'Review & pay'}
                </button>
            </div>
        </div>
    );
}

function Field({
    id,
    label,
    type = 'text',
    value,
    error,
    autoComplete,
    required = true,
    readOnly = false,
    onBlur,
    onChange,
}: {
    id: string;
    label: string;
    type?: string;
    value: string;
    error?: string;
    autoComplete?: string;
    required?: boolean;
    readOnly?: boolean;
    onBlur?: () => void;
    onChange: (value: string) => void;
}) {
    const errorId = `${id}-error`;

    return (
        <label className="field" htmlFor={id}>
            <span>{label}</span>
            <input
                id={id}
                type={type}
                value={value}
                autoComplete={autoComplete}
                required={required}
                readOnly={readOnly}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                onBlur={onBlur}
                onChange={(event) => onChange(event.target.value)}
                className={`${readOnly ? 'cursor-not-allowed opacity-65' : ''} ${error ? '!border-red-500' : ''}`}
            />
            {error && (
                <small id={errorId} role="alert">
                    {error}
                </small>
            )}
        </label>
    );
}

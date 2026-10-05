import { Head, useForm } from '@inertiajs/react';

type Settings = {
    store_name?: string;
    support_email?: string;
    currency?: string;
    free_shipping_threshold?: string;
    low_stock_threshold?: string;
    order_prefix?: string;
};

export default function StoreSettings({ settings }: { settings: Settings }) {
    const form = useForm({
        store_name: settings.store_name ?? 'ELLENA',
        support_email: settings.support_email ?? 'concierge@ellena.com',
        currency: settings.currency ?? 'UGX',
        free_shipping_threshold: settings.free_shipping_threshold ?? '150',
        low_stock_threshold: settings.low_stock_threshold ?? '10',
        order_prefix: settings.order_prefix ?? 'ELN',
    });

    return (
        <>
            <Head title="Store settings" />
            <div>
                <p className="admin-eyebrow">Configuration</p>
                <h1 className="admin-title">Store settings</h1>
                <p className="mt-2 text-sm text-stone-500">
                    Manage the operational defaults used across commerce.
                </p>
            </div>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    form.put('/admin/settings');
                }}
                className="mt-9 max-w-3xl space-y-6"
            >
                <section className="admin-card">
                    <h2 className="admin-section-title">Store identity</h2>
                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                        <Field
                            label="Store name"
                            value={form.data.store_name}
                            error={form.errors.store_name}
                            onChange={(value) =>
                                form.setData('store_name', value)
                            }
                        />
                        <Field
                            label="Support email"
                            type="email"
                            value={form.data.support_email}
                            error={form.errors.support_email}
                            onChange={(value) =>
                                form.setData('support_email', value)
                            }
                        />
                    </div>
                </section>
                <section className="admin-card">
                    <h2 className="admin-section-title">Commerce defaults</h2>
                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                        <Field
                            label="Currency code"
                            value={form.data.currency}
                            error={form.errors.currency}
                            onChange={(value) =>
                                form.setData('currency', value.toUpperCase())
                            }
                        />
                        <Field
                            label="Order number prefix"
                            value={form.data.order_prefix}
                            error={form.errors.order_prefix}
                            onChange={(value) =>
                                form.setData(
                                    'order_prefix',
                                    value.toUpperCase(),
                                )
                            }
                        />
                        <a href="/admin/delivery" className="text-sm underline">
                            Manage delivery fees and free-delivery thresholds by
                            area
                        </a>
                        <Field
                            label="Low stock threshold"
                            type="number"
                            value={form.data.low_stock_threshold}
                            error={form.errors.low_stock_threshold}
                            onChange={(value) =>
                                form.setData('low_stock_threshold', value)
                            }
                        />
                    </div>
                </section>
                <div className="flex justify-end">
                    <button disabled={form.processing} className="admin-button">
                        Save settings
                    </button>
                </div>
            </form>
        </>
    );
}

function Field({
    label,
    value,
    error,
    type = 'text',
    onChange,
}: {
    label: string;
    value: string;
    error?: string;
    type?: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="admin-field">
            <span>{label}</span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
            {error && <small>{error}</small>}
        </label>
    );
}

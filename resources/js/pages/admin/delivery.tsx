import { Head, useForm } from '@inertiajs/react';

type Zone = {
    id?: number;
    country: string;
    district: string;
    area: string;
    fee: string | null;
    free_above: string | null;
    minimum_days: number;
    maximum_days: number;
    is_active: boolean;
};

function ZoneEditor({ zone }: { zone?: Zone }) {
    const form = useForm({
        country: zone?.country ?? 'Uganda',
        district: zone?.district ?? '',
        area: zone?.area ?? '',
        fee: zone?.fee ?? '',
        free_above: zone?.free_above ?? '',
        minimum_days: zone?.minimum_days ?? 1,
        maximum_days: zone?.maximum_days ?? 3,
        is_active: zone?.is_active ?? true,
    });

    return (
        <form
            className="admin-card grid gap-4 sm:grid-cols-3"
            onSubmit={(e) => {
                e.preventDefault();

                if (zone) {
                    form.put(`/admin/delivery/${zone.id}`);
                } else {
                    form.post('/admin/delivery', {
                        onSuccess: () => form.reset(),
                    });
                }
            }}
        >
            {(
                ['country', 'district', 'area', 'fee', 'free_above'] as const
            ).map((key) => (
                <label className="admin-field" key={key}>
                    <span>
                        {
                            {
                                country: 'Country',
                                district: 'District / city',
                                area: 'Area',
                                fee: 'Delivery fee (blank = quote required)',
                                free_above: 'Free above (blank = disabled)',
                            }[key]
                        }
                    </span>
                    <input
                        type={
                            ['fee', 'free_above'].includes(key)
                                ? 'number'
                                : 'text'
                        }
                        min="0"
                        step="0.01"
                        value={form.data[key]}
                        onChange={(e) => form.setData(key, e.target.value)}
                        required={['country', 'district', 'area'].includes(key)}
                    />
                </label>
            ))}
            {(['minimum_days', 'maximum_days'] as const).map((key) => (
                <label className="admin-field" key={key}>
                    <span>
                        {key === 'minimum_days'
                            ? 'Minimum business days'
                            : 'Maximum business days'}
                    </span>
                    <input
                        type="number"
                        min="0"
                        max="90"
                        value={form.data[key]}
                        onChange={(e) =>
                            form.setData(key, Number(e.target.value))
                        }
                        required
                    />
                </label>
            ))}
            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={form.data.is_active}
                    onChange={(e) =>
                        form.setData('is_active', e.target.checked)
                    }
                />{' '}
                Available at checkout
            </label>
            <div className="sm:col-span-3">
                {Object.entries(form.errors).map(([key, error]) => (
                    <p key={key} role="alert" className="text-sm text-red-700">
                        {error}
                    </p>
                ))}
                <button
                    disabled={form.processing}
                    className="admin-button mt-3"
                >
                    {zone ? 'Save area' : 'Add area'}
                </button>
            </div>
        </form>
    );
}

export default function Delivery({
    zones,
    pickupEnabled,
    pickupAddress,
}: {
    zones: Zone[];
    pickupEnabled: boolean;
    pickupAddress: string;
}) {
    const pickup = useForm({ enabled: pickupEnabled, address: pickupAddress });

    return (
        <>
            <Head title="Delivery areas" />
            <h1 className="admin-title">Delivery areas</h1>
            <p className="mt-3 text-sm text-stone-600">
                Enter your agreed courier rates in the store currency. Blank
                fees require a quote; zero means free delivery. Disabling an
                area does not change existing orders.
            </p>
            <form
                className="admin-card my-8 space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    pickup.put('/admin/delivery-pickup');
                }}
            >
                <h2 className="admin-section-title">Store pickup</h2>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={pickup.data.enabled}
                        onChange={(e) =>
                            pickup.setData('enabled', e.target.checked)
                        }
                    />{' '}
                    Offer free store pickup
                </label>
                <label className="admin-field">
                    <span>Pickup address and instructions</span>
                    <input
                        value={pickup.data.address}
                        onChange={(e) =>
                            pickup.setData('address', e.target.value)
                        }
                    />
                </label>
                {Object.values(pickup.errors).map((error) => (
                    <p key={error} role="alert">
                        {error}
                    </p>
                ))}
                <button className="admin-button" disabled={pickup.processing}>
                    Save pickup
                </button>
            </form>
            <div className="space-y-5">
                <h2 className="admin-section-title">Add delivery area</h2>
                <ZoneEditor />
                {zones.map((zone) => (
                    <ZoneEditor key={zone.id} zone={zone} />
                ))}
            </div>
        </>
    );
}

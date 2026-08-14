import { Head, router, useForm } from '@inertiajs/react';
import { BadgePercent, Copy, Trash2 } from 'lucide-react';
import { money } from '@/lib/money';
import type { Discount } from '@/types';

export default function Discounts({ discounts }: { discounts: Discount[] }) {
    const form = useForm({
        name: '',
        code: '',
        type: 'percentage',
        value: '',
        minimum_order: '',
        usage_limit: '',
        starts_at: '',
        ends_at: '',
        is_active: true,
    });

    return (
        <>
            <Head title="Discounts" />
            <div>
                <p className="admin-eyebrow">Sales</p>
                <h1 className="admin-title">Discounts</h1>
                <p className="mt-2 text-sm text-stone-500">
                    Create controlled offers without changing product prices.
                </p>
            </div>
            <div className="mt-9 grid gap-6 xl:grid-cols-[390px_1fr]">
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post('/admin/discounts', {
                            onSuccess: () => form.reset(),
                        });
                    }}
                    className="admin-card h-fit"
                >
                    <h2 className="admin-section-title">New discount</h2>
                    <div className="mt-6 space-y-5">
                        <Field
                            label="Internal name"
                            value={form.data.name}
                            error={form.errors.name}
                            onChange={(value) => form.setData('name', value)}
                        />
                        <Field
                            label="Coupon code"
                            value={form.data.code}
                            error={form.errors.code}
                            onChange={(value) =>
                                form.setData('code', value.toUpperCase())
                            }
                        />
                        <label className="admin-field">
                            <span>Discount type</span>
                            <select
                                value={form.data.type}
                                onChange={(event) =>
                                    form.setData('type', event.target.value)
                                }
                            >
                                <option value="percentage">Percentage</option>
                                <option value="fixed">Fixed amount</option>
                            </select>
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <Field
                                label="Value"
                                type="number"
                                value={form.data.value}
                                error={form.errors.value}
                                onChange={(value) =>
                                    form.setData('value', value)
                                }
                            />
                            <Field
                                label="Minimum order"
                                type="number"
                                value={form.data.minimum_order}
                                error={form.errors.minimum_order}
                                onChange={(value) =>
                                    form.setData('minimum_order', value)
                                }
                            />
                        </div>
                        <Field
                            label="Usage limit"
                            type="number"
                            value={form.data.usage_limit}
                            error={form.errors.usage_limit}
                            onChange={(value) =>
                                form.setData('usage_limit', value)
                            }
                        />
                        <button className="admin-button w-full">
                            Create discount
                        </button>
                    </div>
                </form>
                <section className="space-y-4">
                    {discounts.map((discount) => (
                        <div
                            key={discount.id}
                            className="admin-card flex flex-col justify-between gap-5 md:flex-row md:items-center"
                        >
                            <div className="flex items-center gap-4">
                                <div className="grid h-12 w-12 place-items-center bg-stone-100">
                                    <BadgePercent size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="font-semibold">
                                            {discount.name}
                                        </h2>
                                        <span
                                            className={`status ${discount.is_active ? 'status-delivered' : 'status-cancelled'}`}
                                        >
                                            {discount.is_active
                                                ? 'Active'
                                                : 'Disabled'}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
                                        <code className="bg-stone-100 px-2 py-1 font-semibold text-black">
                                            {discount.code}
                                        </code>
                                        <button
                                            onClick={() =>
                                                navigator.clipboard.writeText(
                                                    discount.code,
                                                )
                                            }
                                            aria-label="Copy code"
                                        >
                                            <Copy size={13} />
                                        </button>
                                        <span>·</span>
                                        <span>
                                            {discount.type === 'percentage'
                                                ? `${Number(discount.value)}% off`
                                                : `${money(discount.value)} off`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-stone-500">
                                    Used {discount.times_used}
                                    {discount.usage_limit
                                        ? ` / ${discount.usage_limit}`
                                        : ''}
                                </span>
                                <button
                                    onClick={() =>
                                        router.put(
                                            `/admin/discounts/${discount.id}`,
                                            {
                                                ...discount,
                                                is_active: !discount.is_active,
                                            },
                                            { preserveScroll: true },
                                        )
                                    }
                                    className="admin-secondary"
                                >
                                    {discount.is_active ? 'Disable' : 'Enable'}
                                </button>
                                <button
                                    onClick={() => {
                                        if (
                                            confirm(`Delete ${discount.code}?`)
                                        ) {
                                            router.delete(
                                                `/admin/discounts/${discount.id}`,
                                            );
                                        }
                                    }}
                                    className="admin-icon text-red-600"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {!discounts.length && (
                        <div className="admin-card py-16 text-center text-sm text-stone-500">
                            No discount codes yet.
                        </div>
                    )}
                </section>
            </div>
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

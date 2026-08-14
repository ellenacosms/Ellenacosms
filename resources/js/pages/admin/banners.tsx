import { Head, router, useForm } from '@inertiajs/react';
import { ImagePlus, Pencil, Trash2, UploadCloud, X } from 'lucide-react';
import { useState } from 'react';
import type { Banner } from '@/types';

type BannerForm = {
    _method?: 'put';
    name: string;
    placement: 'hero' | 'promotion';
    eyebrow: string;
    title: string;
    subtitle: string;
    image_file: File | null;
    mobile_image_file: File | null;
    cta_label: string;
    cta_url: string;
    text_position: 'left' | 'center' | 'right';
    overlay_opacity: string;
    sort_order: string;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
};

const emptyForm: BannerForm = {
    name: '',
    placement: 'hero',
    eyebrow: '',
    title: '',
    subtitle: '',
    image_file: null,
    mobile_image_file: null,
    cta_label: 'Shop now',
    cta_url: '/shop',
    text_position: 'left',
    overlay_opacity: '10',
    sort_order: '0',
    starts_at: '',
    ends_at: '',
    is_active: true,
};

export default function Banners({ banners }: { banners: Banner[] }) {
    const [editing, setEditing] = useState<Banner | null>(null);
    const form = useForm<BannerForm>(emptyForm);

    const edit = (banner: Banner) => {
        setEditing(banner);
        form.setData({
            name: banner.name,
            placement: banner.placement,
            eyebrow: banner.eyebrow ?? '',
            title: banner.title,
            subtitle: banner.subtitle ?? '',
            image_file: null,
            mobile_image_file: null,
            cta_label: banner.cta_label ?? '',
            cta_url: banner.cta_url ?? '',
            text_position: banner.text_position,
            overlay_opacity: banner.overlay_opacity.toString(),
            sort_order: banner.sort_order.toString(),
            starts_at: toDateInput(banner.starts_at),
            ends_at: toDateInput(banner.ends_at),
            is_active: banner.is_active,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditing(null);
        form.clearErrors();
        form.setData(emptyForm);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.transform((data) => {
            const values = { ...data };
            delete values._method;

            return editing ? { ...values, _method: 'put' as const } : values;
        });

        if (editing) {
            form.post(`/admin/banners/${editing.id}`, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: cancelEdit,
            });

            return;
        }

        form.post('/admin/banners', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <>
            <Head title="Advertising banners" />
            <div>
                <p className="admin-eyebrow">Marketing</p>
                <h1 className="admin-title">Advertising banners</h1>
                <p className="mt-2 text-sm text-stone-500">
                    Upload homepage campaigns, choose their placement, and
                    schedule when each banner appears.
                </p>
            </div>

            <div className="mt-9 grid gap-6 xl:grid-cols-[420px_1fr]">
                <form onSubmit={submit} className="admin-card h-fit">
                    <div className="flex items-center justify-between">
                        <h2 className="admin-section-title">
                            {editing ? 'Edit banner' : 'New banner'}
                        </h2>
                        {editing && (
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="admin-icon"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <div className="mt-6 space-y-5">
                        <Field
                            label="Internal campaign name"
                            value={form.data.name}
                            error={form.errors.name}
                            onChange={(value) => form.setData('name', value)}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <SelectField
                                label="Placement"
                                value={form.data.placement}
                                options={[
                                    ['hero', 'Homepage hero'],
                                    ['promotion', 'Promotion grid'],
                                ]}
                                onChange={(value) =>
                                    form.setData(
                                        'placement',
                                        value as BannerForm['placement'],
                                    )
                                }
                            />
                            <Field
                                label="Display order"
                                type="number"
                                value={form.data.sort_order}
                                error={form.errors.sort_order}
                                onChange={(value) =>
                                    form.setData('sort_order', value)
                                }
                            />
                        </div>
                        <Field
                            label="Eyebrow"
                            value={form.data.eyebrow}
                            error={form.errors.eyebrow}
                            onChange={(value) => form.setData('eyebrow', value)}
                        />
                        <Field
                            label="Headline"
                            value={form.data.title}
                            error={form.errors.title}
                            onChange={(value) => form.setData('title', value)}
                        />
                        <label className="admin-field">
                            <span>Description</span>
                            <textarea
                                rows={3}
                                value={form.data.subtitle}
                                onChange={(event) =>
                                    form.setData('subtitle', event.target.value)
                                }
                            />
                            {form.errors.subtitle && (
                                <small>{form.errors.subtitle}</small>
                            )}
                        </label>

                        <UploadField
                            label={
                                editing
                                    ? 'Replace desktop image (optional)'
                                    : 'Desktop image'
                            }
                            hint="Recommended: 2000 × 1200 px"
                            error={form.errors.image_file}
                            onChange={(file) =>
                                form.setData('image_file', file)
                            }
                        />
                        <UploadField
                            label="Mobile image (optional)"
                            hint="Recommended: 900 × 1200 px"
                            error={form.errors.mobile_image_file}
                            onChange={(file) =>
                                form.setData('mobile_image_file', file)
                            }
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Field
                                label="Button label"
                                value={form.data.cta_label}
                                error={form.errors.cta_label}
                                onChange={(value) =>
                                    form.setData('cta_label', value)
                                }
                            />
                            <Field
                                label="Button link"
                                value={form.data.cta_url}
                                error={form.errors.cta_url}
                                onChange={(value) =>
                                    form.setData('cta_url', value)
                                }
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <SelectField
                                label="Text position"
                                value={form.data.text_position}
                                options={[
                                    ['left', 'Left'],
                                    ['center', 'Center'],
                                    ['right', 'Right'],
                                ]}
                                onChange={(value) =>
                                    form.setData(
                                        'text_position',
                                        value as BannerForm['text_position'],
                                    )
                                }
                            />
                            <Field
                                label="Overlay %"
                                type="number"
                                value={form.data.overlay_opacity}
                                error={form.errors.overlay_opacity}
                                onChange={(value) =>
                                    form.setData('overlay_opacity', value)
                                }
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Field
                                label="Starts at"
                                type="datetime-local"
                                value={form.data.starts_at}
                                error={form.errors.starts_at}
                                onChange={(value) =>
                                    form.setData('starts_at', value)
                                }
                            />
                            <Field
                                label="Ends at"
                                type="datetime-local"
                                value={form.data.ends_at}
                                error={form.errors.ends_at}
                                onChange={(value) =>
                                    form.setData('ends_at', value)
                                }
                            />
                        </div>
                        <label className="flex cursor-pointer items-center justify-between gap-4 border-t border-black/10 pt-5 text-sm">
                            <span>Active on storefront</span>
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(event) =>
                                    form.setData(
                                        'is_active',
                                        event.target.checked,
                                    )
                                }
                                className="h-4 w-4 accent-black"
                            />
                        </label>
                        <button
                            disabled={form.processing}
                            className="admin-button w-full"
                        >
                            {form.processing
                                ? 'Uploading…'
                                : editing
                                  ? 'Save banner'
                                  : 'Upload banner'}
                        </button>
                    </div>
                </form>

                <section className="space-y-4">
                    {banners.map((banner) => (
                        <article
                            key={banner.id}
                            className="admin-card overflow-hidden p-0"
                        >
                            <div className="grid md:grid-cols-[240px_1fr]">
                                <div className="relative min-h-48 bg-stone-200">
                                    <img
                                        src={banner.image}
                                        alt=""
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                    <span className="absolute top-3 left-3 bg-white px-2 py-1 text-[9px] font-semibold tracking-wider uppercase">
                                        {banner.placement}
                                    </span>
                                </div>
                                <div className="flex flex-col justify-between gap-5 p-6">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h2 className="text-lg font-semibold">
                                                {banner.name}
                                            </h2>
                                            <span
                                                className={`status ${banner.is_active ? 'status-delivered' : 'status-cancelled'}`}
                                            >
                                                {banner.is_active
                                                    ? 'Active'
                                                    : 'Disabled'}
                                            </span>
                                        </div>
                                        <p className="mt-3 font-serif text-2xl">
                                            {banner.title}
                                        </p>
                                        <p className="mt-2 text-xs text-stone-500">
                                            Order {banner.sort_order}
                                            {banner.starts_at
                                                ? ` · Starts ${new Date(banner.starts_at).toLocaleDateString()}`
                                                : ''}
                                            {banner.ends_at
                                                ? ` · Ends ${new Date(banner.ends_at).toLocaleDateString()}`
                                                : ''}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => edit(banner)}
                                            className="admin-secondary"
                                        >
                                            <Pencil size={14} /> Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.post(
                                                    `/admin/banners/${banner.id}`,
                                                    {
                                                        ...banner,
                                                        _method: 'put',
                                                        is_active:
                                                            !banner.is_active,
                                                    },
                                                    { preserveScroll: true },
                                                )
                                            }
                                            className="admin-secondary"
                                        >
                                            {banner.is_active
                                                ? 'Disable'
                                                : 'Enable'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                confirm(
                                                    `Delete ${banner.name}?`,
                                                ) &&
                                                router.delete(
                                                    `/admin/banners/${banner.id}`,
                                                )
                                            }
                                            className="admin-icon ml-auto text-red-600"
                                            aria-label="Delete banner"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                    {!banners.length && (
                        <div className="admin-card py-20 text-center">
                            <ImagePlus
                                className="mx-auto text-stone-300"
                                size={36}
                            />
                            <p className="mt-4 text-sm text-stone-500">
                                No advertising banners yet.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

function UploadField({
    label,
    hint,
    error,
    onChange,
}: {
    label: string;
    hint: string;
    error?: string;
    onChange: (file: File | null) => void;
}) {
    return (
        <label className="flex cursor-pointer items-center gap-4 border border-dashed border-black/25 bg-stone-50 p-5 hover:border-black">
            <span className="grid h-11 w-11 shrink-0 place-items-center bg-white">
                <UploadCloud size={20} />
            </span>
            <span className="min-w-0">
                <strong className="block text-xs">{label}</strong>
                <small className={error ? 'text-red-600' : 'text-stone-500'}>
                    {error ?? `${hint} · max 8 MB`}
                </small>
            </span>
            <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                onChange={(event) => onChange(event.target.files?.[0] ?? null)}
            />
        </label>
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

function SelectField({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: [string, string][];
    onChange: (value: string) => void;
}) {
    return (
        <label className="admin-field">
            <span>{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                {options.map(([optionValue, optionLabel]) => (
                    <option key={optionValue} value={optionValue}>
                        {optionLabel}
                    </option>
                ))}
            </select>
        </label>
    );
}

function toDateInput(value?: string): string {
    return value ? new Date(value).toISOString().slice(0, 16) : '';
}

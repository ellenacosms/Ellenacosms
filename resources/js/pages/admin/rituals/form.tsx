import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ImagePlus,
    Layers3,
    Plus,
    Trash2,
    UploadCloud,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useMemo } from 'react';
import type { Category } from '@/types';

type ProductOption = {
    id: number;
    category_id: number;
    category?: Pick<Category, 'id' | 'name'>;
    name: string;
    sku: string;
    stock: number;
    images: string[];
    is_active: boolean;
};

type RitualProduct = ProductOption & {
    pivot: {
        step_order: number;
        instruction?: string;
    };
};

type AdminRitual = {
    id: number;
    name: string;
    eyebrow?: string;
    description: string;
    image?: string;
    discount_percent: string | number;
    steps?: string[];
    sort_order: number;
    is_featured: boolean;
    is_active: boolean;
    products: RitualProduct[];
};

type ProductStep = {
    product_id: string;
    instruction: string;
};

type RitualForm = {
    _method?: 'put';
    name: string;
    eyebrow: string;
    description: string;
    steps_text: string;
    discount_percent: string;
    sort_order: string;
    existing_image: string;
    image_url: string;
    ritual_image: File | null;
    is_featured: boolean;
    is_active: boolean;
    products: ProductStep[];
};

export default function RitualFormPage({
    ritual,
    products,
}: {
    ritual: AdminRitual | null;
    products: ProductOption[];
}) {
    const form = useForm<RitualForm>({
        name: ritual?.name ?? '',
        eyebrow: ritual?.eyebrow ?? '',
        description: ritual?.description ?? '',
        steps_text: ritual?.steps?.join('\n') ?? '',
        discount_percent: ritual?.discount_percent?.toString() ?? '10',
        sort_order: ritual?.sort_order?.toString() ?? '0',
        existing_image: ritual?.image ?? '',
        image_url: '',
        ritual_image: null,
        is_featured: ritual?.is_featured ?? false,
        is_active: ritual?.is_active ?? true,
        products:
            ritual?.products.map((product) => ({
                product_id: product.id.toString(),
                instruction: product.pivot.instruction ?? '',
            })) ?? [],
    });
    const errors = form.errors as Record<string, string | undefined>;
    const selectedIds = form.data.products.map((item) => item.product_id);
    const availableProduct = products.find(
        (product) => !selectedIds.includes(product.id.toString()),
    );

    const addProduct = () => {
        if (!availableProduct || form.data.products.length >= 8) {
            return;
        }

        form.setData('products', [
            ...form.data.products,
            {
                product_id: availableProduct.id.toString(),
                instruction: '',
            },
        ]);
    };

    const updateProduct = (index: number, values: Partial<ProductStep>) => {
        form.setData(
            'products',
            form.data.products.map((item, itemIndex) =>
                itemIndex === index ? { ...item, ...values } : item,
            ),
        );
    };

    const moveProduct = (index: number, direction: -1 | 1) => {
        const destination = index + direction;

        if (destination < 0 || destination >= form.data.products.length) {
            return;
        }

        const reordered = [...form.data.products];
        [reordered[index], reordered[destination]] = [
            reordered[destination],
            reordered[index],
        ];
        form.setData('products', reordered);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (ritual) {
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(`/admin/rituals/${ritual.id}`, {
                forceFormData: true,
            });
        } else {
            form.post('/admin/rituals', { forceFormData: true });
        }
    };

    return (
        <>
            <Head title={ritual ? `Edit ${ritual.name}` : 'Add ritual'} />
            <form onSubmit={submit}>
                <div className="flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <p className="admin-eyebrow">Merchandising</p>
                        <h1 className="admin-title">
                            {ritual ? 'Edit ritual' : 'New ritual'}
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/admin/rituals" className="admin-secondary">
                            Cancel
                        </Link>
                        <button
                            disabled={form.processing}
                            className="admin-button disabled:opacity-50"
                        >
                            {ritual ? 'Save changes' : 'Publish ritual'}
                        </button>
                    </div>
                </div>

                <div className="mt-8 grid border border-black/10 bg-white sm:grid-cols-4">
                    {[
                        ['01', 'Story'],
                        ['02', 'Routine'],
                        ['03', 'Products'],
                        ['04', 'Publish'],
                    ].map(([number, label]) => (
                        <div
                            key={number}
                            className="flex items-center gap-3 border-b border-black/10 px-5 py-4 last:border-0 sm:border-r sm:border-b-0"
                        >
                            <span className="grid h-7 w-7 place-items-center rounded-full bg-black text-[10px] font-semibold text-white">
                                {number}
                            </span>
                            <span className="text-xs font-semibold">
                                {label}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-9 grid gap-6 xl:grid-cols-[1fr_360px]">
                    <div className="space-y-6">
                        <section className="admin-card">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="admin-section-title">
                                        Ritual story
                                    </h2>
                                    <p className="mt-1 text-xs text-stone-500">
                                        Explain the concern, result, and ideal
                                        moment for this routine.
                                    </p>
                                </div>
                                <Layers3 size={21} className="text-stone-400" />
                            </div>
                            <div className="mt-6 grid gap-5 sm:grid-cols-2">
                                <AdminField
                                    label="Ritual name"
                                    value={form.data.name}
                                    error={form.errors.name}
                                    onChange={(value) =>
                                        form.setData('name', value)
                                    }
                                />
                                <AdminField
                                    label="Eyebrow"
                                    value={form.data.eyebrow}
                                    error={form.errors.eyebrow}
                                    placeholder="Hair ritual · 3 steps"
                                    onChange={(value) =>
                                        form.setData('eyebrow', value)
                                    }
                                />
                                <div className="sm:col-span-2">
                                    <AdminArea
                                        label="Description"
                                        value={form.data.description}
                                        error={form.errors.description}
                                        rows={6}
                                        onChange={(value) =>
                                            form.setData('description', value)
                                        }
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="admin-card">
                            <h2 className="admin-section-title">
                                Routine method
                            </h2>
                            <p className="mt-1 text-xs text-stone-500">
                                Add up to eight short directions, one per line.
                            </p>
                            <div className="mt-6">
                                <AdminArea
                                    label="How to perform the ritual"
                                    value={form.data.steps_text}
                                    error={form.errors.steps_text}
                                    rows={8}
                                    placeholder={
                                        'Cleanse and prepare the hair.\nApply treatment from root to tip.\nSeal and style as desired.'
                                    }
                                    onChange={(value) =>
                                        form.setData('steps_text', value)
                                    }
                                />
                            </div>
                        </section>

                        <section className="admin-card">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <h2 className="admin-section-title">
                                        Products and order
                                    </h2>
                                    <p className="mt-1 text-xs text-stone-500">
                                        A ritual needs 2–8 unique products. The
                                        displayed order is the usage order.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={addProduct}
                                    disabled={
                                        !availableProduct ||
                                        form.data.products.length >= 8
                                    }
                                    className="admin-secondary flex items-center gap-2 disabled:opacity-40"
                                >
                                    <Plus size={15} /> Add product
                                </button>
                            </div>

                            <div className="mt-6 space-y-3">
                                {form.data.products.length === 0 && (
                                    <button
                                        type="button"
                                        onClick={addProduct}
                                        className="flex w-full flex-col items-center border border-dashed border-black/20 bg-stone-50 px-5 py-10 text-center hover:border-black"
                                    >
                                        <Plus size={20} />
                                        <strong className="mt-3 text-sm">
                                            Add the first product
                                        </strong>
                                        <span className="mt-1 text-xs text-stone-500">
                                            Add at least two products to
                                            publish.
                                        </span>
                                    </button>
                                )}
                                {form.data.products.map((item, index) => {
                                    const product = products.find(
                                        (option) =>
                                            option.id.toString() ===
                                            item.product_id,
                                    );

                                    return (
                                        <div
                                            key={`${item.product_id}-${index}`}
                                            className="border border-black/10 p-4"
                                        >
                                            <div className="grid gap-4 md:grid-cols-[44px_1fr_auto] md:items-start">
                                                <span className="grid h-11 w-11 place-items-center rounded-full bg-black text-xs font-semibold text-white">
                                                    {String(index + 1).padStart(
                                                        2,
                                                        '0',
                                                    )}
                                                </span>
                                                <div className="grid gap-4 sm:grid-cols-[1fr_1.25fr]">
                                                    <label className="admin-field">
                                                        <span>Product</span>
                                                        <select
                                                            value={
                                                                item.product_id
                                                            }
                                                            onChange={(event) =>
                                                                updateProduct(
                                                                    index,
                                                                    {
                                                                        product_id:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <option value="">
                                                                Select product
                                                            </option>
                                                            {products.map(
                                                                (option) => (
                                                                    <option
                                                                        key={
                                                                            option.id
                                                                        }
                                                                        value={
                                                                            option.id
                                                                        }
                                                                        disabled={
                                                                            selectedIds.includes(
                                                                                option.id.toString(),
                                                                            ) &&
                                                                            item.product_id !==
                                                                                option.id.toString()
                                                                        }
                                                                    >
                                                                        {
                                                                            option.name
                                                                        }{' '}
                                                                        ·{' '}
                                                                        {
                                                                            option.stock
                                                                        }{' '}
                                                                        in stock
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                        {errors[
                                                            `products.${index}.product_id`
                                                        ] && (
                                                            <small>
                                                                {
                                                                    errors[
                                                                        `products.${index}.product_id`
                                                                    ]
                                                                }
                                                            </small>
                                                        )}
                                                    </label>
                                                    <AdminField
                                                        label="Step instruction"
                                                        value={item.instruction}
                                                        error={
                                                            errors[
                                                                `products.${index}.instruction`
                                                            ]
                                                        }
                                                        placeholder="Massage into damp hair"
                                                        onChange={(value) =>
                                                            updateProduct(
                                                                index,
                                                                {
                                                                    instruction:
                                                                        value,
                                                                },
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="flex gap-1 md:pt-6">
                                                    <button
                                                        type="button"
                                                        disabled={index === 0}
                                                        onClick={() =>
                                                            moveProduct(
                                                                index,
                                                                -1,
                                                            )
                                                        }
                                                        className="admin-icon disabled:opacity-30"
                                                        aria-label={`Move ${product?.name ?? 'product'} up`}
                                                    >
                                                        <ArrowUp size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            index ===
                                                            form.data.products
                                                                .length -
                                                                1
                                                        }
                                                        onClick={() =>
                                                            moveProduct(
                                                                index,
                                                                1,
                                                            )
                                                        }
                                                        className="admin-icon disabled:opacity-30"
                                                        aria-label={`Move ${product?.name ?? 'product'} down`}
                                                    >
                                                        <ArrowDown size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            form.setData(
                                                                'products',
                                                                form.data.products.filter(
                                                                    (
                                                                        _,
                                                                        itemIndex,
                                                                    ) =>
                                                                        itemIndex !==
                                                                        index,
                                                                ),
                                                            )
                                                        }
                                                        className="admin-icon text-red-600"
                                                        aria-label={`Remove ${product?.name ?? 'product'}`}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {form.errors.products && (
                                <p className="mt-3 text-xs text-red-600">
                                    {form.errors.products}
                                </p>
                            )}
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section className="admin-card">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="admin-section-title">
                                    Cover image
                                </h2>
                                <ImagePlus
                                    size={20}
                                    className="text-stone-400"
                                />
                            </div>
                            <RitualImagePreview
                                file={form.data.ritual_image}
                                existingImage={form.data.existing_image}
                                imageUrl={form.data.image_url}
                            />
                            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center border border-dashed border-black/25 bg-stone-50 px-5 py-8 text-center hover:border-black">
                                <UploadCloud size={24} />
                                <span className="mt-3 text-xs font-semibold">
                                    Upload cover image
                                </span>
                                <span className="mt-1 text-[10px] text-stone-500">
                                    JPG, PNG, WebP or AVIF · 8 MB
                                </span>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/avif"
                                    className="sr-only"
                                    onChange={(event) =>
                                        form.setData(
                                            'ritual_image',
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                            </label>
                            {form.errors.ritual_image && (
                                <p className="mt-2 text-xs text-red-600">
                                    {form.errors.ritual_image}
                                </p>
                            )}
                            <details className="mt-5 border-t border-black/10 pt-5">
                                <summary className="cursor-pointer text-xs font-semibold">
                                    Use an image URL instead
                                </summary>
                                <div className="mt-4">
                                    <AdminField
                                        label="Image URL"
                                        value={form.data.image_url}
                                        error={form.errors.image_url}
                                        placeholder="https://..."
                                        onChange={(value) =>
                                            form.setData('image_url', value)
                                        }
                                    />
                                </div>
                            </details>
                            {(form.data.existing_image ||
                                form.data.ritual_image ||
                                form.data.image_url) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        form.setData('existing_image', '');
                                        form.setData('image_url', '');
                                        form.setData('ritual_image', null);
                                    }}
                                    className="mt-4 text-xs font-semibold text-red-600"
                                >
                                    Remove cover image
                                </button>
                            )}
                        </section>

                        <section className="admin-card">
                            <h2 className="admin-section-title">
                                Offer and position
                            </h2>
                            <div className="mt-6 space-y-5">
                                <AdminField
                                    type="number"
                                    label="Bundle saving (%)"
                                    value={form.data.discount_percent}
                                    error={form.errors.discount_percent}
                                    onChange={(value) =>
                                        form.setData('discount_percent', value)
                                    }
                                />
                                <AdminField
                                    type="number"
                                    label="Display position"
                                    value={form.data.sort_order}
                                    error={form.errors.sort_order}
                                    onChange={(value) =>
                                        form.setData('sort_order', value)
                                    }
                                />
                            </div>
                        </section>

                        <section className="admin-card">
                            <h2 className="admin-section-title">Visibility</h2>
                            <div className="mt-5 space-y-4">
                                <Toggle
                                    label="Published on the storefront"
                                    checked={form.data.is_active}
                                    onChange={(value) =>
                                        form.setData('is_active', value)
                                    }
                                />
                                <Toggle
                                    label="Mark as a featured ritual"
                                    checked={form.data.is_featured}
                                    onChange={(value) =>
                                        form.setData('is_featured', value)
                                    }
                                />
                            </div>
                        </section>
                    </div>
                </div>
            </form>
        </>
    );
}

function RitualImagePreview({
    file,
    existingImage,
    imageUrl,
}: {
    file: File | null;
    existingImage: string;
    imageUrl: string;
}) {
    const preview = useMemo(
        () => (file ? URL.createObjectURL(file) : ''),
        [file],
    );

    useEffect(
        () => () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        },
        [preview],
    );

    const source = preview || imageUrl || existingImage;

    return source ? (
        <img
            src={source}
            alt="Ritual cover preview"
            className="mt-5 aspect-[4/3] w-full bg-stone-100 object-cover"
        />
    ) : (
        <div className="mt-5 grid aspect-[4/3] place-items-center bg-stone-100 text-stone-400">
            <ImagePlus size={26} />
        </div>
    );
}

function AdminField({
    label,
    value,
    error,
    type = 'text',
    placeholder,
    onChange,
}: {
    label: string;
    value: string;
    error?: string;
    type?: string;
    placeholder?: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="admin-field">
            <span>{label}</span>
            <input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                step={type === 'number' ? '0.01' : undefined}
            />
            {error && <small>{error}</small>}
        </label>
    );
}

function AdminArea({
    label,
    value,
    error,
    rows = 5,
    placeholder,
    onChange,
}: {
    label: string;
    value: string;
    error?: string;
    rows?: number;
    placeholder?: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="admin-field">
            <span>{label}</span>
            <textarea
                rows={rows}
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
            />
            {error && <small>{error}</small>}
        </label>
    );
}

function Toggle({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-4 text-sm">
            <span>{label}</span>
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="h-4 w-4 accent-black"
            />
        </label>
    );
}

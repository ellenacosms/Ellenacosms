import { Head, Link, useForm } from '@inertiajs/react';
import { ImagePlus, Trash2, UploadCloud } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import type { Category, Product } from '@/types';

type ProductForm = {
    _method?: 'put';
    category_id: string;
    name: string;
    subtitle: string;
    description: string;
    ingredients: string;
    usage: string;
    benefits_text: string;
    concerns_text: string;
    ritual_steps_text: string;
    price: string;
    compare_price: string;
    stock: string;
    images_text: string;
    existing_images: string[];
    product_images: File[];
    is_featured: boolean;
    is_active: boolean;
};

export default function ProductFormPage({
    product,
    categories,
}: {
    product: Product | null;
    categories: Category[];
}) {
    const form = useForm<ProductForm>({
        category_id: product?.category_id?.toString() ?? '',
        name: product?.name ?? '',
        subtitle: product?.subtitle ?? '',
        description: product?.description ?? '',
        ingredients: product?.ingredients ?? '',
        usage: product?.usage ?? '',
        benefits_text: product?.benefits?.join('\n') ?? '',
        concerns_text: product?.concerns?.join('\n') ?? '',
        ritual_steps_text: product?.ritual_steps?.join('\n') ?? '',
        price: product?.price ?? '',
        compare_price: product?.compare_price ?? '',
        stock: product?.stock?.toString() ?? '0',
        images_text: '',
        existing_images: product?.images ?? [],
        product_images: [],
        is_featured: product?.is_featured ?? false,
        is_active: product?.is_active ?? true,
    });
    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (product) {
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(`/admin/products/${product.id}`, {
                forceFormData: true,
            });
        } else {
            form.post('/admin/products', { forceFormData: true });
        }
    };

    return (
        <>
            <Head title={product ? `Edit ${product.name}` : 'Add product'} />
            <form onSubmit={submit}>
                <div className="flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <p className="admin-eyebrow">Catalog</p>
                        <h1 className="admin-title">
                            {product ? 'Edit product' : 'New product'}
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/admin/products"
                            className="admin-secondary"
                        >
                            Cancel
                        </Link>
                        <button
                            disabled={form.processing}
                            className="admin-button"
                        >
                            {product ? 'Save changes' : 'Publish product'}
                        </button>
                    </div>
                </div>
                <div className="mt-8 grid border border-black/10 bg-white sm:grid-cols-4">
                    {[
                        ['01', 'Product details'],
                        ['02', 'Ritual content'],
                        ['03', 'Images & pricing'],
                        ['04', 'Stock & publish'],
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
                            <h2 className="admin-section-title">
                                Product details
                            </h2>
                            <div className="mt-6 grid gap-5 sm:grid-cols-2">
                                <AdminField
                                    label="Product name"
                                    value={form.data.name}
                                    error={form.errors.name}
                                    onChange={(v) => form.setData('name', v)}
                                />
                                <div className="admin-field">
                                    <span>SKU</span>
                                    <div className="flex min-h-11 items-center border border-black/15 bg-stone-50 px-3 text-sm font-semibold tracking-wide text-stone-600">
                                        {product?.sku ??
                                            'Generated after publishing'}
                                    </div>
                                    <small className="text-stone-500">
                                        Managed automatically by ELLENA
                                    </small>
                                </div>
                                <div className="sm:col-span-2">
                                    <AdminField
                                        label="Subtitle"
                                        value={form.data.subtitle}
                                        error={form.errors.subtitle}
                                        onChange={(v) =>
                                            form.setData('subtitle', v)
                                        }
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <AdminArea
                                        label="Description"
                                        value={form.data.description}
                                        error={form.errors.description}
                                        onChange={(v) =>
                                            form.setData('description', v)
                                        }
                                    />
                                </div>
                            </div>
                        </section>
                        <section className="admin-card">
                            <h2 className="admin-section-title">
                                Ritual information
                            </h2>
                            <div className="mt-6 grid gap-5 sm:grid-cols-2">
                                <AdminArea
                                    label="Ingredients"
                                    value={form.data.ingredients}
                                    error={form.errors.ingredients}
                                    onChange={(v) =>
                                        form.setData('ingredients', v)
                                    }
                                />
                                <AdminArea
                                    label="How to use"
                                    value={form.data.usage}
                                    error={form.errors.usage}
                                    onChange={(v) => form.setData('usage', v)}
                                />
                                <AdminArea
                                    label="Key benefits — one per line"
                                    value={form.data.benefits_text}
                                    error={form.errors.benefits_text}
                                    rows={4}
                                    onChange={(v) =>
                                        form.setData('benefits_text', v)
                                    }
                                />
                                <AdminArea
                                    label="Best for — one concern per line"
                                    value={form.data.concerns_text}
                                    error={form.errors.concerns_text}
                                    rows={4}
                                    onChange={(v) =>
                                        form.setData('concerns_text', v)
                                    }
                                />
                                <div className="sm:col-span-2">
                                    <AdminArea
                                        label="Ritual steps — one step per line"
                                        value={form.data.ritual_steps_text}
                                        error={form.errors.ritual_steps_text}
                                        rows={5}
                                        onChange={(v) =>
                                            form.setData('ritual_steps_text', v)
                                        }
                                    />
                                </div>
                            </div>
                        </section>
                        <section className="admin-card">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="admin-section-title">
                                        Product imagery
                                    </h2>
                                    <p className="mt-1 text-xs text-stone-500">
                                        Upload up to 8 images at once. The first
                                        image becomes the catalog cover.
                                    </p>
                                </div>
                                <ImagePlus
                                    className="text-stone-400"
                                    size={22}
                                />
                            </div>
                            {form.data.existing_images.length > 0 && (
                                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {form.data.existing_images.map(
                                        (image, index) => (
                                            <div
                                                key={`${image}-${index}`}
                                                className="group relative aspect-square overflow-hidden bg-stone-100"
                                            >
                                                <img
                                                    src={image}
                                                    alt={`Product image ${index + 1}`}
                                                    className="h-full w-full object-cover"
                                                />
                                                {index === 0 && (
                                                    <span className="absolute top-2 left-2 bg-black px-2 py-1 text-[9px] font-semibold tracking-wider text-white uppercase">
                                                        Cover
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        form.setData(
                                                            'existing_images',
                                                            form.data.existing_images.filter(
                                                                (
                                                                    _,
                                                                    imageIndex,
                                                                ) =>
                                                                    imageIndex !==
                                                                    index,
                                                            ),
                                                        )
                                                    }
                                                    className="absolute top-2 right-2 grid h-8 w-8 place-items-center bg-white text-red-600 opacity-0 shadow-sm transition group-hover:opacity-100"
                                                    aria-label="Remove image"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}
                            <label className="mt-6 flex cursor-pointer flex-col items-center justify-center border border-dashed border-black/25 bg-stone-50 px-6 py-10 text-center transition hover:border-black hover:bg-stone-100">
                                <UploadCloud size={28} />
                                <span className="mt-3 text-sm font-semibold">
                                    Choose product images
                                </span>
                                <span className="mt-1 text-xs text-stone-500">
                                    JPG, PNG, WebP or AVIF · 8 MB each
                                </span>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/webp,image/avif"
                                    className="sr-only"
                                    onChange={(event) =>
                                        form.setData(
                                            'product_images',
                                            Array.from(
                                                event.target.files ?? [],
                                            ),
                                        )
                                    }
                                />
                            </label>
                            {form.data.product_images.length > 0 && (
                                <PendingImagePreviews
                                    files={form.data.product_images}
                                    existingImageCount={
                                        form.data.existing_images.length
                                    }
                                    onRemove={(index) =>
                                        form.setData(
                                            'product_images',
                                            form.data.product_images.filter(
                                                (_, fileIndex) =>
                                                    fileIndex !== index,
                                            ),
                                        )
                                    }
                                />
                            )}
                            {form.errors.product_images && (
                                <p className="mt-2 text-xs text-red-600">
                                    {form.errors.product_images}
                                </p>
                            )}
                            <details className="mt-6 border-t border-black/10 pt-5">
                                <summary className="cursor-pointer text-xs font-semibold">
                                    Add images from URLs instead
                                </summary>
                                <div className="mt-4">
                                    <AdminArea
                                        rows={7}
                                        label="Image URLs"
                                        value={form.data.images_text}
                                        error={form.errors.images_text}
                                        onChange={(v) =>
                                            form.setData('images_text', v)
                                        }
                                    />
                                </div>
                            </details>
                        </section>
                    </div>
                    <div className="space-y-6">
                        <section className="admin-card">
                            <h2 className="admin-section-title">
                                Organization
                            </h2>
                            <label className="admin-field mt-6">
                                <span>Category</span>
                                <select
                                    value={form.data.category_id}
                                    onChange={(e) =>
                                        form.setData(
                                            'category_id',
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="">Select category</option>
                                    {categories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.category_id && (
                                    <small>{form.errors.category_id}</small>
                                )}
                            </label>
                        </section>
                        <section className="admin-card">
                            <h2 className="admin-section-title">
                                Pricing & inventory
                            </h2>
                            <div className="mt-6 space-y-5">
                                <AdminField
                                    type="number"
                                    label="Price (UGX)"
                                    value={form.data.price}
                                    error={form.errors.price}
                                    onChange={(v) => form.setData('price', v)}
                                />
                                <AdminField
                                    type="number"
                                    label="Compare-at price"
                                    value={form.data.compare_price}
                                    error={form.errors.compare_price}
                                    onChange={(v) =>
                                        form.setData('compare_price', v)
                                    }
                                />
                                <AdminField
                                    type="number"
                                    label="Stock quantity"
                                    value={form.data.stock}
                                    error={form.errors.stock}
                                    onChange={(v) => form.setData('stock', v)}
                                />
                            </div>
                        </section>
                        <section className="admin-card">
                            <h2 className="admin-section-title">Visibility</h2>
                            <div className="mt-5 space-y-4">
                                <Toggle
                                    label="Active and available to purchase"
                                    checked={form.data.is_active}
                                    onChange={(v) =>
                                        form.setData('is_active', v)
                                    }
                                />
                                <Toggle
                                    label="Feature on the homepage"
                                    checked={form.data.is_featured}
                                    onChange={(v) =>
                                        form.setData('is_featured', v)
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

function PendingImagePreviews({
    files,
    existingImageCount,
    onRemove,
}: {
    files: File[];
    existingImageCount: number;
    onRemove: (index: number) => void;
}) {
    const previews = useMemo(
        () =>
            files.map((file) => ({
                file,
                url: URL.createObjectURL(file),
            })),
        [files],
    );

    useEffect(
        () => () => {
            previews.forEach((preview) => URL.revokeObjectURL(preview.url));
        },
        [previews],
    );

    return (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {previews.map(({ file, url }, index) => (
                <div
                    key={`${file.name}-${file.lastModified}`}
                    className="group relative aspect-square overflow-hidden bg-stone-100"
                >
                    <img
                        src={url}
                        alt={`Preview of ${file.name}`}
                        className="h-full w-full object-cover"
                    />
                    {existingImageCount === 0 && index === 0 && (
                        <span className="absolute top-2 left-2 bg-black px-2 py-1 text-[9px] font-semibold tracking-wider text-white uppercase">
                            Cover
                        </span>
                    )}
                    <span className="absolute right-0 bottom-0 left-0 truncate bg-black/65 px-2 py-1.5 text-[9px] text-white">
                        {file.name}
                    </span>
                    <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="absolute top-2 right-2 grid h-8 w-8 place-items-center bg-white text-red-600 shadow-sm"
                        aria-label={`Remove ${file.name}`}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}

function AdminField({
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
                onChange={(e) => onChange(e.target.value)}
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
    onChange,
}: {
    label: string;
    value: string;
    error?: string;
    rows?: number;
    onChange: (value: string) => void;
}) {
    return (
        <label className="admin-field">
            <span>{label}</span>
            <textarea
                rows={rows}
                value={value}
                onChange={(e) => onChange(e.target.value)}
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
                onChange={(e) => onChange(e.target.checked)}
                className="h-4 w-4 accent-black"
            />
        </label>
    );
}

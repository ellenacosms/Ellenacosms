import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    ImagePlus,
    Plus,
    Trash2,
    UploadCloud,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';
import type { FormEvent } from 'react';
import type { BeautyGuide, Category } from '@/types';

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
type AttachedProduct = ProductOption & {
    pivot: { sort_order?: number; note?: string };
};
type AdminGuide = Omit<BeautyGuide, 'products'> & {
    sections_text?: string;
    steps_text?: string;
    faqs_text?: string;
    products?: AttachedProduct[];
};
type ProductRow = { product_id: string; note: string };
type GuideForm = {
    _method?: 'put';
    title: string;
    category: string;
    eyebrow: string;
    excerpt: string;
    body: string;
    sections_text: string;
    steps_text: string;
    faqs_text: string;
    seo_title: string;
    seo_description: string;
    read_minutes: string;
    sort_order: string;
    published_at: string;
    is_featured: boolean;
    is_published: boolean;
    existing_image: string;
    image_url: string;
    guide_image: File | null;
    products: ProductRow[];
};

export default function BeautyGuideForm({
    guide,
    categories,
    products,
}: {
    guide: AdminGuide | null;
    categories: Record<string, string>;
    products: ProductOption[];
}) {
    const formatDate = (value?: string) =>
        value ? new Date(value).toISOString().slice(0, 16) : '';
    const form = useForm<GuideForm>({
        title: guide?.title ?? '',
        category: guide?.category ?? Object.keys(categories)[0] ?? 'hair-care',
        eyebrow: guide?.eyebrow ?? '',
        excerpt: guide?.excerpt ?? '',
        body: guide?.body ?? '',
        sections_text: guide?.sections_text ?? '',
        steps_text: guide?.steps_text ?? '',
        faqs_text: guide?.faqs_text ?? '',
        seo_title: guide?.seo_title ?? '',
        seo_description: guide?.seo_description ?? '',
        read_minutes: guide?.read_minutes?.toString() ?? '4',
        sort_order: guide?.sort_order?.toString() ?? '0',
        published_at: formatDate(guide?.published_at),
        is_featured: guide?.is_featured ?? false,
        is_published: guide?.is_published ?? false,
        existing_image: guide?.hero_image ?? '',
        image_url: '',
        guide_image: null,
        products:
            guide?.products?.map((product) => ({
                product_id: product.id.toString(),
                note: product.pivot.note ?? '',
            })) ?? [],
    });
    const selectedIds = form.data.products.map((item) => item.product_id);
    const availableProducts = products.filter(
        (product) => !selectedIds.includes(product.id.toString()),
    );

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (guide) {
            form.transform((data) => ({
                ...data,
                _method: 'put' as const,
            }));
            form.post(`/admin/beauty-guides/${guide.id}`, {
                forceFormData: true,
            });
        } else form.post('/admin/beauty-guides', { forceFormData: true });
    };
    const move = (index: number, offset: number) => {
        const destination = index + offset;
        if (destination < 0 || destination >= form.data.products.length) return;
        const rows = [...form.data.products];
        [rows[index], rows[destination]] = [rows[destination], rows[index]];
        form.setData('products', rows);
    };

    return (
        <>
            <Head title={guide ? 'Edit Beauty Guide' : 'Create Beauty Guide'} />
            <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                    <Link
                        href="/admin/beauty-guides"
                        className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-black"
                    >
                        <ArrowLeft size={14} /> Beauty guides
                    </Link>
                    <p className="admin-eyebrow">Editorial</p>
                    <h1 className="admin-title">
                        {guide ? 'Edit guide' : 'Create guide'}
                    </h1>
                </div>
                <button
                    type="submit"
                    form="beauty-guide-form"
                    disabled={form.processing}
                    className="admin-button"
                >
                    {form.processing
                        ? 'Saving…'
                        : guide
                          ? 'Save changes'
                          : 'Publish guide'}
                </button>
            </div>
            <form
                id="beauty-guide-form"
                onSubmit={submit}
                className="mt-9 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
            >
                <div className="space-y-6">
                    <section className="admin-card">
                        <h2 className="admin-section-title">
                            Article essentials
                        </h2>
                        <div className="mt-6 grid gap-5 sm:grid-cols-2">
                            <Field
                                label="Title"
                                value={form.data.title}
                                error={form.errors.title}
                                onChange={(value) =>
                                    form.setData('title', value)
                                }
                            />
                            <label className="admin-field">
                                <span>Category</span>
                                <select
                                    value={form.data.category}
                                    onChange={(event) =>
                                        form.setData(
                                            'category',
                                            event.target.value,
                                        )
                                    }
                                >
                                    {Object.entries(categories).map(
                                        ([slug, label]) => (
                                            <option key={slug} value={slug}>
                                                {label}
                                            </option>
                                        ),
                                    )}
                                </select>
                                {form.errors.category && (
                                    <small>{form.errors.category}</small>
                                )}
                            </label>
                            <Field
                                label="Eyebrow"
                                value={form.data.eyebrow}
                                error={form.errors.eyebrow}
                                placeholder="The crown ritual"
                                onChange={(value) =>
                                    form.setData('eyebrow', value)
                                }
                            />
                            <Field
                                type="number"
                                label="Reading time (minutes)"
                                value={form.data.read_minutes}
                                error={form.errors.read_minutes}
                                onChange={(value) =>
                                    form.setData('read_minutes', value)
                                }
                            />
                        </div>
                        <Area
                            label="Excerpt"
                            value={form.data.excerpt}
                            error={form.errors.excerpt}
                            rows={3}
                            onChange={(value) => form.setData('excerpt', value)}
                        />
                        <Area
                            label="Opening article copy"
                            value={form.data.body}
                            error={form.errors.body}
                            rows={8}
                            onChange={(value) => form.setData('body', value)}
                        />
                    </section>
                    <section className="admin-card">
                        <h2 className="admin-section-title">
                            Editorial structure
                        </h2>
                        <p className="mt-2 text-xs leading-5 text-stone-500">
                            Use one item per line. Separate paired content with
                            a vertical bar.
                        </p>
                        <Area
                            label="Sections — Heading | Paragraph"
                            value={form.data.sections_text}
                            error={form.errors.sections_text}
                            rows={8}
                            placeholder="Why moisture matters | Moisture supports softness…"
                            onChange={(value) =>
                                form.setData('sections_text', value)
                            }
                        />
                        <Area
                            label="Routine steps — one per line"
                            value={form.data.steps_text}
                            error={form.errors.steps_text}
                            rows={7}
                            onChange={(value) =>
                                form.setData('steps_text', value)
                            }
                        />
                        <Area
                            label="FAQs — Question | Answer"
                            value={form.data.faqs_text}
                            error={form.errors.faqs_text}
                            rows={7}
                            onChange={(value) =>
                                form.setData('faqs_text', value)
                            }
                        />
                    </section>
                    <section className="admin-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="admin-section-title">
                                    Recommended products
                                </h2>
                                <p className="mt-2 text-xs text-stone-500">
                                    Attach up to eight products in display
                                    order.
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={
                                    !availableProducts.length ||
                                    form.data.products.length >= 8
                                }
                                onClick={() => {
                                    const product = availableProducts[0];
                                    if (product)
                                        form.setData('products', [
                                            ...form.data.products,
                                            {
                                                product_id:
                                                    product.id.toString(),
                                                note: '',
                                            },
                                        ]);
                                }}
                                className="admin-icon"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="mt-6 space-y-3">
                            {form.data.products.map((row, index) => {
                                const product = products.find(
                                    (item) =>
                                        item.id.toString() === row.product_id,
                                );
                                return (
                                    <div
                                        key={`${row.product_id}-${index}`}
                                        className="border border-black/10 bg-stone-50 p-4"
                                    >
                                        <div className="flex items-start gap-3">
                                            <select
                                                value={row.product_id}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'products',
                                                        form.data.products.map(
                                                            (
                                                                item,
                                                                itemIndex,
                                                            ) =>
                                                                itemIndex ===
                                                                index
                                                                    ? {
                                                                          ...item,
                                                                          product_id:
                                                                              event
                                                                                  .target
                                                                                  .value,
                                                                      }
                                                                    : item,
                                                        ),
                                                    )
                                                }
                                                className="min-w-0 flex-1 border border-black/15 bg-white p-2 text-sm"
                                            >
                                                <option value={row.product_id}>
                                                    {product?.name ??
                                                        'Select product'}
                                                </option>
                                                {availableProducts.map(
                                                    (item) => (
                                                        <option
                                                            key={item.id}
                                                            value={item.id}
                                                        >
                                                            {item.name}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => move(index, -1)}
                                                disabled={index === 0}
                                                className="admin-icon"
                                            >
                                                <ArrowUp size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => move(index, 1)}
                                                disabled={
                                                    index ===
                                                    form.data.products.length -
                                                        1
                                                }
                                                className="admin-icon"
                                            >
                                                <ArrowDown size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    form.setData(
                                                        'products',
                                                        form.data.products.filter(
                                                            (_, itemIndex) =>
                                                                itemIndex !==
                                                                index,
                                                        ),
                                                    )
                                                }
                                                className="admin-icon text-red-600"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <input
                                            value={row.note}
                                            onChange={(event) =>
                                                form.setData(
                                                    'products',
                                                    form.data.products.map(
                                                        (item, itemIndex) =>
                                                            itemIndex === index
                                                                ? {
                                                                      ...item,
                                                                      note: event
                                                                          .target
                                                                          .value,
                                                                  }
                                                                : item,
                                                    ),
                                                )
                                            }
                                            placeholder="Optional recommendation note"
                                            className="mt-3 w-full border border-black/15 bg-white p-2 text-xs"
                                        />
                                    </div>
                                );
                            })}
                            {form.data.products.length === 0 && (
                                <p className="border border-dashed border-black/15 p-8 text-center text-sm text-stone-500">
                                    No products attached yet.
                                </p>
                            )}
                        </div>
                        {form.errors.products && (
                            <p className="mt-3 text-xs text-red-600">
                                {form.errors.products}
                            </p>
                        )}
                    </section>
                    <section className="admin-card">
                        <h2 className="admin-section-title">
                            Search visibility
                        </h2>
                        <div className="mt-6 grid gap-5">
                            <Field
                                label="SEO title"
                                value={form.data.seo_title}
                                error={form.errors.seo_title}
                                onChange={(value) =>
                                    form.setData('seo_title', value)
                                }
                            />
                            <Area
                                label="SEO description"
                                value={form.data.seo_description}
                                error={form.errors.seo_description}
                                rows={3}
                                onChange={(value) =>
                                    form.setData('seo_description', value)
                                }
                            />
                        </div>
                    </section>
                </div>
                <div className="space-y-6">
                    <section className="admin-card">
                        <h2 className="admin-section-title">Hero image</h2>
                        <ImagePreview
                            file={form.data.guide_image}
                            existing={form.data.existing_image}
                            url={form.data.image_url}
                        />
                        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center border border-dashed border-black/25 bg-stone-50 px-5 py-8 text-center">
                            <UploadCloud size={24} />
                            <span className="mt-3 text-xs font-semibold">
                                Upload guide image
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
                                        'guide_image',
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                            />
                        </label>
                        {form.errors.guide_image && (
                            <p className="mt-2 text-xs text-red-600">
                                {form.errors.guide_image}
                            </p>
                        )}
                        <details className="mt-5 border-t border-black/10 pt-5">
                            <summary className="cursor-pointer text-xs font-semibold">
                                Use an image URL instead
                            </summary>
                            <div className="mt-4">
                                <Field
                                    label="Image URL"
                                    value={form.data.image_url}
                                    error={form.errors.image_url}
                                    onChange={(value) =>
                                        form.setData('image_url', value)
                                    }
                                />
                            </div>
                        </details>
                    </section>
                    <section className="admin-card">
                        <h2 className="admin-section-title">Publication</h2>
                        <div className="mt-6 space-y-5">
                            <Field
                                type="number"
                                label="Display position"
                                value={form.data.sort_order}
                                error={form.errors.sort_order}
                                onChange={(value) =>
                                    form.setData('sort_order', value)
                                }
                            />
                            <Field
                                type="datetime-local"
                                label="Publish at (optional)"
                                value={form.data.published_at}
                                error={form.errors.published_at}
                                onChange={(value) =>
                                    form.setData('published_at', value)
                                }
                            />
                            <Toggle
                                label="Published on the storefront"
                                checked={form.data.is_published}
                                onChange={(value) =>
                                    form.setData('is_published', value)
                                }
                            />
                            <Toggle
                                label="Feature this guide"
                                checked={form.data.is_featured}
                                onChange={(value) =>
                                    form.setData('is_featured', value)
                                }
                            />
                        </div>
                    </section>
                </div>
            </form>
        </>
    );
}

function ImagePreview({
    file,
    existing,
    url,
}: {
    file: File | null;
    existing: string;
    url: string;
}) {
    const preview = useMemo(
        () => (file ? URL.createObjectURL(file) : ''),
        [file],
    );
    useEffect(
        () => () => {
            if (preview) URL.revokeObjectURL(preview);
        },
        [preview],
    );
    const source = preview || url || existing;
    return source ? (
        <img
            src={source}
            alt="Guide cover preview"
            className="mt-5 aspect-[4/3] w-full bg-stone-100 object-cover"
        />
    ) : (
        <div className="mt-5 grid aspect-[4/3] place-items-center bg-stone-100 text-stone-400">
            <ImagePlus size={26} />
        </div>
    );
}
function Field({
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
            />
            {error && <small>{error}</small>}
        </label>
    );
}
function Area({
    label,
    value,
    error,
    rows,
    placeholder,
    onChange,
}: {
    label: string;
    value: string;
    error?: string;
    rows: number;
    placeholder?: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="admin-field mt-5">
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

import { Link, router } from '@inertiajs/react';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import ProductCard from '@/components/store/product-card';
import ProductCardSkeleton from '@/components/store/product-card-skeleton';
import SeoHead from '@/components/store/seo-head';
import ShopFilterDrawer, {
    shopUrl,
    sortOptions,
} from '@/components/store/shop-filter-drawer';
import type {
    Concern,
    ShopFilters,
} from '@/components/store/shop-filter-drawer';
import StoreImage from '@/components/store/store-image';
import type { Category, MerchandisingEdit, Pagination, Product } from '@/types';

const categoryConcerns: Record<string, Concern[]> = {
    'hair-care': [
        {
            slug: 'scalp-care',
            label: 'Scalp care',
            description: 'Refresh the roots and support a balanced foundation.',
        },
        {
            slug: 'strength-repair',
            label: 'Strength + repair',
            description: 'Restore softness and resilience through the lengths.',
        },
        {
            slug: 'hydration',
            label: 'Hydration',
            description: 'Replenish dry hair with weightless moisture.',
        },
    ],
    'body-care': [
        {
            slug: 'hydration',
            label: 'Hydration',
            description: 'Layer lasting moisture onto freshly cleansed skin.',
        },
        {
            slug: 'softness',
            label: 'Softness',
            description: 'Smooth texture and restore supple comfort.',
        },
        {
            slug: 'cleansing',
            label: 'Cleansing',
            description: 'Polish and cleanse without stripping the skin.',
        },
    ],
    'baby-care': [
        {
            slug: 'hydration',
            label: 'Softness',
            description: 'Comfort delicate skin with simple daily moisture.',
        },
        {
            slug: 'cleansing',
            label: 'Bath-time care',
            description: 'Keep cleansing mild, reassuring, and easy to rinse.',
        },
    ],
    fragrance: [
        {
            slug: 'aromatic-care',
            label: 'Aromatic care',
            description: 'Create a subtle signature through scent and texture.',
        },
        {
            slug: 'evening-ritual',
            label: 'Evening ritual',
            description: 'Slow the pace with restorative, grounding care.',
        },
        {
            slug: 'layering',
            label: 'Layering',
            description: 'Build a complete ritual from mist, oil, and touch.',
        },
    ],
};

export default function Shop({
    products,
    categories,
    filters,
    edits,
    activeEdit,
}: {
    products: Pagination<Product>;
    categories: Category[];
    filters: ShopFilters;
    edits: MerchandisingEdit[];
    activeEdit?: MerchandisingEdit | null;
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [isNavigating, setIsNavigating] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const activeCategory = categories.find(
        (category) => category.slug === filters.category,
    );
    const allConcerns = Object.values(categoryConcerns)
        .flat()
        .filter(
            (concern, index, values) =>
                values.findIndex((item) => item.slug === concern.slug) ===
                index,
        );
    const pageTitle = activeEdit?.title ?? activeCategory?.name ?? 'Shop all';
    const pageDescription =
        activeEdit?.description ??
        activeCategory?.description ??
        'Thoughtful hair, body, and beauty essentials composed for the rituals you return to every day.';
    const seoTitle = activeEdit
        ? `${activeEdit.title} | Curated Beauty Products`
        : activeCategory
          ? `${activeCategory.name} Products in Uganda`
          : 'Beauty Products Online in Uganda';
    const seoDescription =
        `${pageDescription} Shop online with Ellena Beauty in Uganda.`
            .replace(/\s+/g, ' ')
            .slice(0, 160);
    const concerns = activeCategory
        ? (categoryConcerns[activeCategory.slug] ?? [])
        : allConcerns;
    const activeConcern = concerns.find(
        (concern) => concern.slug === filters.concern,
    );
    const activeFilterCount = [
        filters.category,
        filters.concern,
        filters.search,
        filters.edit,
    ].filter(Boolean).length;
    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            shopUrl(filters, { search: search.trim() || null }),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };
    const changeSort = (sort: string) => {
        router.get(
            shopUrl(filters, { sort }),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    useEffect(() => {
        const removeStartListener = router.on('start', () =>
            setIsNavigating(true),
        );
        const removeFinishListener = router.on('finish', () =>
            setIsNavigating(false),
        );

        return () => {
            removeStartListener();
            removeFinishListener();
        };
    }, []);

    return (
        <>
            <SeoHead
                title={seoTitle}
                description={seoDescription}
                canonicalPath={
                    activeEdit
                        ? `/shop?edit=${activeEdit.slug}`
                        : activeCategory
                          ? `/shop?category=${activeCategory.slug}`
                          : '/shop'
                }
                image={activeCategory?.image}
                imageAlt={activeCategory ? `${activeCategory.name} products from Ellena Beauty` : undefined}
                noIndex={Boolean(
                    filters.search ||
                    filters.concern ||
                    (filters.sort &&
                        filters.sort !== 'featured' &&
                        !activeEdit),
                )}
                structuredData={{
                    '@context': 'https://schema.org',
                    '@type': 'CollectionPage',
                    name: seoTitle,
                    description: seoDescription,
                }}
            />
            {activeCategory ? (
                <section className="pt-[108px]">
                    <div className="grid min-h-[560px] bg-brand-blush lg:grid-cols-2">
                        <div className="order-2 flex items-center px-6 py-20 md:px-14 lg:order-1 lg:px-20">
                            <div className="max-w-xl">
                                <Link
                                    href="/shop"
                                    className="eyebrow text-stone-500"
                                >
                                    The Ellena collection /{' '}
                                    {activeCategory.name}
                                </Link>
                                <h1 className="display-heading mt-6">
                                    {activeCategory.name}
                                </h1>
                                <p className="body-copy mt-7 max-w-lg">
                                    {pageDescription}
                                </p>
                                <div className="mt-9 flex items-center gap-6 text-[10px] font-semibold tracking-[.16em] text-stone-500 uppercase">
                                    <span>
                                        {activeCategory.products_count ?? 0}{' '}
                                        formulas
                                    </span>
                                    <span className="h-px w-10 bg-stone-400" />
                                    <span>Made for daily ritual</span>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 min-h-[380px] overflow-hidden lg:order-2 lg:min-h-[560px]">
                            {activeCategory.image && (
                                <StoreImage
                                    src={activeCategory.image}
                                    alt={`${activeCategory.name} editorial collection`}
                                    className="h-full w-full object-cover transition duration-[1800ms] ease-out hover:scale-[1.025]"
                                    wrapperClassName="h-full"
                                    loading="eager"
                                    decoding="async"
                                />
                            )}
                        </div>
                    </div>
                </section>
            ) : activeEdit ? (
                <section className="pt-[108px]">
                    <div className="grid min-h-[560px] bg-brand-rose text-white lg:grid-cols-[1fr_1.05fr]">
                        <div className="flex items-center px-6 py-20 md:px-14 lg:px-20">
                            <div className="max-w-xl">
                                <Link
                                    href="/discover"
                                    className="eyebrow text-brand-gold"
                                >
                                    The discovery room / {activeEdit.eyebrow}
                                </Link>
                                <h1 className="display-heading mt-6 text-white">
                                    {activeEdit.title}
                                </h1>
                                <p className="mt-7 max-w-lg text-base leading-8 text-white/75">
                                    {activeEdit.description}
                                </p>
                                <div className="mt-9 flex items-center gap-6 text-[10px] font-semibold tracking-[.16em] text-white/60 uppercase">
                                    <span>
                                        {activeEdit.products_count}{' '}
                                        {activeEdit.products_count === 1
                                            ? 'formula'
                                            : 'formulas'}
                                    </span>
                                    <span className="h-px w-10 bg-brand-gold" />
                                    <span>
                                        Curated from the live collection
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="min-h-[380px] overflow-hidden lg:min-h-[560px]">
                            <StoreImage
                                src={activeEdit.image}
                                alt={`${activeEdit.title} curated products`}
                                className="h-full w-full object-cover transition duration-[1800ms] ease-out hover:scale-[1.025]"
                                wrapperClassName="h-full"
                                loading="eager"
                                decoding="async"
                            />
                        </div>
                    </div>
                </section>
            ) : (
                <section className="bg-brand-blush px-5 pt-40 pb-20 text-center md:pt-44 md:pb-24">
                    <p className="eyebrow">Ellena products</p>
                    <h1 className="display-heading mt-5">{pageTitle}</h1>
                    <p className="body-copy mx-auto mt-5 max-w-xl">
                        {pageDescription}
                    </p>
                </section>
            )}
            <section className="border-b border-brand-pink bg-brand-white px-5 py-5">
                <div className="mx-auto grid max-w-[1280px] grid-cols-[auto_minmax(0,1fr)] items-center gap-3 lg:flex lg:gap-2">
                    <Link
                        href="/discover"
                        className="shrink-0 text-[9px] font-semibold tracking-[.14em] text-stone-500 uppercase lg:mr-3"
                    >
                        Curated products
                    </Link>
                    <div className="curated-edits-viewport min-w-0 lg:flex-1 lg:overflow-visible">
                        <div className="curated-edits-marquee flex w-max items-center lg:w-full">
                            <div className="flex shrink-0 items-center gap-2 pr-2 lg:min-w-0 lg:flex-1 lg:shrink lg:flex-wrap lg:pr-0">
                                {edits.map((edit) => (
                                    <Link
                                        key={edit.slug}
                                        href={edit.href}
                                        className={`shrink-0 rounded-full border px-4 py-2.5 text-[9px] font-semibold tracking-[.11em] uppercase transition ${filters.edit === edit.slug ? 'border-brand-rose bg-brand-rose text-white' : 'border-brand-pink bg-brand-blush hover:border-brand-gold'}`}
                                    >
                                        {edit.title} · {edit.products_count}
                                    </Link>
                                ))}
                            </div>
                            <div
                                aria-hidden="true"
                                className="flex shrink-0 items-center gap-2 pr-2 lg:hidden"
                            >
                                {edits.map((edit) => (
                                    <Link
                                        key={`${edit.slug}-loop`}
                                        href={edit.href}
                                        tabIndex={-1}
                                        className={`shrink-0 rounded-full border px-4 py-2.5 text-[9px] font-semibold tracking-[.11em] uppercase ${filters.edit === edit.slug ? 'border-brand-rose bg-brand-rose text-white' : 'border-brand-pink bg-brand-blush'}`}
                                    >
                                        {edit.title} · {edit.products_count}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {activeCategory && concerns.length > 0 && (
                <section className="bg-ivory hidden border-b border-black/10 px-5 py-16 md:block md:px-10">
                    <div className="mx-auto max-w-[1280px]">
                        <div className="mb-7 flex items-end justify-between gap-6">
                            <div>
                                <p className="eyebrow">Shop by concern</p>
                                <h2 className="subsection-heading mt-3">
                                    Find your starting point.
                                </h2>
                            </div>
                            {filters.concern && (
                                <Link
                                    href={shopUrl(filters, { concern: null })}
                                    className="hidden text-xs underline underline-offset-4 sm:block"
                                >
                                    Clear concern
                                </Link>
                            )}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <Link
                                href={shopUrl(filters, { concern: null })}
                                className={`group min-h-32 border p-5 transition-all duration-300 ${!filters.concern ? 'border-brand-rose bg-brand-rose text-white shadow-lg' : 'border-brand-pink bg-white/55 hover:-translate-y-1 hover:border-brand-gold hover:bg-white'}`}
                            >
                                <p className="eyebrow">All products</p>
                                <p className="mt-3 text-sm leading-6 opacity-70">
                                    Explore every formula in this collection.
                                </p>
                            </Link>
                            {concerns.map((concern) => (
                                <Link
                                    key={concern.slug}
                                    href={shopUrl(filters, {
                                        concern: concern.slug,
                                    })}
                                    className={`group min-h-32 border p-5 transition-all duration-300 ${filters.concern === concern.slug ? 'border-brand-rose bg-brand-rose text-white shadow-lg' : 'border-brand-pink bg-white/55 hover:-translate-y-1 hover:border-brand-gold hover:bg-white'}`}
                                >
                                    <p className="eyebrow">{concern.label}</p>
                                    <p className="mt-3 text-sm leading-6 opacity-70">
                                        {concern.description}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
            <section className="store-container store-section !pt-10 md:!pt-16">
                <div className="mb-9 hidden flex-col justify-between gap-6 border-b border-black/10 pb-7 md:flex md:flex-row md:items-center">
                    <div className="flex flex-wrap gap-5">
                        <Link
                            href={shopUrl(filters, {
                                category: null,
                                concern: null,
                                edit: null,
                            })}
                            className={`filter-link ${!filters.category ? 'active' : ''}`}
                            aria-current={
                                !filters.category ? 'page' : undefined
                            }
                        >
                            All
                        </Link>
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={shopUrl(filters, {
                                    category: category.slug,
                                    concern: null,
                                    edit: null,
                                })}
                                className={`filter-link ${filters.category === category.slug ? 'active' : ''}`}
                                aria-current={
                                    filters.category === category.slug
                                        ? 'page'
                                        : undefined
                                }
                            >
                                {category.name}
                            </Link>
                        ))}
                    </div>
                    <form
                        onSubmit={submit}
                        className="flex w-full items-center border-b border-stone-500 pb-3 transition focus-within:border-black md:w-72"
                    >
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-full border-0 bg-transparent p-0 text-sm outline-none"
                            placeholder="Search products"
                            aria-label="Search products"
                        />
                        <button aria-label="Search">
                            <Search size={17} />
                        </button>
                    </form>
                </div>
                <div className="mb-8 flex items-center justify-between gap-4 border-b border-black/10 pb-5">
                    <p className="text-xs leading-6 text-stone-500">
                        {products.total}{' '}
                        {products.total === 1 ? 'formula' : 'formulas'}
                        {activeConcern && ` for ${activeConcern.label}`}
                    </p>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            type="button"
                            onClick={() => setFiltersOpen(true)}
                            className="inline-flex items-center gap-2 border border-black/15 bg-white/40 px-3 py-3 text-[10px] font-semibold tracking-[.12em] uppercase md:hidden"
                        >
                            <SlidersHorizontal size={14} />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-rose px-1 text-[9px] text-white">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                        <label className="relative flex items-center">
                            <span className="sr-only">Sort products</span>
                            <select
                                value={filters.sort ?? 'featured'}
                                onChange={(event) =>
                                    changeSort(event.target.value)
                                }
                                className="appearance-none border border-black/15 bg-white/40 py-3 pr-9 pl-3 text-[10px] font-semibold tracking-[.1em] uppercase transition outline-none hover:border-black focus:border-black sm:min-w-48"
                            >
                                {sortOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                size={14}
                                className="pointer-events-none absolute right-3"
                            />
                        </label>
                    </div>
                </div>

                {activeFilterCount > 0 && (
                    <div className="mb-9 flex flex-wrap items-center gap-2">
                        {filters.search && (
                            <Link
                                href={shopUrl(filters, { search: null })}
                                className="inline-flex items-center gap-2 border border-black/10 bg-white/55 px-3 py-2 text-[9px] font-semibold tracking-[.1em] uppercase"
                            >
                                Search: {filters.search} <X size={12} />
                            </Link>
                        )}
                        {activeCategory && (
                            <Link
                                href={shopUrl(filters, {
                                    category: null,
                                    concern: null,
                                })}
                                className="inline-flex items-center gap-2 border border-black/10 bg-white/55 px-3 py-2 text-[9px] font-semibold tracking-[.1em] uppercase"
                            >
                                {activeCategory.name} <X size={12} />
                            </Link>
                        )}
                        {activeEdit && (
                            <Link
                                href={shopUrl(filters, { edit: null })}
                                className="inline-flex items-center gap-2 border border-black/10 bg-white/55 px-3 py-2 text-[9px] font-semibold tracking-[.1em] uppercase"
                            >
                                {activeEdit.title} <X size={12} />
                            </Link>
                        )}
                        {activeConcern && (
                            <Link
                                href={shopUrl(filters, { concern: null })}
                                className="inline-flex items-center gap-2 border border-black/10 bg-white/55 px-3 py-2 text-[9px] font-semibold tracking-[.1em] uppercase"
                            >
                                {activeConcern.label} <X size={12} />
                            </Link>
                        )}
                        <Link
                            href={shopUrl(filters, {
                                category: null,
                                concern: null,
                                search: null,
                                edit: null,
                            })}
                            className="ml-1 text-[9px] font-semibold tracking-[.1em] text-stone-500 uppercase underline underline-offset-4"
                        >
                            Clear all
                        </Link>
                    </div>
                )}
                {products.data.length || isNavigating ? (
                    <div
                        className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5 xl:gap-6 2xl:grid-cols-6"
                        aria-busy={isNavigating}
                        aria-label={
                            isNavigating ? 'Loading products' : undefined
                        }
                    >
                        {isNavigating &&
                            Array.from({ length: 8 }, (_, index) => (
                                <ProductCardSkeleton key={index} />
                            ))}
                        {!isNavigating &&
                            products.data.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                />
                            ))}
                    </div>
                ) : (
                    <div className="py-28 text-center">
                        <h2 className="subsection-heading">
                            No formulas found
                        </h2>
                        <Link
                            href="/shop"
                            className="mt-5 inline-block underline"
                        >
                            Browse all products
                        </Link>
                    </div>
                )}
                <div className="mt-16 flex justify-center gap-3">
                    {products.prev_page_url && (
                        <Link
                            href={products.prev_page_url}
                            className="button-light"
                        >
                            Previous
                        </Link>
                    )}
                    {products.next_page_url && (
                        <Link
                            href={products.next_page_url}
                            className="button-dark"
                        >
                            Next
                        </Link>
                    )}
                </div>
            </section>
            <ShopFilterDrawer
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                categories={categories}
                edits={edits}
                concerns={concerns}
                filters={filters}
                total={products.total}
            />
        </>
    );
}

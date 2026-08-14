import { Link, router } from '@inertiajs/react';
import * as Dialog from '@radix-ui/react-dialog';
import {
    ArrowRight,
    Clock3,
    LoaderCircle,
    Search,
    Sparkles,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import StoreImage from '@/components/store/store-image';
import { money } from '@/lib/money';
import type { Category } from '@/types';

type SearchProduct = {
    id: number;
    category_id: number;
    category?: Pick<Category, 'id' | 'name' | 'slug'>;
    name: string;
    slug: string;
    subtitle?: string;
    price: string;
    compare_price?: string;
    stock: number;
    images: string[];
    is_featured: boolean;
};

type SearchResponse = {
    query: string;
    products: SearchProduct[];
};

const recentSearchesKey = 'ellena-recent-searches';

function loadRecentSearches(): string[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const searches = JSON.parse(
            window.localStorage.getItem(recentSearchesKey) ?? '[]',
        );

        return Array.isArray(searches)
            ? searches.filter((search): search is string =>
                  Boolean(typeof search === 'string' && search.trim()),
              )
            : [];
    } catch {
        return [];
    }
}

export default function SearchOverlay({
    categories,
    open,
    onOpenChange,
}: {
    categories: Category[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [query, setQuery] = useState('');
    const [products, setProducts] = useState<SearchProduct[]>([]);
    const [recentSearches, setRecentSearches] =
        useState<string[]>(loadRecentSearches);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [requestVersion, setRequestVersion] = useState(0);
    const normalizedQuery = query.trim();
    const canSearch = normalizedQuery.length >= 2;
    const visibleProducts = normalizedQuery.length === 1 ? [] : products;
    const isLoading = normalizedQuery.length === 1 ? false : loading;
    const hasError = normalizedQuery.length === 1 ? false : error;

    useEffect(() => {
        if (!open) {
            return;
        }

        if (normalizedQuery.length === 1) {
            return;
        }

        const controller = new AbortController();
        const timeout = window.setTimeout(
            async () => {
                setLoading(true);
                setError(false);

                try {
                    const parameters = new URLSearchParams();

                    if (normalizedQuery) {
                        parameters.set('q', normalizedQuery);
                    }

                    const response = await fetch(
                        `/search/suggestions${parameters.size ? `?${parameters}` : ''}`,
                        {
                            headers: { Accept: 'application/json' },
                            signal: controller.signal,
                        },
                    );

                    if (!response.ok) {
                        throw new Error('Search request failed.');
                    }

                    const data = (await response.json()) as SearchResponse;
                    setProducts(data.products);
                    setActiveIndex(-1);
                } catch (requestError) {
                    if (
                        requestError instanceof DOMException &&
                        requestError.name === 'AbortError'
                    ) {
                        return;
                    }

                    setProducts([]);
                    setError(true);
                } finally {
                    if (!controller.signal.aborted) {
                        setLoading(false);
                    }
                }
            },
            normalizedQuery ? 240 : 0,
        );

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [normalizedQuery, open, requestVersion]);

    const changeOpen = (nextOpen: boolean) => {
        if (!nextOpen) {
            setQuery('');
            setActiveIndex(-1);
            setError(false);
        }

        onOpenChange(nextOpen);
    };

    const rememberSearch = (search: string) => {
        const value = search.trim();

        if (!value) {
            return;
        }

        const nextSearches = [
            value,
            ...recentSearches.filter(
                (recent) => recent.toLowerCase() !== value.toLowerCase(),
            ),
        ].slice(0, 4);

        setRecentSearches(nextSearches);
        window.localStorage.setItem(
            recentSearchesKey,
            JSON.stringify(nextSearches),
        );
    };

    const viewAll = (search: string) => {
        const value = search.trim();

        if (!value) {
            return;
        }

        rememberSearch(value);
        changeOpen(false);
        router.get('/shop', { search: value });
    };

    const openProduct = (product: SearchProduct) => {
        if (normalizedQuery) {
            rememberSearch(normalizedQuery);
        }

        changeOpen(false);
        router.visit(`/products/${product.slug}`);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (activeIndex >= 0 && products[activeIndex]) {
            openProduct(products[activeIndex]);

            return;
        }

        viewAll(normalizedQuery);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (!visibleProducts.length) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => (index + 1) % visibleProducts.length);
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) =>
                index <= 0 ? visibleProducts.length - 1 : index - 1,
            );
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={changeOpen}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <Dialog.Content className="bg-ivory text-ink fixed inset-0 z-[90] overflow-y-auto outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2 md:inset-x-8 md:top-6 md:bottom-auto md:max-h-[calc(100vh-48px)] md:rounded-sm md:shadow-[0_30px_90px_rgba(0,0,0,.18)] lg:inset-x-[5vw]">
                    <Dialog.Title className="sr-only">
                        Search Ellena products
                    </Dialog.Title>
                    <Dialog.Description className="sr-only">
                        Search by product, ingredient, concern, or category.
                    </Dialog.Description>

                    <header className="bg-ivory/95 sticky top-0 z-10 border-b border-black/10 px-5 py-5 backdrop-blur-xl sm:px-8 lg:px-12">
                        <div className="mx-auto flex max-w-[1280px] items-center gap-4">
                            <span className="brand-wordmark hidden text-2xl sm:block">
                                ELLENA
                            </span>
                            <form
                                onSubmit={submit}
                                role="search"
                                className="flex min-w-0 flex-1 items-center gap-3 border-b border-black py-2"
                            >
                                {isLoading ? (
                                    <LoaderCircle
                                        size={20}
                                        className="shrink-0 animate-spin"
                                    />
                                ) : (
                                    <Search size={20} className="shrink-0" />
                                )}
                                <input
                                    autoFocus
                                    type="search"
                                    value={query}
                                    onChange={(event) => {
                                        setQuery(event.target.value);
                                        setActiveIndex(-1);
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search products, ingredients, concerns…"
                                    className="min-w-0 flex-1 border-0 bg-transparent p-0 font-serif text-xl outline-none placeholder:font-sans placeholder:text-sm placeholder:text-stone-400 sm:text-2xl"
                                    aria-label="Search products"
                                    aria-controls="predictive-search-results"
                                    aria-activedescendant={
                                        activeIndex >= 0
                                            ? `search-result-${products[activeIndex]?.id}`
                                            : undefined
                                    }
                                    aria-autocomplete="list"
                                />
                                {query && (
                                    <button
                                        type="button"
                                        onClick={() => setQuery('')}
                                        className="text-[9px] font-semibold tracking-widest text-stone-500 uppercase hover:text-black"
                                    >
                                        Clear
                                    </button>
                                )}
                            </form>
                            <Dialog.Close className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-black/15 bg-white/70 hover:border-black">
                                <X size={19} />
                                <span className="sr-only">Close search</span>
                            </Dialog.Close>
                        </div>
                    </header>

                    <main className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
                        {!normalizedQuery && (
                            <div className="mb-10 grid gap-7 border-b border-black/10 pb-9 md:grid-cols-[1fr_auto] md:items-end">
                                <div>
                                    <p className="eyebrow text-stone-500">
                                        Explore by collection
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {categories.map((category) => (
                                            <Link
                                                key={category.id}
                                                href={`/shop?category=${category.slug}`}
                                                onClick={() =>
                                                    changeOpen(false)
                                                }
                                                className="rounded-full border border-brand-gold/45 bg-white/60 px-4 py-2 text-[10px] font-semibold tracking-[.12em] uppercase transition hover:border-brand-rose hover:bg-brand-rose hover:text-white"
                                            >
                                                {category.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                                {recentSearches.length > 0 && (
                                    <div>
                                        <p className="eyebrow text-stone-500">
                                            Recent
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-4">
                                            {recentSearches.map((search) => (
                                                <button
                                                    key={search}
                                                    type="button"
                                                    onClick={() =>
                                                        setQuery(search)
                                                    }
                                                    className="inline-flex items-center gap-2 text-xs underline decoration-stone-300 underline-offset-4 hover:decoration-black"
                                                >
                                                    <Clock3 size={12} />
                                                    {search}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-end justify-between gap-5">
                            <div>
                                <p className="eyebrow text-stone-500">
                                    {normalizedQuery
                                        ? 'Search results'
                                        : 'Most-loved formulas'}
                                </p>
                                <h2 className="subsection-heading mt-3">
                                    {normalizedQuery
                                        ? `Results for “${normalizedQuery}”`
                                        : 'Popular starting points.'}
                                </h2>
                            </div>
                            {canSearch && visibleProducts.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => viewAll(normalizedQuery)}
                                    className="text-link hidden sm:inline-flex"
                                >
                                    View all
                                    <ArrowRight size={13} />
                                </button>
                            )}
                        </div>

                        {normalizedQuery.length === 1 ? (
                            <div className="py-20 text-center">
                                <Search
                                    size={26}
                                    className="mx-auto text-stone-400"
                                />
                                <p className="mt-5 font-serif text-2xl">
                                    Keep typing
                                </p>
                                <p className="mt-2 text-sm text-stone-500">
                                    Enter at least two characters to search.
                                </p>
                            </div>
                        ) : isLoading ? (
                            <div className="mt-8 grid gap-4 md:grid-cols-2">
                                {Array.from({ length: 4 }, (_, index) => (
                                    <div
                                        key={index}
                                        className="grid grid-cols-[88px_1fr] gap-5 border border-black/10 bg-white/40 p-3"
                                    >
                                        <div className="skeleton-shimmer aspect-[3/4]" />
                                        <div className="space-y-3 py-3">
                                            <div className="skeleton-shimmer h-2 w-20" />
                                            <div className="skeleton-shimmer h-5 w-3/4" />
                                            <div className="skeleton-shimmer h-3 w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : hasError ? (
                            <div className="py-20 text-center">
                                <p className="font-serif text-2xl">
                                    Search is resting momentarily.
                                </p>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setRequestVersion(
                                            (version) => version + 1,
                                        )
                                    }
                                    className="button-light mt-6"
                                >
                                    Try again
                                </button>
                            </div>
                        ) : visibleProducts.length > 0 ? (
                            <div
                                id="predictive-search-results"
                                role="listbox"
                                aria-label="Product search results"
                                className="mt-8 grid gap-4 md:grid-cols-2"
                            >
                                {visibleProducts.map((product, index) => (
                                    <button
                                        key={product.id}
                                        id={`search-result-${product.id}`}
                                        type="button"
                                        role="option"
                                        aria-selected={activeIndex === index}
                                        onMouseEnter={() =>
                                            setActiveIndex(index)
                                        }
                                        onClick={() => openProduct(product)}
                                        className={`group grid grid-cols-[88px_1fr] gap-5 border p-3 text-left transition sm:grid-cols-[108px_1fr] ${activeIndex === index ? 'border-black bg-white shadow-[0_16px_40px_rgba(45,37,28,.08)]' : 'border-black/10 bg-white/40 hover:border-black hover:bg-white'}`}
                                    >
                                        <StoreImage
                                            src={product.images?.[0]}
                                            alt={product.name}
                                            className="object-cover transition duration-500 group-hover:scale-105"
                                            wrapperClassName="aspect-[3/4] bg-stone-100"
                                        />
                                        <span className="flex min-w-0 flex-col py-2 sm:py-3">
                                            <span className="eyebrow text-stone-500">
                                                {product.category?.name ??
                                                    'Ellena care'}
                                            </span>
                                            <span className="mt-3 font-serif text-xl leading-tight sm:text-2xl">
                                                {product.name}
                                            </span>
                                            <span className="mt-2 line-clamp-1 text-xs text-stone-500">
                                                {product.subtitle}
                                            </span>
                                            <span className="mt-auto flex items-end justify-between gap-3 pt-4">
                                                <span className="price-text">
                                                    {money(product.price)}
                                                </span>
                                                <ArrowRight
                                                    size={14}
                                                    className="transition-transform group-hover:translate-x-1"
                                                />
                                            </span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center">
                                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-rose text-white">
                                    <Sparkles size={20} />
                                </span>
                                <p className="mt-6 font-serif text-3xl">
                                    No formulas found
                                </p>
                                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-stone-500">
                                    Try a product name, ingredient, concern, or
                                    collection such as hair care.
                                </p>
                                <Link
                                    href="/shop"
                                    onClick={() => changeOpen(false)}
                                    className="button-dark mt-7"
                                >
                                    Browse every formula
                                </Link>
                            </div>
                        )}

                        {canSearch && visibleProducts.length > 0 && (
                            <button
                                type="button"
                                onClick={() => viewAll(normalizedQuery)}
                                className="button-light mt-6 w-full sm:hidden"
                            >
                                View all results
                            </button>
                        )}
                    </main>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

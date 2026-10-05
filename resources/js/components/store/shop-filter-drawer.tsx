import { router } from '@inertiajs/react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import type { Category, MerchandisingEdit } from '@/types';

export type Concern = {
    slug: string;
    label: string;
    description: string;
};

export type ShopFilters = {
    category?: string;
    search?: string;
    concern?: string;
    edit?: string;
    sort?: string;
};

export const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'newest', label: 'Newest arrivals' },
    { value: 'price-low', label: 'Price: low to high' },
    { value: 'price-high', label: 'Price: high to low' },
    { value: 'name', label: 'Name: A–Z' },
];

type FilterUpdates = Partial<
    Record<keyof ShopFilters, string | null | undefined>
>;

export function shopUrl(filters: ShopFilters, updates: FilterUpdates = {}) {
    const nextFilters = { ...filters, ...updates };
    const parameters = new URLSearchParams();

    for (const [key, value] of Object.entries(nextFilters)) {
        if (value && !(key === 'sort' && value === 'featured')) {
            parameters.set(key, value);
        }
    }

    const query = parameters.toString();

    return query ? `/shop?${query}` : '/shop';
}

export default function ShopFilterDrawer({
    open,
    onOpenChange,
    categories,
    edits,
    concerns,
    filters,
    total,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: Category[];
    edits: MerchandisingEdit[];
    concerns: Concern[];
    filters: ShopFilters;
    total: number;
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const activeFilterCount = [
        filters.category,
        filters.concern,
        filters.search,
        filters.edit,
    ].filter(Boolean).length;

    const navigate = (updates: FilterUpdates) => {
        if (Object.hasOwn(updates, 'search')) {
            setSearch(updates.search ?? '');
        }

        router.get(
            shopUrl(filters, updates),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onSuccess: () => onOpenChange(false),
            },
        );
    };

    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        navigate({ search: search.trim() || null });
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <Dialog.Content className="bg-ivory text-ink fixed inset-y-0 right-0 z-[90] flex w-[min(420px,92vw)] flex-col shadow-[-20px_0_70px_rgba(0,0,0,.16)] outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right">
                    <header className="flex items-center justify-between border-b border-black/10 px-6 py-6">
                        <div>
                            <Dialog.Title className="font-serif text-3xl tracking-[-.03em]">
                                Refine products
                            </Dialog.Title>
                            <Dialog.Description className="mt-1 text-xs text-stone-500">
                                {activeFilterCount > 0
                                    ? `${activeFilterCount} active ${activeFilterCount === 1 ? 'filter' : 'filters'}`
                                    : 'Find the formulas made for you'}
                            </Dialog.Description>
                        </div>
                        <Dialog.Close className="grid h-11 w-11 place-items-center rounded-full border border-black/15 bg-white/70 hover:border-black">
                            <X size={18} />
                            <span className="sr-only">Close filters</span>
                        </Dialog.Close>
                    </header>

                    <div className="flex-1 space-y-9 overflow-y-auto px-6 py-8">
                        <form onSubmit={submitSearch}>
                            <label
                                htmlFor="mobile-product-search"
                                className="eyebrow text-stone-500"
                            >
                                Search
                            </label>
                            <div className="mt-4 flex items-center border-b border-black pb-3">
                                <input
                                    id="mobile-product-search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Product, ingredient, concern"
                                    className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-stone-400"
                                />
                                <button
                                    type="submit"
                                    className="grid h-8 w-8 place-items-center"
                                    aria-label="Apply product search"
                                >
                                    <Search size={17} />
                                </button>
                            </div>
                        </form>

                        <fieldset>
                            <legend className="eyebrow text-stone-500">
                                Curated edits
                            </legend>
                            <div className="mt-4 grid gap-2">
                                {edits.map((edit) => (
                                    <button
                                        key={edit.slug}
                                        type="button"
                                        onClick={() =>
                                            navigate({
                                                edit:
                                                    filters.edit === edit.slug
                                                        ? null
                                                        : edit.slug,
                                                category: null,
                                                concern: null,
                                            })
                                        }
                                        className={`flex items-center justify-between border px-4 py-4 text-left text-sm transition ${filters.edit === edit.slug ? 'border-brand-rose bg-brand-rose text-white' : 'border-brand-pink bg-white/55 hover:border-brand-gold'}`}
                                    >
                                        <span>{edit.title}</span>
                                        <span className="text-[10px] opacity-60">
                                            {edit.products_count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend className="eyebrow text-stone-500">
                                Department
                            </legend>
                            <div className="mt-4 grid gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate({
                                            category: null,
                                            concern: null,
                                            edit: null,
                                        })
                                    }
                                    className={`flex items-center justify-between border px-4 py-4 text-left text-sm transition ${!filters.category ? 'border-brand-rose bg-brand-rose text-white' : 'border-brand-pink bg-white/55 hover:border-brand-gold'}`}
                                >
                                    Shop all <ArrowRight size={15} />
                                </button>
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() =>
                                            navigate({
                                                category: category.slug,
                                                concern: null,
                                                edit: null,
                                            })
                                        }
                                        className={`flex items-center justify-between border px-4 py-4 text-left text-sm transition ${filters.category === category.slug ? 'border-brand-rose bg-brand-rose text-white' : 'border-brand-pink bg-white/55 hover:border-brand-gold'}`}
                                    >
                                        <span>{category.name}</span>
                                        <span className="text-[10px] opacity-60">
                                            {category.products_count ?? 0}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </fieldset>

                        {concerns.length > 0 && (
                            <fieldset>
                                <legend className="eyebrow text-stone-500">
                                    Concern
                                </legend>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {concerns.map((concern) => (
                                        <button
                                            key={concern.slug}
                                            type="button"
                                            onClick={() =>
                                                navigate({
                                                    concern:
                                                        filters.concern ===
                                                        concern.slug
                                                            ? null
                                                            : concern.slug,
                                                })
                                            }
                                            className={`border px-4 py-3 text-[10px] font-semibold tracking-[.12em] uppercase transition ${filters.concern === concern.slug ? 'border-brand-rose bg-brand-rose text-white' : 'border-brand-pink bg-white/55 hover:border-brand-gold'}`}
                                        >
                                            {concern.label}
                                        </button>
                                    ))}
                                </div>
                            </fieldset>
                        )}

                        <label className="block">
                            <span className="eyebrow text-stone-500">
                                Sort by
                            </span>
                            <span className="relative mt-4 block">
                                <select
                                    value={filters.sort ?? 'featured'}
                                    onChange={(event) =>
                                        navigate({ sort: event.target.value })
                                    }
                                    className="w-full appearance-none border border-black/15 bg-white/50 px-4 py-4 text-sm outline-none focus:border-black"
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
                                <SlidersHorizontal
                                    size={15}
                                    className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
                                />
                            </span>
                        </label>
                    </div>

                    <footer className="border-t border-black/10 bg-white/35 px-6 py-5">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="button-dark w-full"
                        >
                            View {total} {total === 1 ? 'formula' : 'formulas'}
                        </button>
                        {activeFilterCount > 0 && (
                            <button
                                type="button"
                                onClick={() =>
                                    navigate({
                                        category: null,
                                        concern: null,
                                        search: null,
                                        edit: null,
                                    })
                                }
                                className="mt-4 w-full text-center text-[10px] font-semibold tracking-[.14em] uppercase underline underline-offset-4"
                            >
                                Clear filters
                            </button>
                        )}
                    </footer>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

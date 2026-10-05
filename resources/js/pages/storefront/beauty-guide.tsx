import { Link, router } from '@inertiajs/react';
import { ArrowRight, BookOpen, Clock3, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import SeoHead from '@/components/store/seo-head';
import StoreImage from '@/components/store/store-image';
import type { BeautyGuide } from '@/types';

export default function BeautyGuideIndex({
    guides,
    categories,
    filters,
}: {
    guides: BeautyGuide[];
    categories: Record<string, string>;
    filters: { category?: string; search?: string };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const featured = guides[0];
    const remaining = featured ? guides.slice(1) : [];

    const applySearch = (event: FormEvent) => {
        event.preventDefault();
        router.get('/beauty-guide', {
            ...(filters.category ? { category: filters.category } : {}),
            ...(search.trim() ? { search: search.trim() } : {}),
        });
    };

    return (
        <>
            <SeoHead
                title="Beauty Guide"
                description="Practical hair, body, baby-care, and fragrance guidance from Ellena."
                canonicalPath="/beauty-guide"
                structuredData={{
                    '@context': 'https://schema.org',
                    '@type': 'CollectionPage',
                    name: 'The Ellena Beauty Guide',
                    description:
                        'Practical guidance for thoughtful everyday beauty rituals.',
                    url: '/beauty-guide',
                }}
            />
            <section className="bg-brand-blush px-5 pt-40 pb-20 text-center md:pt-44 md:pb-24">
                <p className="eyebrow">The Ellena beauty guide</p>
                <h1 className="display-heading mx-auto mt-5 max-w-4xl">
                    Useful guidance for every ritual.
                </h1>
                <p className="body-copy mx-auto mt-5 max-w-2xl">
                    Thoughtful advice, ingredient context, and practical steps
                    designed to make choosing and using your care feel easier.
                </p>
            </section>

            <section className="bg-ivory/95 sticky top-[99px] z-30 border-y border-brand-pink px-5 py-4 backdrop-blur-xl md:top-[132px]">
                <div className="mx-auto flex max-w-[1280px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <nav
                        className="flex gap-2 overflow-x-auto pb-1"
                        aria-label="Guide categories"
                    >
                        <Link
                            href="/beauty-guide"
                            className={`shrink-0 rounded-full border px-4 py-2 text-[10px] font-semibold tracking-[.1em] uppercase ${!filters.category ? 'border-brand-rose bg-brand-rose text-white' : 'border-brand-pink bg-white hover:border-brand-gold'}`}
                        >
                            All guides
                        </Link>
                        {Object.entries(categories).map(([slug, label]) => (
                            <Link
                                key={slug}
                                href={`/beauty-guide?category=${slug}`}
                                className={`shrink-0 rounded-full border px-4 py-2 text-[10px] font-semibold tracking-[.1em] uppercase ${filters.category === slug ? 'border-brand-rose bg-brand-rose text-white' : 'border-brand-pink bg-white hover:border-brand-gold'}`}
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>
                    <form
                        onSubmit={applySearch}
                        className="flex min-w-64 items-center gap-3 border-b border-black/30 py-2 lg:max-w-xs lg:flex-1"
                    >
                        <Search size={15} className="text-brand-rose" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search advice"
                            aria-label="Search beauty guides"
                            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                        />
                    </form>
                </div>
            </section>

            <section className="store-container store-section">
                {featured ? (
                    <>
                        <Link
                            href={`/beauty-guide/${featured.slug}`}
                            className="group grid min-h-[520px] overflow-hidden bg-brand-rose text-white shadow-[0_24px_70px_rgba(45,37,28,.12)] lg:grid-cols-[1.25fr_.75fr]"
                        >
                            <StoreImage
                                src={featured.hero_image}
                                alt={featured.title}
                                className="object-cover transition-transform duration-1000 group-hover:scale-[1.03]"
                                wrapperClassName="min-h-[360px] lg:min-h-[580px]"
                            />
                            <span className="flex flex-col justify-center p-8 sm:p-12 lg:p-14">
                                <Sparkles
                                    size={19}
                                    className="text-brand-gold"
                                />
                                <span className="eyebrow mt-8 text-brand-gold">
                                    {featured.category_label} · Featured guide
                                </span>
                                <span className="mt-5 block font-serif text-4xl leading-[1.02] sm:text-5xl">
                                    {featured.title}
                                </span>
                                <span className="mt-6 block text-sm leading-7 text-white/75">
                                    {featured.excerpt}
                                </span>
                                <span className="mt-8 flex items-center gap-5 text-[10px] font-semibold tracking-[.13em] uppercase">
                                    <span className="inline-flex items-center gap-2">
                                        <Clock3 size={13} />{' '}
                                        {featured.read_minutes} min read
                                    </span>
                                    <span className="inline-flex items-center gap-2 border-b border-brand-gold pb-1 text-brand-gold">
                                        Read guide <ArrowRight size={12} />
                                    </span>
                                </span>
                            </span>
                        </Link>

                        {remaining.length > 0 && (
                            <div className="mt-16">
                                <div className="mb-9 flex items-end justify-between gap-5">
                                    <div>
                                        <p className="eyebrow text-gold">
                                            Explore the library
                                        </p>
                                        <h2 className="section-heading mt-4">
                                            Advice for the care you choose.
                                        </h2>
                                    </div>
                                    <Link
                                        href="/find-your-ellena"
                                        className="text-link hidden sm:inline-flex"
                                    >
                                        Find your ritual{' '}
                                        <ArrowRight size={13} />
                                    </Link>
                                </div>
                                <div className="grid gap-x-5 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
                                    {remaining.map((guide) => (
                                        <GuideCard
                                            key={guide.id}
                                            guide={guide}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="border border-brand-pink bg-white/60 px-6 py-24 text-center">
                        <BookOpen
                            size={25}
                            className="mx-auto text-brand-rose"
                        />
                        <h2 className="mt-5 font-serif text-3xl">
                            No guides matched your search.
                        </h2>
                        <p className="mt-3 text-sm text-stone-500">
                            Try another phrase or return to the complete guide
                            library.
                        </p>
                        <Link href="/beauty-guide" className="button-dark mt-7">
                            View all guides
                        </Link>
                    </div>
                )}
            </section>
        </>
    );
}

function GuideCard({ guide }: { guide: BeautyGuide }) {
    return (
        <Link
            href={`/beauty-guide/${guide.slug}`}
            className="group flex flex-col"
        >
            <StoreImage
                src={guide.hero_image}
                alt={guide.title}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                wrapperClassName="aspect-[4/3] bg-brand-blush"
            />
            <span className="eyebrow text-gold mt-6">
                {guide.category_label}
            </span>
            <span className="mt-3 block font-serif text-3xl leading-tight">
                {guide.title}
            </span>
            <span className="mt-4 line-clamp-3 text-sm leading-7 text-stone-600">
                {guide.excerpt}
            </span>
            <span className="mt-6 inline-flex items-center gap-4 text-[10px] font-semibold tracking-[.13em] uppercase">
                {guide.read_minutes} min read{' '}
                <ArrowRight
                    size={12}
                    className="transition-transform group-hover:translate-x-1"
                />
            </span>
        </Link>
    );
}

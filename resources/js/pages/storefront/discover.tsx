import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    Layers3,
    SearchCheck,
    Sparkles,
} from 'lucide-react';
import ProductCard from '@/components/store/product-card';
import SeoHead from '@/components/store/seo-head';
import StoreImage from '@/components/store/store-image';
import type { BeautyGuide, Product } from '@/types';

type MerchandisingEdit = {
    slug: string;
    eyebrow: string;
    title: string;
    description: string;
    image: string;
    href: string;
    products_count: number;
};

type ConcernEdit = {
    slug: string;
    title: string;
    description: string;
    href: string;
    image: string;
};

type RitualPreview = {
    id: number;
    name: string;
    slug: string;
    eyebrow?: string;
    description: string;
    image?: string;
    products_count: number;
};

type GuidePreview = Pick<
    BeautyGuide,
    | 'id'
    | 'title'
    | 'slug'
    | 'category'
    | 'eyebrow'
    | 'excerpt'
    | 'hero_image'
    | 'read_minutes'
>;

const editLayouts = [
    'md:col-span-7 md:row-span-2 min-h-[620px]',
    'md:col-span-5 min-h-[300px]',
    'md:col-span-5 min-h-[300px]',
    'md:col-span-12 min-h-[360px]',
];

export default function Discover({
    edits,
    concerns,
    featuredProducts,
    rituals,
    guides,
    featuredProductsTitle,
    featuredProductsEyebrow,
}: {
    edits: MerchandisingEdit[];
    concerns: ConcernEdit[];
    featuredProducts: Product[];
    rituals: RitualPreview[];
    guides: GuidePreview[];
    featuredProductsTitle: string;
    featuredProductsEyebrow: string;
}) {
    return (
        <>
            <SeoHead
                title="Discover Beauty Routines, Products & Expert Picks"
                description="Discover Ellena products by concern, curated products, complete ritual, or expert beauty guide. A simpler way to find thoughtful hair, body, baby, and fragrance care."
                canonicalPath="/discover"
                structuredData={{
                    '@context': 'https://schema.org',
                    '@type': 'CollectionPage',
                    name: 'Discover Ellena',
                    description:
                        'Curated beauty products, routines, concerns, and expert product recommendations from Ellena Beauty.',
                }}
            />

            <section className="grid min-h-[760px] bg-brand-rose pt-24 text-white lg:grid-cols-[1.05fr_.95fr]">
                <div className="flex items-center px-6 py-20 sm:px-12 lg:px-20">
                    <div className="max-w-2xl">
                        <p className="eyebrow text-brand-gold">
                            The discovery room
                        </p>
                        <h1 className="display-heading mt-6 text-white">
                            More ways to find what fits.
                        </h1>
                        <p className="mt-7 max-w-xl text-base leading-8 text-white/75">
                            Begin with a concern, explore expert products, or
                            build a complete ritual. Every path leads to
                            formulas already available in the Ellena collection.
                        </p>
                        <div className="mt-10 flex flex-wrap gap-3">
                            <Link href="#edits" className="button-light">
                                Explore products <ArrowRight size={14} />
                            </Link>
                            <Link
                                href="/find-your-ellena"
                                className="inline-flex min-h-12 items-center gap-3 border border-white/35 px-6 text-[10px] font-semibold tracking-[.14em] uppercase transition hover:border-brand-gold hover:text-brand-gold"
                            >
                                Take the finder <Sparkles size={14} />
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="relative min-h-[500px] overflow-hidden">
                    <StoreImage
                        src="/images/campaign/ellena-braids-hero-v2.png"
                        alt="Ellena beauty discovery"
                        className="object-cover transition duration-[1600ms] hover:scale-[1.025]"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-brand-rose/45 via-transparent to-transparent" />
                    <span className="absolute right-6 bottom-6 left-6 flex items-center justify-between border-t border-white/40 pt-4 text-[9px] font-semibold tracking-[.16em] uppercase">
                        <span>Concern</span>
                        <span>Routine</span>
                        <span>Expert products</span>
                    </span>
                </div>
            </section>

            <nav className="sticky top-[99px] z-30 border-y border-brand-pink bg-brand-white/95 px-5 backdrop-blur-xl md:top-[132px]">
                <div className="mx-auto flex max-w-[1100px] items-center justify-center gap-8 overflow-x-auto py-5 text-[9px] font-semibold tracking-[.14em] whitespace-nowrap uppercase sm:gap-12">
                    <a href="#edits">Curated products</a>
                    <a href="#concerns">Shop by concern</a>
                    <a href="#rituals">Complete rituals</a>
                    <a href="#expert-guidance">Expert guidance</a>
                </div>
            </nav>

            <section
                id="edits"
                className="store-container store-section scroll-mt-48"
            >
                <div className="mb-12 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
                    <div>
                        <p className="eyebrow">Curated collections</p>
                        <h2 className="section-heading mt-4">
                            Ellena products.
                        </h2>
                    </div>
                    <p className="body-copy max-w-md md:text-right">
                        Familiar formulas, newly considered through what is
                        available, newly released, accessibly priced, and
                        guide-selected.
                    </p>
                </div>
                <div className="grid gap-4 md:auto-rows-[300px] md:grid-cols-12">
                    {edits.map((edit, index) => (
                        <Link
                            key={edit.slug}
                            href={edit.href}
                            className={`group relative isolate overflow-hidden bg-stone-900 text-white ${editLayouts[index] ?? editLayouts[3]}`}
                        >
                            <StoreImage
                                src={edit.image}
                                alt={edit.title}
                                className="object-cover transition-transform duration-1000 group-hover:scale-[1.04]"
                                wrapperClassName="absolute inset-0"
                            />
                            <span className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/25 to-black/5" />
                            <span className="absolute inset-x-0 bottom-0 z-20 p-7 sm:p-9">
                                <span className="eyebrow text-brand-gold">
                                    {edit.eyebrow}
                                </span>
                                <span className="mt-3 block font-serif text-4xl leading-none tracking-[-.03em] sm:text-5xl">
                                    {edit.title}
                                </span>
                                <span className="mt-4 block max-w-xl text-sm leading-6 text-white/75">
                                    {edit.description}
                                </span>
                                <span className="mt-6 inline-flex items-center gap-3 border-b border-white/60 pb-1.5 text-[10px] font-semibold tracking-[.14em] uppercase transition-all group-hover:gap-5 group-hover:border-brand-gold group-hover:text-brand-gold">
                                    Explore {edit.products_count}{' '}
                                    {edit.products_count === 1
                                        ? 'formula'
                                        : 'formulas'}{' '}
                                    <ArrowRight size={12} />
                                </span>
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            <section
                id="concerns"
                className="scroll-mt-48 border-y border-brand-pink bg-brand-blush"
            >
                <div className="store-container store-section">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div>
                            <p className="eyebrow">Shop by concern</p>
                            <h2 className="section-heading mt-4">
                                Start with what you need.
                            </h2>
                        </div>
                        <Link href="/find-your-ellena" className="text-link">
                            Not sure? Take the finder <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="mt-10 grid gap-px overflow-hidden border border-brand-pink bg-brand-pink sm:grid-cols-2 xl:grid-cols-3">
                        {concerns.map((concern, index) => (
                            <Link
                                key={concern.slug}
                                href={concern.href}
                                className={`group grid min-h-72 grid-cols-1 bg-white/90 transition hover:bg-white ${index % 2 ? 'sm:grid-cols-[42%_minmax(0,1fr)]' : 'sm:grid-cols-[minmax(0,1fr)_42%]'}`}
                            >
                                <span className="flex min-w-0 flex-col p-6">
                                    <span className="font-serif text-3xl leading-tight text-balance">
                                        {concern.title}
                                    </span>
                                    <span className="mt-4 text-sm leading-6 text-stone-600">
                                        {concern.description}
                                    </span>
                                    <span className="mt-auto inline-flex items-center gap-2 pt-6 text-[9px] font-semibold tracking-[.13em] uppercase group-hover:text-brand-rose">
                                        Shop the concern{' '}
                                        <ArrowRight size={12} />
                                    </span>
                                </span>
                                <StoreImage
                                    src={concern.image}
                                    alt=""
                                    aria-hidden="true"
                                    className="object-cover transition duration-700 group-hover:scale-105"
                                    wrapperClassName={`min-h-56 h-full sm:min-h-0 ${index % 2 ? 'sm:order-first' : ''}`}
                                />
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {featuredProducts.length > 0 && (
                <section className="store-container store-section">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div>
                            <p className="eyebrow">{featuredProductsEyebrow}</p>
                            <h2 className="section-heading mt-4">
                                {featuredProductsTitle}
                            </h2>
                        </div>
                        <Link
                            href="/shop?edit=available-now"
                            className="text-link"
                        >
                            Shop all products <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                        {featuredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            <section
                id="rituals"
                className="scroll-mt-48 bg-brand-rose text-white"
            >
                <div className="store-container store-section">
                    <div className="grid gap-7 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
                        <div>
                            <Layers3 size={22} className="text-brand-gold" />
                            <p className="eyebrow mt-7 text-brand-gold">
                                Complete routines
                            </p>
                            <h2 className="section-heading mt-4 text-white">
                                Products that work better together.
                            </h2>
                        </div>
                        <p className="max-w-xl text-sm leading-7 text-white/70 lg:justify-self-end">
                            Each ritual gives individual formulas a clear role
                            and order, helping you shop by outcome rather than
                            product count.
                        </p>
                    </div>
                    <div className="mt-12 grid gap-px bg-white/20 lg:grid-cols-3">
                        {rituals.map((ritual, index) => (
                            <Link
                                key={ritual.id}
                                href={`/rituals#${ritual.slug}`}
                                className="group relative min-h-[440px] overflow-hidden bg-stone-900"
                            >
                                <StoreImage
                                    src={ritual.image}
                                    alt={ritual.name}
                                    className="object-cover transition duration-1000 group-hover:scale-[1.04]"
                                    wrapperClassName="absolute inset-0"
                                />
                                <span className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                <span className="absolute inset-x-0 bottom-0 p-7">
                                    <span className="eyebrow text-brand-gold">
                                        {ritual.eyebrow ??
                                            `Ritual 0${index + 1}`}
                                    </span>
                                    <span className="mt-3 block font-serif text-4xl leading-tight">
                                        {ritual.name}
                                    </span>
                                    <span className="mt-3 block text-sm leading-6 text-white/70">
                                        {ritual.products_count} coordinated{' '}
                                        {ritual.products_count === 1
                                            ? 'step'
                                            : 'steps'}
                                    </span>
                                    <span className="mt-6 inline-flex items-center gap-3 text-[9px] font-semibold tracking-[.14em] uppercase group-hover:text-brand-gold">
                                        View the ritual <ArrowRight size={12} />
                                    </span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section
                id="expert-guidance"
                className="store-container store-section scroll-mt-48"
            >
                <div className="grid gap-12 lg:grid-cols-[380px_1fr]">
                    <div className="flex flex-col justify-between bg-brand-blush p-8 sm:p-10">
                        <div>
                            <SearchCheck
                                size={24}
                                className="text-brand-rose"
                            />
                            <p className="eyebrow mt-8">Personal discovery</p>
                            <h2 className="mt-4 font-serif text-4xl leading-tight">
                                Let us narrow the collection for you.
                            </h2>
                            <p className="mt-5 text-sm leading-7 text-stone-600">
                                Answer three short questions to receive a
                                focused recommendation based on area, concern,
                                and texture preference.
                            </p>
                        </div>
                        <Link
                            href="/find-your-ellena"
                            className="button-dark mt-10 w-full"
                        >
                            Find your Ellena <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div>
                        <div className="flex items-center justify-between gap-5">
                            <div>
                                <p className="eyebrow">The Beauty Guide</p>
                                <h2 className="section-heading mt-4">
                                    Learn, then choose.
                                </h2>
                            </div>
                            <BookOpen
                                size={25}
                                className="hidden text-brand-rose sm:block"
                            />
                        </div>
                        <div className="mt-8 border-t border-black/15">
                            {guides.map((guide) => (
                                <Link
                                    key={guide.id}
                                    href={`/beauty-guide/${guide.slug}`}
                                    className="group grid gap-5 border-b border-black/15 py-6 sm:grid-cols-[120px_1fr_auto] sm:items-center"
                                >
                                    <StoreImage
                                        src={guide.hero_image}
                                        alt=""
                                        aria-hidden="true"
                                        className="object-cover transition duration-700 group-hover:scale-105"
                                        wrapperClassName="hidden aspect-[4/3] overflow-hidden bg-brand-blush sm:block"
                                    />
                                    <span>
                                        <span className="eyebrow text-stone-500">
                                            {guide.eyebrow ?? guide.category} ·{' '}
                                            {guide.read_minutes} min read
                                        </span>
                                        <span className="mt-2 block font-serif text-2xl leading-tight group-hover:text-brand-rose">
                                            {guide.title}
                                        </span>
                                        <span className="mt-2 line-clamp-1 block text-sm text-stone-500">
                                            {guide.excerpt}
                                        </span>
                                    </span>
                                    <ArrowRight
                                        size={16}
                                        className="transition-transform group-hover:translate-x-1"
                                    />
                                </Link>
                            ))}
                        </div>
                        <Link
                            href="/beauty-guide"
                            className="text-link mt-7 inline-flex"
                        >
                            Browse every guide <ArrowRight size={12} />
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}

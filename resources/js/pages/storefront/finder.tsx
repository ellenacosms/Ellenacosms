import { Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    RotateCcw,
    Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import SeoHead from '@/components/store/seo-head';
import StoreImage from '@/components/store/store-image';
import WishlistButton from '@/components/store/wishlist-button';
import { money } from '@/lib/money';
import type { Product } from '@/types';

type CareArea = 'hair' | 'body' | 'baby' | 'fragrance';

type FinderOption = {
    value: string;
    label: string;
    copy: string;
    keywords: string[];
};

const areaOptions: Array<FinderOption & { value: CareArea; category: string }> =
    [
        {
            value: 'hair',
            category: 'hair-care',
            label: 'Hair care',
            copy: 'Nourish, strengthen, soften, and style your crown.',
            keywords: ['hair'],
        },
        {
            value: 'body',
            category: 'body-care',
            label: 'Body care',
            copy: 'Build a comforting ritual for cleansed, nourished skin.',
            keywords: ['body'],
        },
        {
            value: 'baby',
            category: 'baby-care',
            label: 'Baby care',
            copy: 'Choose gentle essentials for delicate everyday moments.',
            keywords: ['baby'],
        },
        {
            value: 'fragrance',
            category: 'fragrance',
            label: 'Fragrance',
            copy: 'Find the finishing note that feels distinctly yours.',
            keywords: ['fragrance'],
        },
    ];

const goals: Record<CareArea, FinderOption[]> = {
    hair: [
        {
            value: 'moisture',
            label: 'Moisture & softness',
            copy: 'Comfort dry lengths and bring back a softer finish.',
            keywords: ['moisture', 'hydrat', 'soft', 'avocado', 'oil'],
        },
        {
            value: 'strength',
            label: 'Strength & repair',
            copy: 'Support stressed lengths, breakage, and protective styles.',
            keywords: ['strong', 'repair', 'breakage', 'damage', 'rosemary'],
        },
        {
            value: 'scalp',
            label: 'Scalp care',
            copy: 'Begin at the root with a more focused scalp ritual.',
            keywords: ['scalp', 'root', 'rosemary', 'clean'],
        },
        {
            value: 'style',
            label: 'Definition & shine',
            copy: 'Create polish, manageable hold, and luminous definition.',
            keywords: ['style', 'hold', 'define', 'shine', 'pomade', 'gel'],
        },
    ],
    body: [
        {
            value: 'nourish',
            label: 'Nourishment',
            copy: 'Bring lasting comfort to skin that feels dry or tight.',
            keywords: ['nourish', 'moisture', 'soft', 'lotion', 'cream', 'oil'],
        },
        {
            value: 'cleanse',
            label: 'Fresh cleansing',
            copy: 'Create a gentle, refreshing everyday reset.',
            keywords: ['clean', 'wash', 'soap', 'fresh', 'exfoliat'],
        },
        {
            value: 'protect',
            label: 'Daily protection',
            copy: 'Support exposed skin through active everyday moments.',
            keywords: ['protect', 'repellant', 'mosquito', 'shield', 'daily'],
        },
        {
            value: 'aromatic',
            label: 'Aromatic care',
            copy: 'Make scent and texture part of the body ritual.',
            keywords: ['aroma', 'scent', 'mist', 'fragrance', 'perfume'],
        },
    ],
    baby: [
        {
            value: 'gentle',
            label: 'Gentle daily care',
            copy: 'A simple starting point for delicate everyday care.',
            keywords: ['gentle', 'baby', 'mild', 'daily', 'delicate'],
        },
        {
            value: 'softness',
            label: 'Softness & moisture',
            copy: 'Comfort skin after bathing and whenever dryness appears.',
            keywords: ['soft', 'moisture', 'lotion', 'oil', 'cream'],
        },
        {
            value: 'bath',
            label: 'Bath-time care',
            copy: 'Choose a gentle cleanse for a calmer bath-time ritual.',
            keywords: ['bath', 'wash', 'soap', 'clean', 'shampoo'],
        },
        {
            value: 'protect',
            label: 'Everyday protection',
            copy: 'Add a considered layer of care for active family days.',
            keywords: ['protect', 'repellant', 'mosquito', 'shield'],
        },
    ],
    fragrance: [
        {
            value: 'signature',
            label: 'A signature scent',
            copy: 'Discover a memorable finishing touch for your ritual.',
            keywords: ['signature', 'perfume', 'fragrance', 'scent'],
        },
        {
            value: 'fresh',
            label: 'Fresh & easy',
            copy: 'Choose a lighter scent for effortless everyday wear.',
            keywords: ['fresh', 'light', 'citrus', 'bergamot', 'mist'],
        },
        {
            value: 'warm',
            label: 'Warm & enveloping',
            copy: 'Find comforting notes with a deeper, lingering character.',
            keywords: ['warm', 'sandalwood', 'musk', 'amber', 'evening'],
        },
        {
            value: 'layer',
            label: 'Scent layering',
            copy: 'Build dimension by pairing fragrance with body care.',
            keywords: ['layer', 'body', 'mist', 'oil', 'ritual'],
        },
    ],
};

const preferences: FinderOption[] = [
    {
        value: 'simple',
        label: 'Simple & everyday',
        copy: 'An uncomplicated formula that slips easily into your day.',
        keywords: ['daily', 'gentle', 'simple', 'everyday'],
    },
    {
        value: 'rich',
        label: 'Rich & nourishing',
        copy: 'Comforting textures and a more restorative ritual.',
        keywords: ['rich', 'cream', 'butter', 'oil', 'nourish', 'repair'],
    },
    {
        value: 'light',
        label: 'Light & effortless',
        copy: 'Weightless textures, freshness, and a clean finish.',
        keywords: ['light', 'mist', 'gel', 'fresh', 'absorbing'],
    },
    {
        value: 'sensorial',
        label: 'Sensorial & indulgent',
        copy: 'Scent, texture, and pause are part of the experience.',
        keywords: ['aroma', 'scent', 'fragrance', 'ritual', 'luminous'],
    },
];

function productFieldText(product: Product) {
    return {
        concerns: (product.concerns ?? []).join(' ').toLowerCase(),
        ingredients: (product.ingredients ?? '').toLowerCase(),
        usage: (product.usage ?? '').toLowerCase(),
        description: [
            product.name,
            product.subtitle,
            product.description,
            ...(product.benefits ?? []),
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase(),
    };
}

function keywordMatches(text: string, keywords: string[]): number {
    return keywords.filter((keyword) => text.includes(keyword)).length;
}

function productMatchScore(product: Product, keywords: string[]) {
    const fields = productFieldText(product);

    return {
        concernMatches: keywordMatches(fields.concerns, keywords),
        ingredientMatches: keywordMatches(fields.ingredients, keywords),
        usageMatches: keywordMatches(fields.usage, keywords),
        descriptionMatches: keywordMatches(fields.description, keywords),
    };
}

export default function Finder({ products }: { products: Product[] }) {
    const [step, setStep] = useState(0);
    const [area, setArea] = useState<CareArea | null>(null);
    const [goalValue, setGoalValue] = useState<string | null>(null);
    const [preferenceValue, setPreferenceValue] = useState<string | null>(null);

    const areaOption = areaOptions.find((option) => option.value === area);
    const goal = area
        ? goals[area].find((option) => option.value === goalValue)
        : undefined;
    const preference = preferences.find(
        (option) => option.value === preferenceValue,
    );

    const recommendations = useMemo(() => {
        if (!areaOption || !goal || !preference) return [];

        return products
            .filter(
                (product) =>
                    product.category?.slug === areaOption.category &&
                    product.stock > 0,
            )
            .map((product) => {
                const goalMatches = productMatchScore(product, goal.keywords);
                const preferenceMatches = productMatchScore(
                    product,
                    preference.keywords,
                );
                const rating = Number(product.reviews_avg_rating ?? 0);
                return {
                    product,
                    score:
                        goalMatches.concernMatches * 10 +
                        goalMatches.ingredientMatches * 4 +
                        goalMatches.usageMatches * 3 +
                        goalMatches.descriptionMatches +
                        preferenceMatches.concernMatches * 3 +
                        preferenceMatches.ingredientMatches * 1.5 +
                        preferenceMatches.usageMatches +
                        preferenceMatches.descriptionMatches * 0.5 +
                        (product.is_featured ? 1 : 0) +
                        rating / 10,
                    reason:
                        goalMatches.concernMatches > 0
                            ? `Matches your “Best for” needs: ${(product.concerns ?? []).join(', ')}.`
                            : goalMatches.ingredientMatches > 0
                              ? `Its key ingredients support ${goal.label.toLowerCase()}.`
                              : goalMatches.usageMatches > 0
                                ? `Its recommended use supports ${goal.label.toLowerCase()}.`
                                : goalMatches.descriptionMatches > 0
                                  ? goal.copy
                                  : `A considered ${areaOption.label.toLowerCase()} starting point for your selected ritual.`,
                };
            })
            .sort(
                (first, second) =>
                    second.score - first.score ||
                    first.product.name.localeCompare(second.product.name),
            )
            .slice(0, 3);
    }, [areaOption, goal, preference, products]);

    const canContinue =
        (step === 0 && area !== null) ||
        (step === 1 && goalValue !== null) ||
        (step === 2 && preferenceValue !== null);

    const reset = () => {
        setStep(0);
        setArea(null);
        setGoalValue(null);
        setPreferenceValue(null);
    };

    return (
        <>
            <SeoHead
                title="Find Your Ellena"
                description="Answer three thoughtful questions and discover Ellena products matched to your care priorities."
                canonicalPath="/find-your-ellena"
            />
            <section className="bg-brand-blush px-5 pt-40 pb-16 text-center md:pt-44 md:pb-20">
                <p className="eyebrow">Guided discovery</p>
                <h1 className="display-heading mx-auto mt-5 max-w-3xl">
                    Find your Ellena.
                </h1>
                <p className="body-copy mx-auto mt-5 max-w-xl">
                    Three thoughtful choices. A more personal starting point.
                </p>
            </section>

            <section className="store-container store-section max-w-6xl">
                {step < 3 ? (
                    <div className="grid overflow-hidden border border-brand-pink bg-white/60 shadow-[0_24px_70px_rgba(143,40,74,.08)] lg:grid-cols-[280px_1fr]">
                        <aside className="bg-brand-rose p-7 text-white sm:p-9">
                            <Sparkles size={20} className="text-brand-gold" />
                            <p className="eyebrow mt-8 text-brand-gold">
                                Step {step + 1} of 3
                            </p>
                            <h2 className="mt-4 font-serif text-3xl leading-tight">
                                A finder designed for a focused collection.
                            </h2>
                            <p className="mt-5 text-sm leading-7 text-white/70">
                                We use your priorities and the details already
                                attached to every Ellena formula—nothing more
                                complicated than your ritual needs.
                            </p>
                            <div
                                className="mt-10 flex gap-2"
                                aria-hidden="true"
                            >
                                {[0, 1, 2].map((index) => (
                                    <span
                                        key={index}
                                        className={`h-1 flex-1 transition-colors ${index <= step ? 'bg-brand-gold' : 'bg-white/20'}`}
                                    />
                                ))}
                            </div>
                        </aside>

                        <div className="p-6 sm:p-10 lg:p-12">
                            {step === 0 && (
                                <Question
                                    eyebrow="First, the ritual"
                                    title="What are you caring for?"
                                    options={areaOptions}
                                    selected={area}
                                    onSelect={(value) => {
                                        setArea(value as CareArea);
                                        setGoalValue(null);
                                    }}
                                />
                            )}
                            {step === 1 && area && (
                                <Question
                                    eyebrow="Your priority"
                                    title="What would you most like to address?"
                                    options={goals[area]}
                                    selected={goalValue}
                                    onSelect={setGoalValue}
                                />
                            )}
                            {step === 2 && (
                                <Question
                                    eyebrow="The experience"
                                    title="How should your ritual feel?"
                                    options={preferences}
                                    selected={preferenceValue}
                                    onSelect={setPreferenceValue}
                                />
                            )}

                            <div className="mt-10 flex items-center justify-between border-t border-brand-pink pt-7">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setStep((current) => current - 1)
                                    }
                                    disabled={step === 0}
                                    className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[.14em] uppercase transition hover:text-brand-rose disabled:invisible"
                                >
                                    <ArrowLeft size={14} /> Back
                                </button>
                                <button
                                    type="button"
                                    disabled={!canContinue}
                                    onClick={() =>
                                        setStep((current) => current + 1)
                                    }
                                    className="button-dark gap-3 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {step === 2 ? 'See my ritual' : 'Continue'}
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <FinderResults
                        recommendations={recommendations}
                        area={areaOption}
                        goal={goal}
                        preference={preference}
                        onReset={reset}
                    />
                )}
            </section>
        </>
    );
}

function Question({
    eyebrow,
    title,
    options,
    selected,
    onSelect,
}: {
    eyebrow: string;
    title: string;
    options: FinderOption[];
    selected: string | null;
    onSelect: (value: string) => void;
}) {
    return (
        <div>
            <p className="eyebrow text-gold">{eyebrow}</p>
            <h2 className="subsection-heading mt-4 max-w-2xl">{title}</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {options.map((option) => {
                    const active = selected === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onSelect(option.value)}
                            aria-pressed={active}
                            className={`group relative min-h-36 border p-6 text-left transition-all ${active ? 'border-brand-rose bg-brand-blush shadow-[0_12px_30px_rgba(143,40,74,.1)]' : 'border-brand-pink bg-white hover:-translate-y-0.5 hover:border-brand-gold'}`}
                        >
                            <span className="block pr-8 font-serif text-2xl">
                                {option.label}
                            </span>
                            <span className="mt-3 block text-sm leading-6 text-stone-600">
                                {option.copy}
                            </span>
                            {active && (
                                <span className="absolute top-5 right-5 grid h-7 w-7 place-items-center rounded-full bg-brand-rose text-white">
                                    <Check size={14} />
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function FinderResults({
    recommendations,
    area,
    goal,
    preference,
    onReset,
}: {
    recommendations: Array<{ product: Product; score: number; reason: string }>;
    area?: FinderOption;
    goal?: FinderOption;
    preference?: FinderOption;
    onReset: () => void;
}) {
    const [primary, ...alternatives] = recommendations;
    return (
        <div>
            <div className="grid gap-8 bg-brand-rose p-7 text-white sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end lg:p-12">
                <div>
                    <p className="eyebrow text-brand-gold">
                        Your Ellena starting point
                    </p>
                    <h2 className="section-heading mt-5 max-w-3xl">
                        The {goal?.label.toLowerCase()} ritual.
                    </h2>
                    <p className="mt-5 max-w-2xl text-sm leading-7 text-white/75">
                        Selected for {area?.label.toLowerCase()}, with a{' '}
                        {preference?.label.toLowerCase()} experience in mind.
                        These recommendations are drawn from the formulas
                        currently available in the Ellena collection.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onReset}
                    className="inline-flex shrink-0 items-center gap-2 border-b border-brand-gold pb-2 text-[10px] font-semibold tracking-[.14em] uppercase hover:text-brand-gold"
                >
                    <RotateCcw size={13} /> Retake finder
                </button>
            </div>

            {primary ? (
                <>
                    <article className="mt-8 grid overflow-hidden border border-brand-pink bg-white/70 shadow-[0_20px_60px_rgba(45,37,28,.08)] md:grid-cols-2">
                        <StoreImage
                            src={primary.product.images?.[0]}
                            alt={primary.product.name}
                            className="object-contain object-center p-10 mix-blend-multiply"
                            wrapperClassName="min-h-[430px] bg-[#faf9f7]"
                        />
                        <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
                            <p className="eyebrow text-gold">Best match</p>
                            <h3 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">
                                {primary.product.name}
                            </h3>
                            {primary.product.subtitle && (
                                <p className="mt-3 text-sm text-stone-500">
                                    {primary.product.subtitle}
                                </p>
                            )}
                            <div className="mt-7 border-l-2 border-brand-gold pl-5">
                                <p className="eyebrow text-stone-500">
                                    Why it matches
                                </p>
                                <p className="mt-3 text-sm leading-7 text-stone-700">
                                    {primary.reason}
                                </p>
                            </div>
                            {primary.product.benefits?.length ? (
                                <div className="mt-6 flex flex-wrap gap-2">
                                    {primary.product.benefits
                                        .slice(0, 3)
                                        .map((benefit) => (
                                            <span
                                                key={benefit}
                                                className="rounded-full border border-brand-pink bg-brand-blush px-3 py-2 text-[10px] font-semibold tracking-[.08em] uppercase"
                                            >
                                                {benefit}
                                            </span>
                                        ))}
                                </div>
                            ) : null}
                            <p className="price-text mt-7">
                                {money(primary.product.price)}
                            </p>
                            <div className="mt-7 flex flex-wrap gap-3">
                                <Link
                                    href={`/products/${primary.product.slug}`}
                                    className="button-dark gap-3"
                                >
                                    View recommendation
                                    <ArrowRight size={14} />
                                </Link>
                                <WishlistButton
                                    product={primary.product}
                                    showLabel
                                    className="button-light"
                                />
                            </div>
                        </div>
                    </article>

                    {alternatives.length > 0 && (
                        <div className="mt-14">
                            <p className="eyebrow">Complete the discovery</p>
                            <h3 className="subsection-heading mt-4">
                                Other formulas worth considering.
                            </h3>
                            <div className="mt-8 grid gap-5 md:grid-cols-2">
                                {alternatives.map(({ product, reason }) => (
                                    <article
                                        key={product.id}
                                        className="grid grid-cols-[130px_1fr] overflow-hidden border border-brand-pink bg-white/60 sm:grid-cols-[180px_1fr]"
                                    >
                                        <StoreImage
                                            src={product.images?.[0]}
                                            alt={product.name}
                                            className="object-contain object-center p-5 mix-blend-multiply"
                                            wrapperClassName="min-h-56 bg-[#faf9f7]"
                                        />
                                        <div className="flex min-w-0 flex-col p-5 sm:p-6">
                                            <p className="eyebrow text-gold">
                                                Recommended
                                            </p>
                                            <h4 className="mt-3 font-serif text-2xl leading-tight">
                                                {product.name}
                                            </h4>
                                            <p className="mt-3 line-clamp-2 text-xs leading-5 text-stone-500">
                                                {reason}
                                            </p>
                                            <div className="mt-auto flex items-end justify-between gap-4 pt-5">
                                                <span className="price-text">
                                                    {money(product.price)}
                                                </span>
                                                <Link
                                                    href={`/products/${product.slug}`}
                                                    className="text-link"
                                                >
                                                    Explore{' '}
                                                    <ArrowRight size={12} />
                                                </Link>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="border border-t-0 border-brand-pink bg-white/60 px-6 py-20 text-center">
                    <Sparkles size={24} className="mx-auto text-brand-rose" />
                    <h3 className="mt-5 font-serif text-3xl">
                        This product collection is still being composed.
                    </h3>
                    <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-stone-500">
                        There are no available formulas in this collection yet.
                        Explore the full catalogue or try another ritual.
                    </p>
                    <div className="mt-7 flex flex-wrap justify-center gap-3">
                        <button
                            type="button"
                            onClick={onReset}
                            className="button-light"
                        >
                            Try another ritual
                        </button>
                        <Link href="/shop" className="button-dark">
                            Browse all products
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

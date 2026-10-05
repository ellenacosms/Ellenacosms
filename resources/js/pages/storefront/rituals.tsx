import { Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    Layers3,
    LoaderCircle,
    Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { useCartDrawer } from '@/components/store/cart-drawer-context';
import SeoHead from '@/components/store/seo-head';
import StoreImage from '@/components/store/store-image';
import { money } from '@/lib/money';
import type { Ritual } from '@/types';

export default function Rituals({ rituals }: { rituals: Ritual[] }) {
    const [addingRitual, setAddingRitual] = useState<number | null>(null);
    const { openCartDrawer } = useCartDrawer();
    const addRitual = (ritual: Ritual) => {
        router.post(
            `/rituals/${ritual.slug}/cart`,
            { quantity: 1 },
            {
                preserveScroll: true,
                onStart: () => setAddingRitual(ritual.id),
                onSuccess: openCartDrawer,
                onFinish: () => setAddingRitual(null),
            },
        );
    };

    return (
        <>
            <SeoHead
                title="Hair & Body Care Rituals in Uganda"
                description="Explore coordinated Ellena hair and body care rituals in Uganda, arranged in the order they work best together."
                canonicalPath="/rituals"
            />
            <section className="relative flex min-h-[680px] items-end overflow-hidden bg-stone-900 pt-[108px] text-white">
                <div className="absolute inset-0">
                    <StoreImage
                        src="/images/campaign/ellena-rituals-dark.png"
                        alt="Ellena hair and body ritual"
                        className="object-cover"
                        loading="eager"
                    />
                </div>
                <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/75 via-black/35 to-black/10" />
                <div className="store-container relative z-20 w-full py-20 md:py-28">
                    <div className="max-w-2xl">
                        <p className="eyebrow text-white/70">
                            Layered care, considered together
                        </p>
                        <h1 className="hero-heading mt-6">
                            Your ritual,
                            <br /> beautifully resolved.
                        </h1>
                        <p className="mt-7 max-w-xl text-base leading-8 text-white/75">
                            Guided combinations for hair and body, arranged in
                            the order they work best. Add the complete product
                            set in one step and receive automatic ritual
                            savings.
                        </p>
                        <a
                            href="#ritual-edits"
                            className="button-light mt-10 inline-flex items-center gap-3"
                        >
                            Explore the rituals <ArrowRight size={15} />
                        </a>
                    </div>
                </div>
            </section>

            <section className="border-b border-brand-pink/70 bg-brand-blush">
                <div className="store-container grid gap-8 py-12 md:grid-cols-3 md:py-16">
                    {[
                        [
                            '01',
                            'Expert sequence',
                            'Each formula is arranged in a clear, useful order.',
                        ],
                        [
                            '02',
                            'Complete-set savings',
                            'Savings apply automatically while the full ritual stays in your bag.',
                        ],
                        [
                            '03',
                            'Flexible care',
                            'Use the complete product set or revisit individual formulas whenever you need.',
                        ],
                    ].map(([number, title, copy]) => (
                        <div key={number} className="flex gap-5">
                            <span className="font-serif text-2xl text-stone-400">
                                {number}
                            </span>
                            <div>
                                <h2 className="font-serif text-xl">{title}</h2>
                                <p className="mt-2 text-sm leading-6 text-stone-600">
                                    {copy}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <main id="ritual-edits" className="scroll-mt-28">
                {rituals.map((ritual, index) => (
                    <section
                        key={ritual.id}
                        className={index % 2 ? 'bg-brand-blush' : 'bg-ivory'}
                    >
                        <div className="store-container store-section grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
                            <div
                                className={`lg:col-span-6 ${index % 2 ? 'lg:col-start-7' : 'lg:col-start-1'}`}
                            >
                                <div className="relative aspect-[4/5] overflow-hidden bg-stone-200 shadow-[0_24px_70px_rgba(45,37,28,.12)]">
                                    <StoreImage
                                        src={ritual.image}
                                        alt={ritual.name}
                                        className="object-cover transition duration-[1800ms] hover:scale-[1.025]"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-7 pt-24 text-white">
                                        <p className="eyebrow text-white/65">
                                            {ritual.products.length} formulas ·{' '}
                                            {Number(ritual.discount_percent)}%
                                            ritual saving
                                        </p>
                                        <p className="mt-3 font-serif text-3xl">
                                            {ritual.name}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`lg:col-span-5 lg:row-start-1 ${index % 2 ? 'lg:col-start-1' : 'lg:col-start-8'}`}
                            >
                                <p className="eyebrow text-stone-500">
                                    {ritual.eyebrow}
                                </p>
                                <h2 className="section-heading mt-5">
                                    {ritual.name}
                                </h2>
                                <p className="body-copy mt-6">
                                    {ritual.description}
                                </p>

                                <div className="mt-9 border-y border-black/15">
                                    {ritual.products.map(
                                        (product, productIndex) => (
                                            <div
                                                key={product.id}
                                                className="grid grid-cols-[42px_56px_1fr_auto] items-center gap-3 border-b border-black/10 py-4 last:border-b-0 sm:grid-cols-[48px_64px_1fr_auto] sm:gap-4"
                                            >
                                                <span className="font-serif text-xl text-stone-400">
                                                    {String(
                                                        productIndex + 1,
                                                    ).padStart(2, '0')}
                                                </span>
                                                <StoreImage
                                                    src={product.images?.[0]}
                                                    alt=""
                                                    className="object-contain object-center p-1 mix-blend-multiply"
                                                    wrapperClassName="aspect-[3/4] bg-[#faf9f7]"
                                                />
                                                <div className="min-w-0">
                                                    <Link
                                                        href={`/products/${product.slug}`}
                                                        className="font-serif text-lg hover:text-stone-500"
                                                    >
                                                        {product.name}
                                                    </Link>
                                                    <p className="mt-1 line-clamp-2 text-[10px] leading-5 text-stone-500">
                                                        {product.pivot
                                                            ?.instruction ??
                                                            product.subtitle}
                                                    </p>
                                                </div>
                                                <span className="text-xs font-semibold">
                                                    {money(product.price)}
                                                </span>
                                            </div>
                                        ),
                                    )}
                                </div>

                                {ritual.steps && ritual.steps.length > 0 && (
                                    <div className="mt-8">
                                        <p className="eyebrow">The method</p>
                                        <div className="mt-4 space-y-3">
                                            {ritual.steps.map((step) => (
                                                <p
                                                    key={step}
                                                    className="flex gap-3 text-sm leading-6 text-stone-600"
                                                >
                                                    <Check
                                                        size={15}
                                                        className="mt-1 shrink-0"
                                                    />
                                                    {step}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-9 border border-brand-gold/40 bg-white/70 p-6 shadow-[0_14px_38px_rgba(143,40,74,.06)]">
                                    <div className="flex items-end justify-between gap-5">
                                        <div>
                                            <p className="eyebrow text-emerald-700">
                                                Save {money(ritual.savings)} as
                                                a complete product set
                                            </p>
                                            <div className="mt-3 flex items-center gap-3">
                                                <span className="font-serif text-3xl">
                                                    {money(ritual.bundle_price)}
                                                </span>
                                                <span className="text-sm text-stone-400 line-through">
                                                    {money(
                                                        ritual.regular_price,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <Sparkles
                                            className="text-brand-gold"
                                            size={22}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => addRitual(ritual)}
                                        disabled={
                                            !ritual.is_available ||
                                            addingRitual === ritual.id
                                        }
                                        className="button-dark mt-6 flex w-full items-center justify-center gap-3 disabled:cursor-not-allowed disabled:opacity-45"
                                    >
                                        {addingRitual === ritual.id ? (
                                            <LoaderCircle
                                                className="animate-spin"
                                                size={15}
                                            />
                                        ) : (
                                            <Layers3 size={15} />
                                        )}
                                        {addingRitual === ritual.id
                                            ? 'Adding ritual…'
                                            : ritual.is_available
                                              ? 'Add complete ritual'
                                              : 'Ritual currently unavailable'}
                                    </button>
                                    <p className="mt-3 text-center text-[9px] leading-5 tracking-wider text-stone-500 uppercase">
                                        Savings remain while every ritual item
                                        stays in your bag
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                ))}
            </main>

            {rituals.length === 0 && (
                <section className="store-container py-28 text-center">
                    <Layers3 className="mx-auto text-stone-400" size={32} />
                    <h2 className="section-heading mt-5">
                        New rituals are being composed.
                    </h2>
                    <Link href="/shop" className="button-dark mt-8">
                        Shop individual formulas
                    </Link>
                </section>
            )}
        </>
    );
}

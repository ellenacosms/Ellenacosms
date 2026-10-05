import { Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Clock3,
    Copy,
    Share2,
} from 'lucide-react';
import { useState } from 'react';
import ProductCard from '@/components/store/product-card';
import SeoHead from '@/components/store/seo-head';
import StoreImage from '@/components/store/store-image';
import type { BeautyGuide } from '@/types';

export default function BeautyGuideShow({
    guide,
    related,
}: {
    guide: BeautyGuide;
    related: BeautyGuide[];
}) {
    const [copied, setCopied] = useState(false);
    const articleUrl =
        typeof window === 'undefined'
            ? `/beauty-guide/${guide.slug}`
            : window.location.href;
    const structuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: guide.title,
            description: guide.seo_description || guide.excerpt,
            image: guide.hero_image,
            datePublished: guide.published_at,
            mainEntityOfPage: `/beauty-guide/${guide.slug}`,
            articleSection: guide.category_label,
        },
        ...(guide.faqs?.length
            ? [
                  {
                      '@context': 'https://schema.org',
                      '@type': 'FAQPage',
                      mainEntity: guide.faqs.map((faq) => ({
                          '@type': 'Question',
                          name: faq.question,
                          acceptedAnswer: {
                              '@type': 'Answer',
                              text: faq.answer,
                          },
                      })),
                  },
              ]
            : []),
    ];

    const copyLink = async () => {
        await navigator.clipboard.writeText(articleUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    };

    const nativeShare = async () => {
        if (navigator.share)
            await navigator.share({
                title: guide.title,
                text: guide.excerpt,
                url: articleUrl,
            });
        else await copyLink();
    };

    return (
        <>
            <SeoHead
                title={guide.seo_title || guide.title}
                description={guide.seo_description || guide.excerpt}
                canonicalPath={`/beauty-guide/${guide.slug}`}
                image={guide.hero_image}
                structuredData={structuredData}
            />
            <article>
                <header className="store-container pt-40 pb-10 md:pt-48 md:pb-14">
                    <Link href="/beauty-guide" className="text-link">
                        <ArrowLeft size={13} /> Beauty guide
                    </Link>
                    <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                        <div className="max-w-4xl">
                            <p className="eyebrow text-gold">
                                {guide.eyebrow || guide.category_label}
                            </p>
                            <h1 className="display-heading mt-5">
                                {guide.title}
                            </h1>
                            <p className="body-copy mt-6 max-w-2xl">
                                {guide.excerpt}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-2 text-xs text-stone-500">
                                <Clock3 size={14} /> {guide.read_minutes} min
                                read
                            </span>
                            <button
                                type="button"
                                onClick={nativeShare}
                                className="grid h-10 w-10 place-items-center rounded-full border border-brand-pink bg-white hover:border-brand-gold"
                                aria-label="Share guide"
                            >
                                <Share2 size={15} />
                            </button>
                            <button
                                type="button"
                                onClick={copyLink}
                                className="grid h-10 w-10 place-items-center rounded-full border border-brand-pink bg-white hover:border-brand-gold"
                                aria-label="Copy guide link"
                            >
                                {copied ? (
                                    <Check size={15} />
                                ) : (
                                    <Copy size={15} />
                                )}
                            </button>
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(`${guide.title} ${articleUrl}`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full border border-brand-pink bg-white px-4 py-3 text-[9px] font-semibold tracking-[.12em] uppercase hover:border-brand-gold"
                            >
                                WhatsApp
                            </a>
                        </div>
                    </div>
                </header>

                <StoreImage
                    src={guide.hero_image}
                    alt={guide.title}
                    className="object-cover"
                    wrapperClassName="mx-auto min-h-[440px] max-h-[720px] max-w-[1500px] bg-brand-blush"
                />

                <div className="store-container grid gap-14 py-16 md:py-24 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="max-w-3xl">
                        <p className="font-serif text-2xl leading-10 text-stone-800 first-letter:float-left first-letter:mr-3 first-letter:text-7xl first-letter:leading-[.8] first-letter:text-brand-rose">
                            {guide.body}
                        </p>
                        {guide.sections?.map((section, index) => (
                            <section
                                key={section.heading}
                                className="mt-14 border-t border-brand-pink pt-10"
                            >
                                <p className="eyebrow text-gold">
                                    0{index + 1} · Consider this
                                </p>
                                <h2 className="subsection-heading mt-4">
                                    {section.heading}
                                </h2>
                                <p className="mt-5 text-base leading-8 text-stone-600">
                                    {section.body}
                                </p>
                            </section>
                        ))}
                        {guide.steps?.length ? (
                            <section className="mt-14 bg-brand-rose p-7 text-white sm:p-10">
                                <p className="eyebrow text-brand-gold">
                                    The method
                                </p>
                                <h2 className="subsection-heading mt-4">
                                    A ritual to follow.
                                </h2>
                                <ol className="mt-8 space-y-6">
                                    {guide.steps.map((step, index) => (
                                        <li
                                            key={step}
                                            className="grid grid-cols-[36px_1fr] gap-4 border-t border-white/15 pt-6"
                                        >
                                            <span className="font-serif text-xl text-brand-gold">
                                                0{index + 1}
                                            </span>
                                            <span className="text-sm leading-7 text-white/80">
                                                {step}
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            </section>
                        ) : null}
                    </div>
                    <aside>
                        <div className="sticky top-40 border border-brand-pink bg-brand-blush p-6">
                            <p className="eyebrow text-gold">In this guide</p>
                            <p className="mt-4 font-serif text-2xl">
                                {guide.category_label}
                            </p>
                            <p className="mt-4 text-sm leading-6 text-stone-600">
                                Practical advice created to help you choose and
                                use your Ellena care with confidence.
                            </p>
                            <Link
                                href="/find-your-ellena"
                                className="button-dark mt-6 w-full"
                            >
                                Find your ritual
                            </Link>
                        </div>
                    </aside>
                </div>

                {guide.products?.length ? (
                    <section className="border-y border-brand-pink bg-brand-blush">
                        <div className="store-container store-section">
                            <p className="eyebrow text-gold">From the guide</p>
                            <h2 className="section-heading mt-4">
                                Products for this ritual.
                            </h2>
                            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
                                {guide.products.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                    />
                                ))}
                            </div>
                        </div>
                    </section>
                ) : null}

                {guide.faqs?.length ? (
                    <section className="store-container store-section max-w-4xl">
                        <p className="eyebrow text-gold">Good to know</p>
                        <h2 className="section-heading mt-4">
                            Frequently asked.
                        </h2>
                        <div className="mt-9 divide-y divide-brand-pink border-y border-brand-pink">
                            {guide.faqs.map((faq) => (
                                <details
                                    key={faq.question}
                                    className="group py-6"
                                >
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-serif text-2xl">
                                        {faq.question}
                                        <span className="text-brand-rose transition group-open:rotate-45">
                                            +
                                        </span>
                                    </summary>
                                    <p className="max-w-2xl pt-4 text-sm leading-7 text-stone-600">
                                        {faq.answer}
                                    </p>
                                </details>
                            ))}
                        </div>
                    </section>
                ) : null}

                {related.length > 0 && (
                    <section className="store-container pb-20 md:pb-28">
                        <div className="flex items-end justify-between gap-5">
                            <div>
                                <p className="eyebrow">Continue reading</p>
                                <h2 className="section-heading mt-4">
                                    Related guidance.
                                </h2>
                            </div>
                            <Link href="/beauty-guide" className="text-link">
                                All guides <ArrowRight size={13} />
                            </Link>
                        </div>
                        <div className="mt-9 grid gap-5 md:grid-cols-3">
                            {related.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/beauty-guide/${item.slug}`}
                                    className="group"
                                >
                                    <StoreImage
                                        src={item.hero_image}
                                        alt={item.title}
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        wrapperClassName="aspect-[4/3] bg-brand-blush"
                                    />
                                    <p className="eyebrow text-gold mt-5">
                                        {item.category_label}
                                    </p>
                                    <h3 className="mt-3 font-serif text-3xl leading-tight">
                                        {item.title}
                                    </h3>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </article>
        </>
    );
}

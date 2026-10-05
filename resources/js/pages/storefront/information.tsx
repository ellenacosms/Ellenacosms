import { Link, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    ChevronDown,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import SeoHead from '@/components/store/seo-head';

type InformationPage = 'about' | 'contact' | 'delivery-returns' | 'faqs';

const supportEmail = 'ellenacosms@gmail.com';
const contactPhone = '0730247868';
const contactPhoneHref = 'tel:0730247868';
const mapUrl =
    'https://www.google.com/maps/search/?api=1&query=Galiraaya%20Commercial%20Plaza%2C%20Kampala%2C%20Uganda';
const mapEmbedUrl =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.7584200414963!2d32.573778374802195!3d0.31396129968296277!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x177dbc822d76d0c9%3A0x4c890c558460cc44!2sGaliraaya%20Commercial%20Plaza!5e0!3m2!1sen!2sug!4v1787393629255!5m2!1sen!2sug';

const faqs = [
    {
        question: 'How do I choose the right formula?',
        answer: 'Start with the concern you would most like to address, then browse the Hair Care, Body Care, or Rituals collections. Each product page explains its benefits and how to use it. If you would like a second opinion, our concierge is happy to guide you.',
    },
    {
        question: 'How can I pay for my order?',
        answer: 'When you are ready to place your order, secure payment options are shown during checkout. Your final order total is confirmed before payment is requested.',
    },
    {
        question: 'When will I receive my order?',
        answer: 'Your delivery options and final delivery cost are shown at checkout before you complete your purchase. We will keep you informed using the contact details supplied with your order.',
    },
    {
        question: 'Can I change an order after placing it?',
        answer: 'Contact our concierge as soon as possible with your order details. We will check what is possible before your order is prepared or dispatched.',
    },
    {
        question: 'What if an item arrives damaged or is not right for me?',
        answer: 'Please contact us promptly with your order number and a clear photo where relevant. Our team will review the order and guide you through the next step.',
    },
    {
        question: 'How do I hear about new rituals and launches?',
        answer: 'Join the private list in the footer. You can choose email updates and, if you wish, opt in separately to WhatsApp product and offer updates.',
    },
];

const pageDetails: Record<
    InformationPage,
    { title: string; description: string }
> = {
    about: {
        title: 'About Ellena',
        description:
            'Discover the care, intention, and ritual behind Ellena Beauty.',
    },
    contact: {
        title: 'Contact & help',
        description:
            'Get thoughtful support with an Ellena order or product choice.',
    },
    'delivery-returns': {
        title: 'Delivery & returns',
        description:
            'Helpful information about your Ellena order, delivery, and order support.',
    },
    faqs: {
        title: 'Frequently asked questions',
        description:
            'Answers to common questions about Ellena products and orders.',
    },
};

export default function Information({
    page,
    supportEmail: configuredSupportEmail = supportEmail,
}: {
    page: InformationPage;
    supportEmail?: string;
}) {
    const details = pageDetails[page];

    return (
        <>
            <SeoHead
                title={details.title}
                description={details.description}
                canonicalPath={`/${page === 'delivery-returns' ? 'delivery-returns' : page}`}
            />
            <section className="bg-brand-blush px-5 pt-40 pb-20 text-center md:pt-44 md:pb-24">
                <p className="eyebrow">Ellena products</p>
                <h1 className="display-heading mx-auto mt-5 max-w-3xl">
                    {details.title}
                </h1>
                <p className="body-copy mx-auto mt-5 max-w-xl">
                    {details.description}
                </p>
            </section>
            {page === 'about' && <About />}
            {page === 'contact' && (
                <Contact supportEmail={configuredSupportEmail} />
            )}
            {page === 'delivery-returns' && (
                <DeliveryReturns supportEmail={configuredSupportEmail} />
            )}
            {page === 'faqs' && <Faqs supportEmail={configuredSupportEmail} />}
        </>
    );
}

function About() {
    const principles = [
        [
            'Care, considered',
            'Everyday essentials made to turn care into a considered moment.',
        ],
        [
            'Ritual over rush',
            'A collection designed to be layered, enjoyed, and returned to.',
        ],
        [
            'Guidance that helps',
            'Clear product information to make choosing a formula feel simple.',
        ],
    ];

    return (
        <>
            <section className="store-container store-section grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
                <div>
                    <p className="eyebrow text-gold">Our point of view</p>
                    <h2 className="section-heading mt-4">
                        Beauty, made part of your everyday.
                    </h2>
                </div>
                <div className="body-copy space-y-6">
                    <p>
                        Ellena is a Kampala-based beauty destination for
                        thoughtful hair, body, and everyday care. We bring
                        together products that are practical, enjoyable to use,
                        and easy to choose with confidence.
                    </p>
                    <p>
                        Our collections are organised around real moments of
                        care: nourishing lengths, softening skin, defining a
                        style, protecting your family, or taking a little time
                        for yourself. Whether you are buying for home, a salon,
                        or resale, we want every choice to feel clear and well
                        supported.
                    </p>
                    <Link href="/shop" className="button-dark mt-3 inline-flex">
                        Explore the collection <ArrowRight size={15} />
                    </Link>
                </div>
            </section>

            <section className="border-y border-brand-pink/70 bg-brand-blush">
                <div className="store-container grid gap-px md:grid-cols-3">
                    <article className="bg-brand-blush px-1 py-10 md:px-10">
                        <Building2 size={19} className="text-brand-rose" />
                        <p className="eyebrow text-gold mt-6">What we offer</p>
                        <h2 className="mt-3 font-serif text-3xl">
                            Care for every routine.
                        </h2>
                        <p className="mt-4 text-sm leading-7 text-stone-600">
                            Hair care, body care, fragrance, baby care, and
                            thoughtful rituals for everyday life.
                        </p>
                    </article>
                    <article className="border-y border-brand-pink/70 bg-brand-blush px-1 py-10 md:border-x md:border-y-0 md:px-10">
                        <MapPin size={19} className="text-brand-rose" />
                        <p className="eyebrow text-gold mt-6">Visit us</p>
                        <h2 className="mt-3 font-serif text-3xl">
                            Kampala CBD.
                        </h2>
                        <p className="mt-4 text-sm leading-7 text-stone-600">
                            Find our wholesale point at Galiraaya Commercial
                            Plaza, Level 2, Room 342.
                        </p>
                    </article>
                    <article className="bg-brand-blush px-1 py-10 md:px-10">
                        <MessageSquare size={19} className="text-brand-rose" />
                        <p className="eyebrow text-gold mt-6">Guidance</p>
                        <h2 className="mt-3 font-serif text-3xl">
                            Help when you need it.
                        </h2>
                        <p className="mt-4 text-sm leading-7 text-stone-600">
                            Contact us for product advice, order support,
                            wholesale enquiries, and reseller information.
                        </p>
                    </article>
                </div>
            </section>
            <section className="border-y border-brand-pink/70 bg-brand-blush">
                <div className="store-container grid gap-px py-0 md:grid-cols-3">
                    {principles.map(([title, copy]) => (
                        <article
                            key={title}
                            className="border-brand-pink/70 bg-brand-blush px-1 py-12 md:border-r md:px-10 md:last:border-r-0"
                        >
                            <Sparkles size={18} className="text-brand-gold" />
                            <h3 className="mt-6 font-serif text-3xl">
                                {title}
                            </h3>
                            <p className="mt-4 text-sm leading-7 text-stone-600">
                                {copy}
                            </p>
                        </article>
                    ))}
                </div>
            </section>
            <section className="store-container store-section grid gap-10 lg:grid-cols-2 lg:gap-20">
                <article>
                    <p className="eyebrow text-gold">Our mission</p>
                    <h2 className="subsection-heading mt-4">
                        Make everyday beauty feel more considered.
                    </h2>
                    <p className="mt-5 max-w-lg text-sm leading-7 text-stone-600">
                        We are building a collection that makes choosing and
                        enjoying hair and body care feel simple, personal, and
                        rewarding.
                    </p>
                </article>
                <article>
                    <p className="eyebrow text-gold">Our vision</p>
                    <h2 className="subsection-heading mt-4">
                        Confidence, in every ritual.
                    </h2>
                    <p className="mt-5 max-w-lg text-sm leading-7 text-stone-600">
                        Ellena exists to be a trusted companion for the care
                        that helps you feel polished, comfortable, and entirely
                        yourself.
                    </p>
                </article>
            </section>

            <section className="store-container pb-20 md:pb-28">
                <div className="grid overflow-hidden border border-brand-pink bg-white lg:grid-cols-[.9fr_1.1fr]">
                    <div className="bg-brand-rose p-7 text-white sm:p-10">
                        <p className="eyebrow text-brand-gold">Find Ellena</p>
                        <h2 className="mt-4 font-serif text-4xl leading-tight">
                            Visit our Kampala wholesale point.
                        </h2>
                        <p className="mt-6 text-sm leading-7 text-white/80">
                            Galiraaya Commercial Plaza, Level 2, Room 342,
                            Kampala, Uganda.
                        </p>
                        <p className="mt-5 text-sm leading-7 text-white/80">
                            Call before visiting for product availability, bulk
                            orders, salon supply, or pickup guidance.
                        </p>
                        <div className="mt-8 space-y-4 text-sm">
                            <a
                                href={`mailto:${supportEmail}`}
                                className="flex items-center gap-3 hover:text-brand-gold"
                            >
                                <Mail size={17} /> {supportEmail}
                            </a>
                            <a
                                href={contactPhoneHref}
                                className="flex items-center gap-3 hover:text-brand-gold"
                            >
                                <Phone size={17} /> {contactPhone}
                            </a>
                        </div>
                        <a
                            href={mapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-9 inline-flex items-center gap-2 border-b border-brand-gold pb-2 text-[10px] font-semibold tracking-[.14em] text-brand-gold uppercase"
                        >
                            Open in Google Maps <ArrowRight size={13} />
                        </a>
                    </div>
                    <div className="relative min-h-[360px] bg-[#f8edf0]">
                        <iframe
                            title="Ellena at Galiraaya Commercial Plaza"
                            src={mapEmbedUrl}
                            className="absolute inset-0 h-full w-full border-0"
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                        />
                    </div>
                </div>
            </section>
        </>
    );
}

function Contact({ supportEmail }: { supportEmail: string }) {
    const contactForm = useForm({
        name: '',
        email: '',
        phone: '',
        topic: 'product-advice',
        order_number: '',
        preferred_contact_method: 'email',
        message: '',
        website: '',
    });
    const locations = [
        {
            title: 'Kampala, Garilaaya Plaza,Wholesale Point Level 2- Room 342',
            detail: 'Bulk order collection and stockist enquiries',
            tag: 'Wholesale',
            mapUrl,
        },
    ];

    return (
        <section className="store-container store-section">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
                <form
                    className="border border-brand-pink bg-white/70 p-6 sm:p-8"
                    onSubmit={(event) => {
                        event.preventDefault();
                        contactForm.post('/contact', {
                            preserveScroll: true,
                            onSuccess: () => contactForm.reset(),
                        });
                    }}
                >
                    <MessageSquare size={21} className="text-brand-rose" />
                    <p className="eyebrow text-gold mt-7">Contact concierge</p>
                    <h2 className="subsection-heading mt-4">
                        Tell us what you need.
                    </h2>
                    <p className="mt-5 max-w-lg text-sm leading-7 text-stone-600">
                        Use the form for product advice, order support, delivery
                        questions, wholesale requests, or partnership
                        conversations.
                    </p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        <ContactField
                            label="Full name"
                            error={contactForm.errors.name}
                        >
                            <input
                                type="text"
                                required
                                autoComplete="name"
                                value={contactForm.data.name}
                                onChange={(event) =>
                                    contactForm.setData(
                                        'name',
                                        event.target.value,
                                    )
                                }
                                className="contact-input"
                                placeholder="Your name"
                            />
                        </ContactField>
                        <ContactField
                            label="Email address"
                            error={contactForm.errors.email}
                        >
                            <input
                                type="email"
                                required
                                autoComplete="email"
                                value={contactForm.data.email}
                                onChange={(event) =>
                                    contactForm.setData(
                                        'email',
                                        event.target.value,
                                    )
                                }
                                className="contact-input"
                                placeholder="you@example.com"
                            />
                        </ContactField>
                        <ContactField
                            label="Phone or WhatsApp"
                            error={contactForm.errors.phone}
                        >
                            <input
                                type="tel"
                                autoComplete="tel"
                                value={contactForm.data.phone}
                                onChange={(event) =>
                                    contactForm.setData(
                                        'phone',
                                        event.target.value,
                                    )
                                }
                                className="contact-input"
                                placeholder="+256..."
                            />
                        </ContactField>
                        <ContactField
                            label="Order number"
                            error={contactForm.errors.order_number}
                        >
                            <input
                                type="text"
                                value={contactForm.data.order_number}
                                onChange={(event) =>
                                    contactForm.setData(
                                        'order_number',
                                        event.target.value,
                                    )
                                }
                                className="contact-input"
                                placeholder="Optional"
                            />
                        </ContactField>
                        <ContactField
                            label="Topic"
                            error={contactForm.errors.topic}
                        >
                            <select
                                required
                                value={contactForm.data.topic}
                                onChange={(event) =>
                                    contactForm.setData(
                                        'topic',
                                        event.target.value,
                                    )
                                }
                                className="contact-input"
                            >
                                <option value="product-advice">
                                    Product advice
                                </option>
                                <option value="order-support">
                                    Order support
                                </option>
                                <option value="delivery">Delivery</option>
                                <option value="wholesale">
                                    Wholesale / reseller
                                </option>
                                <option value="partnership">Partnership</option>
                                <option value="other">Other</option>
                            </select>
                        </ContactField>
                        <ContactField
                            label="Preferred reply"
                            error={contactForm.errors.preferred_contact_method}
                        >
                            <select
                                required
                                value={
                                    contactForm.data.preferred_contact_method
                                }
                                onChange={(event) =>
                                    contactForm.setData(
                                        'preferred_contact_method',
                                        event.target.value,
                                    )
                                }
                                className="contact-input"
                            >
                                <option value="email">Email</option>
                                <option value="phone">Phone call</option>
                                <option value="whatsapp">WhatsApp</option>
                            </select>
                        </ContactField>
                    </div>
                    <ContactField
                        label="Message"
                        error={contactForm.errors.message}
                        className="mt-4"
                    >
                        <textarea
                            required
                            rows={6}
                            minLength={10}
                            value={contactForm.data.message}
                            onChange={(event) =>
                                contactForm.setData(
                                    'message',
                                    event.target.value,
                                )
                            }
                            className="contact-input resize-none py-3"
                            placeholder="Share the product, order, wholesale quantity, or question you need help with."
                        />
                    </ContactField>
                    <input
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={contactForm.data.website}
                        onChange={(event) =>
                            contactForm.setData('website', event.target.value)
                        }
                        className="absolute -left-[9999px]"
                        aria-hidden="true"
                    />
                    <button
                        type="submit"
                        disabled={contactForm.processing}
                        className="button-dark mt-6"
                    >
                        {contactForm.processing ? 'Sending...' : 'Send message'}
                        <ArrowRight size={15} />
                    </button>
                </form>

                <div className="space-y-6">
                    <div className="border border-brand-pink bg-brand-rose p-6 text-white sm:p-8">
                        <MapPin size={22} className="text-brand-gold" />
                        <p className="eyebrow mt-7 text-brand-gold">
                            Location map
                        </p>
                        <h2 className="subsection-heading mt-4 text-white">
                            Shop and wholesale points.
                        </h2>
                        <p className="mt-5 text-sm leading-7 text-white/75">
                            Find the main Ellena shop location and the wholesale
                            points available for reseller and salon orders.
                        </p>
                        <p className="mt-4 text-xs leading-6 text-white/55">
                            <a
                                href={`mailto:${supportEmail}`}
                                className="hover:text-brand-gold"
                            >
                                {supportEmail}
                            </a>
                            <span className="mx-2 text-white/35">|</span>
                            <a
                                href={contactPhoneHref}
                                className="hover:text-brand-gold"
                            >
                                {contactPhone}
                            </a>
                        </p>
                    </div>
                    <div className="relative min-h-[360px] overflow-hidden border border-brand-pink bg-[#f8edf0]">
                        <iframe
                            title="Galiraaya Commercial Plaza map"
                            src={mapEmbedUrl}
                            className="absolute inset-0 h-full w-full border-0"
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                        />
                        <div className="pointer-events-none absolute right-5 bottom-5 left-5 bg-white/90 p-4 shadow-[0_16px_40px_rgba(43,32,36,.12)] backdrop-blur-sm">
                            <p className="eyebrow text-gold">
                                Galiraaya Commercial Plaza
                            </p>
                            <p className="mt-2 text-sm leading-6 text-stone-600">
                                Kampala, Garilaaya Plaza,Wholesale Point Level 2- Room 342,
                            </p>
                        </div>
                    </div>
                    <div className="grid gap-3">
                        {locations.map((location) => (
                            <article
                                key={location.title}
                                className="flex gap-4 border border-brand-pink bg-white/65 p-5"
                            >
                                <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-blush text-brand-rose">
                                    {location.tag === 'Retail' ? (
                                        <Building2 size={17} />
                                    ) : (
                                        <Phone size={17} />
                                    )}
                                </span>
                                <div>
                                    <p className="text-[10px] font-semibold tracking-[.14em] text-brand-gold-dark uppercase">
                                        {location.tag}
                                    </p>
                                    <h3 className="mt-1 font-serif text-2xl">
                                        {location.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-stone-600">
                                        {location.detail}
                                    </p>
                                    <a
                                        href={location.mapUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-4 inline-flex items-center gap-2 text-[10px] font-semibold tracking-[.14em] text-brand-rose uppercase"
                                    >
                                        Open map
                                        <ArrowRight size={13} />
                                    </a>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function ContactField({
    children,
    className = '',
    error,
    label,
}: {
    children: ReactNode;
    className?: string;
    error?: string;
    label: string;
}) {
    return (
        <label className={`block ${className}`}>
            <span className="text-[10px] font-semibold tracking-[.14em] text-brand-gold-dark uppercase">
                {label}
            </span>
            <div className="mt-2">{children}</div>
            {error && (
                <span className="mt-2 block text-xs text-red-700">{error}</span>
            )}
        </label>
    );
}

function DeliveryReturns({ supportEmail }: { supportEmail: string }) {
    const steps = [
        [
            '1',
            'Checkout with confidence',
            'Review the items, delivery option, and final total before you complete your order.',
        ],
        [
            '2',
            'Watch for updates',
            'We use the contact details provided at checkout to keep you informed about your order.',
        ],
        [
            '3',
            'Need order support?',
            'Email our concierge as soon as possible, including your order number where available.',
        ],
    ];

    return (
        <section className="store-container store-section">
            <div className="mx-auto max-w-3xl text-center">
                <p className="eyebrow text-gold">A considered delivery</p>
                <h2 className="section-heading mt-4">
                    From our ritual to yours.
                </h2>
                <p className="body-copy mx-auto mt-5">
                    Delivery options and the final delivery cost are confirmed
                    at checkout before payment. If you have a question about an
                    order, our concierge can help.
                </p>
            </div>
            <div className="mt-14 grid gap-4 md:grid-cols-3">
                {steps.map(([number, title, copy]) => (
                    <article
                        key={number}
                        className="border border-brand-pink bg-white/55 p-7"
                    >
                        <span className="font-serif text-4xl text-brand-gold">
                            {number}
                        </span>
                        <h3 className="mt-8 font-serif text-2xl">{title}</h3>
                        <p className="mt-4 text-sm leading-7 text-stone-600">
                            {copy}
                        </p>
                    </article>
                ))}
            </div>
            <div className="mt-12 flex flex-col items-start justify-between gap-5 border-y border-brand-pink/70 py-8 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                    <ShieldCheck className="text-brand-rose" />
                    <p className="text-sm leading-6 text-stone-600">
                        For damaged, missing, or unsuitable orders, contact us
                        promptly with your order details.
                    </p>
                </div>
                <Link href="/contact" className="text-link shrink-0">
                    Contact concierge <ArrowRight size={13} />
                </Link>
            </div>
        </section>
    );
}

function Faqs({ supportEmail }: { supportEmail: string }) {
    const [openQuestion, setOpenQuestion] = useState<number | null>(0);

    return (
        <section className="store-container store-section grid gap-12 lg:grid-cols-[.72fr_1.28fr]">
            <div>
                <p className="eyebrow text-gold">Helpful answers</p>
                <h2 className="section-heading mt-4">
                    A little clarity, before you begin.
                </h2>
                <p className="mt-6 max-w-sm text-sm leading-7 text-stone-600">
                    Still need a hand? Our concierge will be pleased to help
                    with a product or order question.
                </p>
                <Link href="/contact" className="button-dark mt-8 inline-flex">
                    Contact us <ArrowRight size={15} />
                </Link>
            </div>
            <div className="border-t border-brand-pink/70">
                {faqs.map((faq, index) => {
                    const open = openQuestion === index;

                    return (
                        <article
                            key={faq.question}
                            className="border-b border-brand-pink/70"
                        >
                            <button
                                type="button"
                                className="flex w-full items-center justify-between gap-6 py-6 text-left font-serif text-xl sm:text-2xl"
                                onClick={() =>
                                    setOpenQuestion(open ? null : index)
                                }
                                aria-expanded={open}
                            >
                                {faq.question}
                                <ChevronDown
                                    size={18}
                                    className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                                />
                            </button>
                            {open && (
                                <p className="max-w-2xl pb-7 text-sm leading-7 text-stone-600">
                                    {faq.answer}
                                </p>
                            )}
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

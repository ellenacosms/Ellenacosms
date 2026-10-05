import { Head, usePage } from '@inertiajs/react';

type StructuredData = Record<string, unknown> | Record<string, unknown>[];

type SeoHeadProps = {
    title: string;
    description: string;
    canonicalPath?: string;
    image?: string;
    imageAlt?: string;
    type?: 'website' | 'product';
    noIndex?: boolean;
    structuredData?: StructuredData;
};

const absoluteUrl = (baseUrl: string, path: string) =>
    /^https?:\/\//.test(path)
        ? path
        : `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

const normaliseSchemaUrls = (value: unknown, baseUrl: string): unknown => {
    if (typeof value === 'string') {
        return value.startsWith('/') ? absoluteUrl(baseUrl, value) : value;
    }

    if (Array.isArray(value)) {
        return value.map((item) => normaliseSchemaUrls(item, baseUrl));
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [
                key,
                normaliseSchemaUrls(item, baseUrl),
            ]),
        );
    }

    return value;
};

export default function SeoHead({
    title,
    description,
    canonicalPath = '/',
    image,
    imageAlt = 'Ellena Beauty products in Uganda',
    type = 'website',
    noIndex = false,
    structuredData,
}: SeoHeadProps) {
    const { seo } = usePage<{
        seo: { siteName: string; baseUrl: string; defaultImage: string };
    }>().props;
    const canonicalUrl = absoluteUrl(seo.baseUrl, canonicalPath);
    const imageUrl = absoluteUrl(seo.baseUrl, image || seo.defaultImage);
    const organization = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: seo.siteName,
        url: seo.baseUrl,
        logo: absoluteUrl(seo.baseUrl, '/brand-logo.png'),
        email: 'ellenacosms@gmail.com',
        telephone: '+256730247868',
    };
    const localBusiness = {
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: seo.siteName,
        url: seo.baseUrl,
        image: absoluteUrl(seo.baseUrl, seo.defaultImage),
        email: 'ellenacosms@gmail.com',
        telephone: '+256730247868',
        priceRange: 'UGX',
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Galiraaya Commercial Plaza, Level 2, Room 342',
            addressLocality: 'Kampala',
            addressCountry: 'UG',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: 0.3139613,
            longitude: 32.5737784,
        },
        hasMap: 'https://www.google.com/maps?q=0.3139613,32.5737784',
        areaServed: { '@type': 'Country', name: 'Uganda' },
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+256730247868',
            contactType: 'customer service',
            email: 'ellenacosms@gmail.com',
            availableLanguage: 'en',
        },
    };
    const website = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: seo.siteName,
        url: seo.baseUrl,
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${seo.baseUrl.replace(/\/$/, '')}/shop?search={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };
    const data = [
        organization,
        localBusiness,
        website,
        ...(structuredData
            ? Array.isArray(structuredData)
                ? structuredData
                : [structuredData]
            : []),
    ];

    return (
        <Head title={title}>
            <meta name="description" content={description} />
            {noIndex && <meta name="robots" content="noindex,follow" />}
            <link rel="canonical" href={canonicalUrl} />
            <meta property="og:site_name" content={seo.siteName} />
            <meta property="og:type" content={type} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:image" content={imageUrl} />
            <meta property="og:image:alt" content={imageAlt} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={imageUrl} />
            <meta name="twitter:image:alt" content={imageAlt} />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(
                        normaliseSchemaUrls(data, seo.baseUrl),
                    ),
                }}
            />
        </Head>
    );
}

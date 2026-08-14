import { Head, usePage } from '@inertiajs/react';

type StructuredData = Record<string, unknown> | Record<string, unknown>[];

type SeoHeadProps = {
    title: string;
    description: string;
    canonicalPath?: string;
    image?: string;
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
    image = '/brand-logo.png',
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
        logo: seo.defaultImage,
    };
    const data = [
        organization,
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
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={imageUrl} />
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

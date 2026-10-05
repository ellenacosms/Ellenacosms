import { useState } from 'react';
import type { ImgHTMLAttributes } from 'react';

type StoreImageProps = ImgHTMLAttributes<HTMLImageElement> & {
    wrapperClassName?: string;
};

export default function StoreImage({
    className = '',
    wrapperClassName = '',
    alt = '',
    onLoad,
    loading = 'lazy',
    decoding = 'async',
    ...props
}: StoreImageProps) {
    const [loaded, setLoaded] = useState(false);

    return (
        <span
            className={`store-image ${loaded ? 'is-loaded' : ''} ${wrapperClassName}`}
        >
            <span className="store-image__placeholder" aria-hidden="true" />
            <img
                {...props}
                alt={alt}
                className={className}
                loading={loading}
                decoding={decoding}
                onLoad={(event) => {
                    setLoaded(true);
                    onLoad?.(event);
                }}
            />
        </span>
    );
}

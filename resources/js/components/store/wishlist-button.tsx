import { router, usePage } from '@inertiajs/react';
import { Heart, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '@/types';

export default function WishlistButton({
    product,
    className = '',
    showLabel = false,
}: {
    product: Pick<Product, 'id' | 'name'>;
    className?: string;
    showLabel?: boolean;
}) {
    const { auth, wishlist_product_ids: wishlistProductIds } = usePage().props;
    const savedOnServer = wishlistProductIds.includes(product.id);
    const [optimisticSaved, setOptimisticSaved] = useState<boolean | null>(
        null,
    );
    const [isUpdating, setIsUpdating] = useState(false);
    const isSaved = optimisticSaved ?? savedOnServer;

    const toggle = () => {
        if (!auth.user) {
            router.visit('/login');

            return;
        }

        const shouldSave = !isSaved;
        setOptimisticSaved(shouldSave);
        setIsUpdating(true);

        const options = {
            preserveScroll: true,
            preserveState: true,
            onError: () => setOptimisticSaved(null),
            onFinish: () => {
                setIsUpdating(false);
                setOptimisticSaved(null);
            },
        };

        if (shouldSave) {
            router.post(`/wishlist/${product.id}`, {}, options);
        } else {
            router.delete(`/wishlist/${product.id}`, options);
        }
    };

    const action = isSaved ? 'Remove from saved ritual' : 'Save to my ritual';

    return (
        <button
            type="button"
            onClick={toggle}
            disabled={isUpdating}
            aria-label={`${action}: ${product.name}`}
            aria-pressed={isSaved}
            title={action}
            className={`inline-flex items-center justify-center gap-2 transition disabled:cursor-wait ${className}`}
        >
            {isUpdating ? (
                <LoaderCircle className="animate-spin" size={17} />
            ) : (
                <Heart size={17} fill={isSaved ? 'currentColor' : 'none'} />
            )}
            {showLabel && <span>{isSaved ? 'Saved' : 'Save ritual'}</span>}
        </button>
    );
}

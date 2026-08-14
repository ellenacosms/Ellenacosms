export default function ProductCardSkeleton() {
    return (
        <div aria-hidden="true">
            <div className="skeleton-shimmer aspect-[3/4]" />
            <div className="mt-5 flex justify-between gap-6">
                <div className="flex-1">
                    <div className="skeleton-shimmer h-2 w-20" />
                    <div className="skeleton-shimmer mt-4 h-5 w-4/5" />
                    <div className="skeleton-shimmer mt-3 h-2 w-28" />
                </div>
                <div className="skeleton-shimmer h-3 w-16" />
            </div>
        </div>
    );
}

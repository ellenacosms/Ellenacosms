import type { Auth } from '@/types/auth';
import type { CartSummary, Category } from '@/types/commerce';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            storeSettings: Record<string, string>;
            storeCategories: Category[];
            cart_count: number;
            cart_summary: CartSummary;
            wishlist_product_ids: number[];
            [key: string]: unknown;
        };
    }
}

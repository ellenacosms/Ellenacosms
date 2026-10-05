export type Category = {
    id: number;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    is_active?: boolean;
    products_count?: number;
};

export type Product = {
    id: number;
    category_id: number;
    category?: Category;
    name: string;
    slug: string;
    sku: string;
    subtitle?: string;
    color?: string;
    size?: string;
    stock_status?: string;
    description: string;
    ingredients?: string;
    usage?: string;
    benefits?: string[];
    concerns?: string[];
    ritual_steps?: string[];
    price: string;
    compare_price?: string;
    stock: number;
    images: string[];
    is_featured: boolean;
    is_active: boolean;
    reviews_avg_rating?: string | number | null;
    reviews_count?: number;
    pivot?: {
        step_order?: number;
        instruction?: string;
        sort_order?: number;
        note?: string;
    };
};

export type BeautyGuide = {
    id: number;
    title: string;
    slug: string;
    category: string;
    category_label: string;
    eyebrow?: string;
    excerpt: string;
    body: string;
    hero_image?: string;
    sections?: Array<{ heading: string; body: string }>;
    steps?: string[];
    faqs?: Array<{ question: string; answer: string }>;
    seo_title?: string;
    seo_description?: string;
    read_minutes: number;
    sort_order: number;
    is_featured: boolean;
    is_published: boolean;
    published_at?: string;
    products_count?: number;
    products?: Product[];
};

export type MerchandisingEdit = {
    slug: string;
    eyebrow: string;
    title: string;
    description: string;
    image: string;
    href: string;
    products_count: number;
};

export type ContactSubmission = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    topic: string;
    order_number?: string | null;
    preferred_contact_method: string;
    message: string;
    read_at?: string | null;
    created_at: string;
    updated_at: string;
};

export type Ritual = {
    id: number;
    name: string;
    slug: string;
    eyebrow?: string;
    description: string;
    image?: string;
    discount_percent: string | number;
    steps?: string[];
    sort_order: number;
    is_featured: boolean;
    is_active: boolean;
    products: Product[];
    regular_price: number;
    bundle_price: number;
    savings: number;
    is_available: boolean;
    products_count?: number;
};

export type CartItem = {
    product: Product;
    quantity: number;
    line_total: number;
};

export type OrderItem = {
    id: number;
    product_id?: number;
    product?: Product;
    product_name: string;
    sku: string;
    price: string;
    quantity: number;
    total: string;
};

export type OrderPaymentEvent = {
    id: number;
    source: string;
    status: string;
    message?: string;
    reference?: string;
    created_at: string;
};

export type Order = {
    delivery_fee_status: string;
    delivery_area?: string;
    currency?: string;
    id: number;
    number: string;
    status: string;
    payment_status: string;
    delivery_method: string;
    estimated_delivery_date?: string;
    payment_method: string;
    payment_provider?: string;
    payment_reference?: string;
    payment_merchant_reference?: string;
    payment_redirect_url?: string;
    payment_confirmation_code?: string;
    payment_status_message?: string;
    paid_at?: string;
    expires_at?: string;
    expired_at?: string;
    resources_released_at?: string;
    payment_checked_at?: string;
    confirmation_sent_at?: string;
    customer_name: string;
    email: string;
    phone?: string;
    address: string;
    city: string;
    country: string;
    notes?: string;
    subtotal: string;
    discount_code?: string;
    discount_amount: string;
    shipping: string;
    total: string;
    created_at: string;
    items?: OrderItem[];
    payment_events?: OrderPaymentEvent[];
};

export type Customer = {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    orders_count?: number;
    orders_sum_total?: string | null;
};

export type Discount = {
    id: number;
    name: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: string;
    minimum_order?: string;
    usage_limit?: number;
    times_used: number;
    starts_at?: string;
    ends_at?: string;
    is_active: boolean;
};

export type Review = {
    id: number;
    product_id: number;
    product?: Product;
    customer_name: string;
    email: string;
    rating: number;
    title?: string;
    body: string;
    is_approved: boolean;
    is_verified_purchase?: boolean;
    created_at: string;
};

export type NewsletterSubscriber = {
    id: number;
    email: string;
    whatsapp_phone?: string | null;
    status: 'pending' | 'confirmed' | 'unsubscribed';
    source: string;
    consent_at: string;
    confirmed_at?: string | null;
    unsubscribed_at?: string | null;
    whatsapp_marketing_opted_in_at?: string | null;
    whatsapp_marketing_opted_out_at?: string | null;
    mailchimp_synced_at?: string | null;
    mailchimp_sync_error?: string | null;
    created_at: string;
};

export type CartDiscount = {
    code: string;
    name: string;
    amount: number;
};

export type BundleDiscount = {
    amount: number;
    rituals: Array<{
        id: number;
        name: string;
        slug: string;
        quantity: number;
        discount_percent: number;
        amount: number;
    }>;
};

export type CartSummary = {
    items: CartItem[];
    count: number;
    subtotal: number;
    discountable_subtotal: number;
    bundle_discount: BundleDiscount | null;
    discount: CartDiscount | null;
    shipping: number;
    total: number;
    free_shipping_threshold: number;
};

export type Banner = {
    id: number;
    name: string;
    placement: 'hero' | 'promotion';
    eyebrow?: string;
    title: string;
    subtitle?: string;
    image: string;
    mobile_image?: string;
    cta_label?: string;
    cta_url?: string;
    text_position: 'left' | 'center' | 'right';
    overlay_opacity: number;
    sort_order: number;
    starts_at?: string;
    ends_at?: string;
    is_active: boolean;
};

export type Pagination<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    prev_page_url?: string;
    next_page_url?: string;
};

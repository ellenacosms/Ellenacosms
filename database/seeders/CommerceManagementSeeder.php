<?php

namespace Database\Seeders;

use App\Models\Banner;
use App\Models\Discount;
use App\Models\Product;
use App\Models\Review;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Database\Seeder;

class CommerceManagementSeeder extends Seeder
{
    public function run(): void
    {
        Discount::updateOrCreate(
            ['code' => 'WELCOME15'],
            [
                'name' => 'Private List Welcome',
                'type' => 'percentage',
                'value' => 15,
                'minimum_order' => 80,
                'usage_limit' => 250,
                'is_active' => true,
            ],
        );

        Discount::updateOrCreate(
            ['code' => 'RITUAL25'],
            [
                'name' => 'Complete Ritual',
                'type' => 'fixed',
                'value' => 25,
                'minimum_order' => 200,
                'usage_limit' => 100,
                'is_active' => true,
            ],
        );

        $product = Product::where('slug', 'radiance-elixir-serum')->first();
        $customer = User::where('email', 'customer@ellena.test')->first();

        if ($product) {
            Review::updateOrCreate(
                ['email' => 'isabella@example.com', 'product_id' => $product->id],
                [
                    'user_id' => $customer?->id,
                    'customer_name' => 'Isabella V.',
                    'rating' => 5,
                    'title' => 'Immediate luminosity',
                    'body' => 'The texture is pure silk on the skin and the luminosity is immediate. It has become the flagship of my evening ritual.',
                    'is_verified_purchase' => true,
                    'is_approved' => true,
                ],
            );

            Review::updateOrCreate(
                ['email' => 'amira@example.com', 'product_id' => $product->id],
                [
                    'customer_name' => 'Amira K.',
                    'rating' => 4,
                    'title' => 'Beautiful texture',
                    'body' => 'A refined serum with a weightless finish. I noticed softer, more rested-looking skin within the first week.',
                    'is_verified_purchase' => false,
                    'is_approved' => false,
                ],
            );
        }

        $settings = [
            'store_name' => 'ELLENA',
            'support_email' => 'concierge@ellena.com',
            'currency' => 'UGX',
            'free_shipping_threshold' => '150',
            'low_stock_threshold' => '10',
            'order_prefix' => 'ELN',
        ];

        foreach ($settings as $key => $value) {
            StoreSetting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        Banner::updateOrCreate(
            ['name' => 'The new ritual'],
            [
                'placement' => 'hero',
                'eyebrow' => 'The new ritual',
                'title' => 'Care, elevated.',
                'subtitle' => 'Discover considered formulas for stronger hair, nourished skin, and everyday rituals.',
                'image' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1En3AHkOc8lM-6Zs9bBC2wLMhvYj9f9cKU9FEiA7uRlM58eig75zY9vezyIk6hOXO9VsW_Hk-FYNMbDHkkqoCtwfQpaZ3XoroGVjBjokIZr4SaVe2l8li8xRlprhr5-JY2jDkSLpPofdr34idabM1e3H9D81MBhe9DknoJ3fZFRzEyrDbcCZfY9ZGhlAHbpsROHRMYmo1Pss6yfs_CfA8YEvFA8NB07MDVlZVadV4lKwgK4fDU1FsLA',
                'cta_label' => 'Explore the collection',
                'cta_url' => '/shop',
                'text_position' => 'left',
                'overlay_opacity' => 20,
                'sort_order' => 1,
                'is_active' => true,
            ],
        );

        Banner::updateOrCreate(
            ['name' => 'Private list welcome'],
            [
                'placement' => 'promotion',
                'eyebrow' => 'Private list',
                'title' => 'A considered beginning.',
                'subtitle' => 'Use WELCOME15 on your first ritual.',
                'image' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuAU3WIWbgCwczq2kR21oEo1D2RKe55uJQXkH4wGzA5w3dUfflgCQ1LGaq7R7ts2FFd-SFmZvypF-nc94zoWPHubd_EsGz44H2IbbH8taPz3RaCZ_1y0m1xgXh7UhMBMhmz_b7eQBpl1ZF1H2p7pddz6jGA5hb14hFT3CGkopWP3G7wrqAtKYdkJT80jujO6jVOo1b_MGSKkaYy5rUtHEtRoqXls-GLr6E5bhbSWGkPL2aZj3AN8xL-kgw',
                'cta_label' => 'Shop now',
                'cta_url' => '/shop',
                'text_position' => 'center',
                'overlay_opacity' => 25,
                'sort_order' => 1,
                'is_active' => true,
            ],
        );

        Banner::updateOrCreate(
            ['name' => 'The hair ritual'],
            [
                'placement' => 'promotion',
                'eyebrow' => 'Hair care',
                'title' => 'Strength begins at the root.',
                'subtitle' => 'Discover scalp-first formulas designed for softer, healthier-looking hair.',
                'image' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1En3AHkOc8lM-6Zs9bBC2wLMhvYj9f9cKU9FEiA7uRlM58eig75zY9vezyIk6hOXO9VsW_Hk-FYNMbDHkkqoCtwfQpaZ3XoroGVjBjokIZr4SaVe2l8li8xRlprhr5-JY2jDkSLpPofdr34idabM1e3H9D81MBhe9DknoJ3fZFRzEyrDbcCZfY9ZGhlAHbpsROHRMYmo1Pss6yfs_CfA8YEvFA8NB07MDVlZVadV4lKwgK4fDU1FsLA',
                'cta_label' => 'Shop hair care',
                'cta_url' => '/shop?category=hair-care',
                'text_position' => 'left',
                'overlay_opacity' => 25,
                'sort_order' => 2,
                'is_active' => true,
            ],
        );
    }
}

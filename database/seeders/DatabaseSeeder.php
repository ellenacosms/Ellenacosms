<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (config('seeding.demo_data')) {
            $adminPassword = (string) config('seeding.admin_password');
            $customerPassword = (string) config('seeding.customer_password');

            if ($adminPassword === '' || $customerPassword === '') {
                throw new \RuntimeException('SEED_ADMIN_PASSWORD and SEED_CUSTOMER_PASSWORD are required when SEED_DEMO_DATA is enabled.');
            }

            User::updateOrCreate(
                ['email' => config('seeding.admin_email')],
                [
                    'name' => 'Ellena Administrator',
                    'password' => $adminPassword,
                    'is_admin' => true,
                    'email_verified_at' => now(),
                ],
            );

            User::updateOrCreate(
                ['email' => config('seeding.customer_email')],
                [
                    'name' => 'Demo Customer',
                    'password' => $customerPassword,
                    'is_admin' => false,
                    'email_verified_at' => now(),
                ],
            );
        }

        $categories = collect([
            ['name' => 'Skin Care', 'slug' => 'skin-care', 'description' => 'High-performance formulas for luminous, resilient skin.', 'image' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1En3AHkOc8lM-6Zs9bBC2wLMhvYj9f9cKU9FEiA7uRlM58eig75zY9vezyIk6hOXO9VsW_Hk-FYNMbDHkkqoCtwfQpaZ3XoroGVjBjokIZr4SaVe2l8li8xRlprhr5-JY2jDkSLpPofdr34idabM1e3H9D81MBhe9DknoJ3fZFRzEyrDbcCZfY9ZGhlAHbpsROHRMYmo1Pss6yfs_CfA8YEvFA8NB07MDVlZVadV4lKwgK4fDU1FsLA'],
            ['name' => 'Makeup', 'slug' => 'makeup', 'description' => 'Modern color, exquisite textures, and confident finishes.', 'image' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdNo9UjgPSBhbKbp0AgnI2kfM_Yv6Jv2VHoytc6I9AbysLsXwLwLnFnxvzgQrI_kn-zjPbOM1QlDY0iRVqv6Uwx3Q0FqVOTi22k2kDBa52a8PVGrg1unXTI_glP0WcHoU_KhO_TqRfus6ObOpnYy65chyPIDXwO8I7k3M4kT4PzAtbPTV-Pt_CPIM3X-CFILlu7dn8aRhGxEI58Q8z4xRcnlqBKzggD5xhF8Vn7Rf_VdyCQ69oQ6sUEQ'],
            ['name' => 'Fragrance', 'slug' => 'fragrance', 'description' => 'Quietly expressive compositions with a lasting signature.', 'image' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuAU3WIWbgCwczq2kR21oEo1D2RKe55uJQXkH4wGzA5w3dUfflgCQ1LGaq7R7ts2FFd-SFmZvypF-nc94zoWPHubd_EsGz44H2IbbH8taPz3RaCZ_1y0m1xgXh7UhMBMhmz_b7eQBpl1ZF1H2p7pddz6jGA5hb14hFT3CGkopWP3G7wrqAtKYdkJT80jujO6jVOo1b_MGSKkaYy5rUtHEtRoqXls-GLr6E5bhbSWGkPL2aZj3AN8xL-kgw'],
        ])->mapWithKeys(fn ($data) => [$data['slug'] => Category::updateOrCreate(['slug' => $data['slug']], $data)]);

        $categoryImages = [
            'hair-care' => '/images/catalog/hair-care-editorial.png',
            'body-care' => '/images/catalog/body-care-editorial.png',
            'rituals' => '/images/catalog/rituals-editorial.png',
        ];

        $categories = collect([
            ['name' => 'Hair Care', 'slug' => 'hair-care', 'description' => 'Performance-led care for stronger, healthier-looking hair.', 'image' => $categoryImages['hair-care']],
            ['name' => 'Body Care', 'slug' => 'body-care', 'description' => 'Sensory essentials for soft, nourished, luminous skin.', 'image' => $categoryImages['body-care']],
            ['name' => 'Rituals', 'slug' => 'rituals', 'description' => 'Layered moments designed to make care feel considered.', 'image' => $categoryImages['rituals']],
        ])->mapWithKeys(fn ($data) => [$data['slug'] => Category::updateOrCreate(['slug' => $data['slug']], $data)]);

        $categoryMap = [
            'skin-care' => 'hair-care',
            'makeup' => 'body-care',
            'fragrance' => 'rituals',
        ];

        $products = [
            [
                'category' => 'skin-care', 'name' => 'Radiance Elixir Serum', 'slug' => 'radiance-elixir-serum',
                'sku' => 'EL-SKN-001', 'subtitle' => 'Concentrated luminosity serum', 'price' => 145, 'stock' => 28, 'featured' => true,
                'description' => 'A revolutionary serum formulated with molecular-precision hyaluronic acid and botanical stem cells to deliver instantaneous luminosity and deep cellular rejuvenation. Designed for discerning skin seeking an aura of pure refinement.',
                'ingredients' => "Multi-Weight Hyaluronic Acid — deeply hydrates through all skin layers.\n\n24K Gold Micro-Flakes — visibly brighten and calm inflammation.\n\nAlpine Rose Stem Cells — support vitality and improve barrier function.",
                'usage' => 'Apply 3–4 drops to cleansed, slightly damp skin. Press into face, neck, and décolletage with upward motions. Follow with moisturizer. Use morning and night.',
                'images' => [
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuAGt6SZkdquq77e5ZBqRm5b_ojbF46GinPUCbL13v1V0bjceLfUKPmvICOTIUZ8osi6SFvxy1JxGi42duZ908act9yPdFOvin7WZ8i603tnWUDUGSVdifDfBu7rEhWhvH1AVKoMQElZ-54CVbswaB8iBXZGaiivD6XvyhA4xTwZgr7ZAcbnrRDi-pFVx_qP_zY2ce_H1Rj57WpFbG7jhGyHDoW8FTI94aVsgromtgur4ozxXhE-m3M-CA',
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuCA1065i138k2_azt3MrePWdIzCZVVo9Yd8IKZgTR2lQptm7eG6lGRCzYHpyHMW2Vh4EiV5qQwiLdPybFxNbryP4c5v8KJ7lm9-sBNPyHnGA_7XvI-AEVOuLQQZZDKX_L5tu7ft-U0qg3HV67kyMTksi9dAebrhPcgnEAbWty9W7vsLRyyJ6H_9UAnkeg-g9mR8pVY90BfyjfYZzxbLdRqWvyfBELiSPIcTO_oqA5cSkz2SxaV4mt52qA',
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuDV0-qqIHM75gnvmeaIRyxzgXzuaha963xNHaGhSKbvmuVEYtMa__7LcxntMozl0GEN5aEoglWlqQhNqO6JlLERQFPurFd-JoBp6X9qZb2Cj8vLTpoEwJZjz9eNLcsxTBvHDCeg40aVk9rciVi7k2xosKyZvLD1DWhvpqWEH7YB7sz7Xh2L_CzBkN6XHIMIsOEgTcDqn50oNNnRM_4CO-BVSDEUCLxxE15dA6PDawGN7Ba3Ohy8Q4Z-EQ',
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuBv8WoUwHpb-d75SFPIYk0XRNAPJuPjTRycGfWBmbVv1XqX_sPqQXA9ym9Z4Ld0EfxaJIMABEZoxdZZc1DxebjpfeQnZexQl2fzzpZ6SU9pPlyphYKlwZoDeKvB3xyo5Vp8cUBjkCVdus-b--Cly9jAsDL3O9yuce75O7K6Sh6BVUdzLvGz6oiIePqVo3OilXCL_jkvMAe3E1DWzYd79B1vePg2gBVvHyiBav5ZFyyszRECSJl2vjSoXg',
                ],
            ],
            [
                'category' => 'makeup', 'name' => 'Velvet Matte Rose', 'slug' => 'velvet-matte-rose', 'sku' => 'EL-MKP-001',
                'subtitle' => 'Signature lipstick', 'price' => 48, 'stock' => 42, 'featured' => true,
                'description' => 'A saturated rose pigment suspended in a featherlight velvet matrix for sculpted color and a softly diffused finish.',
                'ingredients' => 'Camellia oil, rose wax, mineral pigments, and vitamin E.', 'usage' => 'Apply directly from the bullet or use a lip brush for precise definition.',
                'images' => ['https://lh3.googleusercontent.com/aida-public/AB6AXuBeqPKeIsqFx1pUx0bmQdm7Tc7kl9Tfi6_eHqLSlm7gw7Zc7sQrkNApFV22Mm-vahXYgpsOH2iAeDPMg4T_8xxZtJ_-sJI38G37S0iyrOSRaHuG4vcrs2ymHFsAVO_9kzj4tOw5rzvD77fLKrHqqvduUFiJ0yNe23iY0kXG4vzCC3Ffz8N9vRQZsDkIKjjqn7I1dGvgbCh18sS9Va0IPx4Z6wKBKUOQLWmdteYHVIu8Gk_W4pSs53ipYw'],
            ],
            [
                'category' => 'skin-care', 'name' => 'Midnight Recovery Cream', 'slug' => 'midnight-recovery-cream', 'sku' => 'EL-SKN-002',
                'subtitle' => 'Restorative night care', 'price' => 120, 'stock' => 8, 'featured' => true,
                'description' => 'A cocooning night treatment that helps replenish lipids, soothe visible stress, and restore morning radiance.',
                'ingredients' => 'Ceramide complex, ectoin, squalane, and blue tansy.', 'usage' => 'Massage a pearl-sized amount over face and neck as the final step in your evening ritual.',
                'images' => ['https://lh3.googleusercontent.com/aida-public/AB6AXuAiFiPc3X3UDcMM68TWuGU4kmHFjpBkwKOke1pV3erlICgMa4dToUsQ4ZFEGt9i5J0z2a7gGruW7MryAzGfYbA64jzCwqswH0Rkg3uzokv6tLlQ2rat9jYR12YEgQjzxpk-2LfEevouHCx86wFDcZ-Va1JbKvH12BQv8T9tRZYNmdtGA6j6xvB6A9w0nV7sBmQkz51CkccTGIBaaYvFRQeoQBLsLD4XQFweGC9KDssHI2ydS1pfJM0VCQ'],
            ],
            [
                'category' => 'skin-care', 'name' => 'Hydra Veil Mist', 'slug' => 'hydra-veil-mist', 'sku' => 'EL-SKN-003',
                'subtitle' => 'Refreshing essence toner', 'price' => 62, 'stock' => 34, 'featured' => true,
                'description' => 'An ultrafine mineral mist that layers weightless hydration and restores fresh luminosity throughout the day.',
                'ingredients' => 'Hyaluronic acid, mineral water, snow mushroom, and panthenol.', 'usage' => 'Mist over clean skin before serum, or over makeup whenever skin needs replenishment.',
                'images' => ['https://lh3.googleusercontent.com/aida-public/AB6AXuBcyWmq4-Hw8E608Fmv-kr1I_v3X9rYA7KACp2BzG04BdQjxjAln9BPB4EtfmhH2ehsFvqXkNFYSIKZ0FyPLxjVo8f9UfS_wFgxeD3-5ELN7SxaLPImAeEhlVpQAjmh3KDys6Fb6870R2DnynXRxjeoyh9J78vxeC7If8qSEfeC9F6NcKVZ7dt6swvrZ7u_Vn0tvbxPz6dd7q5rOmfxeVa9SJzBRlNEGG0dVD0K-IoiJd3DI7Fm2m8h6w'],
            ],
            [
                'category' => 'makeup', 'name' => 'Silk Canvas Primer', 'slug' => 'silk-canvas-primer', 'sku' => 'EL-MKP-002',
                'subtitle' => 'Perfecting base', 'price' => 85, 'stock' => 19,
                'description' => 'A breathable, soft-focus veil that smooths texture and extends makeup wear without masking the skin.',
                'ingredients' => 'Silk powder, niacinamide, glycerin, and white peony.', 'usage' => 'Press a small amount over moisturized skin, concentrating on areas where texture is visible.',
                'images' => ['https://lh3.googleusercontent.com/aida-public/AB6AXuAkIwxG9RYOxXgXlVk4l7x5-UPT23XUjDQWIvlpsqle-uUeAcZrshJebKxDX-Him-0LLvUkV_F-6vYnCtOp6FGLGhCZMTTdmcvRI7haunCVyKuMT5mAoKx8wW8_OKJth2s10UukG-_vjOAyGjZ0HEYx9xwEbx_S3GchAJVzdDpBv0xpYhrIglDi0T6WcZmg02-VJ7KmxhfRgn07NxKz3Or0p7Ec8bqnXCTU-NNcVM1af0FXIslMk3e08g'],
            ],
            [
                'category' => 'skin-care', 'name' => 'Rose Gold Cleansing Oil', 'slug' => 'rose-gold-cleansing-oil', 'sku' => 'EL-SKN-004',
                'subtitle' => 'Infused nourishment', 'price' => 72, 'stock' => 25,
                'description' => 'A silken botanical oil that dissolves makeup and daily impurities, rinsing clean without disturbing the skin barrier.',
                'ingredients' => 'Rosehip, camellia, meadowfoam, and bisabolol.', 'usage' => 'Massage onto dry skin, emulsify with warm water, and rinse thoroughly.',
                'images' => ['https://lh3.googleusercontent.com/aida-public/AB6AXuDRefjRuy6IPFmSbFOM0szSpjoBRevRrGzG_gQnJz6QDZoXScbuMqb959Ty7SRznxcW4V1UhWd0fpXWXFvmVqBwsZXihakNooZymoQmOJUVVWspfayCbbRkMtRvurWc6kH1qjQGVVCKbw7BWhsJd-IiyVapXU2oxbgL9yj46nW4dFb468hLBV_R6qoFbueSgMKpUGtDofJ3MfKvh9Swbu6GvQNBiL-PlKwbNGNbkSGupO9Ktr8r43wTuw'],
            ],
            [
                'category' => 'skin-care', 'name' => 'Peptide Lip Treatment', 'slug' => 'peptide-lip-treatment', 'sku' => 'EL-SKN-005',
                'subtitle' => 'Barrier support', 'price' => 38, 'stock' => 3,
                'description' => 'A cushiony, non-sticky lip treatment that visibly smooths, nourishes, and restores supple comfort.',
                'ingredients' => 'Palmitoyl tripeptide, shea butter, ceramides, and hyaluronic acid.', 'usage' => 'Apply throughout the day and as a generous overnight treatment.',
                'images' => ['https://lh3.googleusercontent.com/aida-public/AB6AXuA6-rOklK9eGZ2ethmdUep5RAU_VKEcUs1d_DA7tj_Jp5MFCaTqQYqcMBawCyoRNy1nCrpoBvnVNntuxk87WPcu6XqLFjp-1KjeK1Que93dzCsrIKIl8-2e9lqPUqgd7Q9r4r_JKzZBgzj5uWxp4WaPNzLDeb92OHiWRs9uJArdjTesIjtMQO5QTwgnX2rbTIOvnkVYPBrKSZYDtxIbF-6mWX3WusHKVhVxez46K9ktIPiT_x2q0WHmAw'],
            ],
            [
                'category' => 'fragrance', 'name' => 'No. 01 Santal Lumière', 'slug' => 'no-01-santal-lumiere', 'sku' => 'EL-FRG-001',
                'subtitle' => 'Eau de parfum', 'price' => 165, 'stock' => 14,
                'description' => 'A luminous study in sandalwood, opening with bergamot before settling into iris, skin musk, and polished woods.',
                'ingredients' => 'Bergamot, orris, sandalwood, ambrette, and white musk.', 'usage' => 'Mist onto pulse points and allow the composition to evolve naturally on skin.',
                'images' => ['https://lh3.googleusercontent.com/aida-public/AB6AXuAU3WIWbgCwczq2kR21oEo1D2RKe55uJQXkH4wGzA5w3dUfflgCQ1LGaq7R7ts2FFd-SFmZvypF-nc94zoWPHubd_EsGz44H2IbbH8taPz3RaCZ_1y0m1xgXh7UhMBMhmz_b7eQBpl1ZF1H2p7pddz6jGA5hb14hFT3CGkopWP3G7wrqAtKYdkJT80jujO6jVOo1b_MGSKkaYy5rUtHEtRoqXls-GLr6E5bhbSWGkPL2aZj3AN8xL-kgw'],
            ],
        ];

        foreach ($products as $product) {
            Product::updateOrCreate(
                ['slug' => $product['slug']],
                [
                    'category_id' => $categories[$categoryMap[$product['category']] ?? $product['category']]->id,
                    'name' => $product['name'],
                    'sku' => $product['sku'],
                    'subtitle' => $product['subtitle'],
                    'description' => $product['description'],
                    'ingredients' => $product['ingredients'],
                    'usage' => $product['usage'],
                    'price' => $product['price'],
                    'stock' => $product['stock'],
                    'images' => $product['images'],
                    'is_featured' => $product['featured'] ?? false,
                    'is_active' => true,
                ],
            );
        }

        $demoProductUpdates = [
            'radiance-elixir-serum' => [
                'name' => 'Radiance Elixir Scalp Serum',
                'subtitle' => 'Concentrated scalp nourishment',
                'description' => 'A weightless botanical serum that refreshes the scalp and supports a healthier-looking foundation for stronger, luminous hair.',
                'ingredients' => 'Multi-weight hyaluronic acid, rosemary extract, niacinamide, and alpine rose stem cells.',
                'usage' => 'Apply 3–4 drops to clean sections of the scalp. Massage gently with fingertips and leave in. Use morning or night.',
            ],
            'velvet-matte-rose' => [
                'name' => 'Velvet Body Polish',
                'subtitle' => 'Softening exfoliating polish',
                'description' => 'A cushiony botanical polish that smooths texture and leaves skin soft, supple, and quietly radiant.',
                'ingredients' => 'Rose wax, fine sugar crystals, camellia oil, and vitamin E.',
                'usage' => 'Massage onto damp skin in circular motions, then rinse. Use two to three times weekly.',
            ],
            'midnight-recovery-cream' => [
                'name' => 'Midnight Recovery Hair Mask',
                'subtitle' => 'Restorative overnight hair care',
                'description' => 'A rich overnight mask that replenishes dry lengths, smooths visible damage, and restores softness by morning.',
                'ingredients' => 'Ceramide complex, squalane, blue tansy, and baobab seed oil.',
                'usage' => 'Work through clean, towel-dried lengths and ends. Leave for 10 minutes or overnight, then rinse thoroughly.',
            ],
            'hydra-veil-mist' => [
                'name' => 'Hydra Veil Body Mist',
                'subtitle' => 'Refreshing all-over hydration',
                'description' => 'An ultrafine mist that layers weightless hydration over the body and restores a fresh, luminous finish throughout the day.',
                'ingredients' => 'Hyaluronic acid, mineral water, snow mushroom, and panthenol.',
                'usage' => 'Mist over clean skin after bathing or whenever the body needs a veil of replenishing hydration.',
            ],
            'silk-canvas-primer' => [
                'name' => 'Silk Canvas Body Oil',
                'subtitle' => 'Soft-focus nourishing oil',
                'description' => 'A breathable body oil that smooths the look of texture and leaves skin with a soft, luminous finish.',
                'ingredients' => 'Silk powder, jojoba oil, niacinamide, and white peony.',
                'usage' => 'Press a small amount into damp skin after bathing, concentrating on areas that need extra softness.',
            ],
            'rose-gold-cleansing-oil' => [
                'name' => 'Rose Gold Body Cleansing Oil',
                'subtitle' => 'Silken daily cleanse',
                'description' => 'A silken botanical oil that cleanses without stripping, leaving the body comfortable, soft, and lightly scented.',
                'ingredients' => 'Rosehip, camellia, meadowfoam, and bisabolol.',
                'usage' => 'Massage onto damp skin, emulsify with warm water, and rinse thoroughly.',
            ],
            'peptide-lip-treatment' => [
                'name' => 'Peptide Hand Treatment',
                'subtitle' => 'Barrier-support hand care',
                'description' => 'A cushiony, non-sticky treatment that visibly smooths, nourishes, and restores supple comfort to dry hands.',
                'ingredients' => 'Palmitoyl tripeptide, shea butter, ceramides, and hyaluronic acid.',
                'usage' => 'Apply throughout the day and as a generous overnight treatment.',
            ],
            'no-01-santal-lumiere' => [
                'name' => 'No. 01 Santal Body Mist',
                'subtitle' => 'Aromatic body veil',
                'description' => 'A luminous sandalwood body mist that opens with bergamot before settling into iris, skin musk, and polished woods.',
                'ingredients' => 'Bergamot, orris, sandalwood, ambrette, and white musk.',
                'usage' => 'Mist onto clean skin after bathing and allow the composition to evolve naturally.',
            ],
        ];

        $demoProductExperience = [
            'radiance-elixir-serum' => [
                'benefits' => ['Refreshes and comforts the scalp', 'Supports stronger-looking hair', 'Delivers weightless hydration'],
                'concerns' => ['Dry scalp', 'Weak roots', 'Dehydrated hair'],
                'ritual_steps' => ['Part clean hair into manageable sections.', 'Apply 3–4 drops directly across the scalp.', 'Massage gently with fingertips and leave in.'],
            ],
            'velvet-matte-rose' => [
                'benefits' => ['Polishes rough texture', 'Leaves skin visibly smoother', 'Replenishes with botanical oils'],
                'concerns' => ['Rough texture', 'Dull skin', 'Dryness'],
                'ritual_steps' => ['Apply to damp skin in the bath or shower.', 'Massage in slow circular motions.', 'Rinse thoroughly and follow with body oil.'],
            ],
            'midnight-recovery-cream' => [
                'benefits' => ['Replenishes dry lengths', 'Smooths visible damage', 'Restores softness by morning'],
                'concerns' => ['Dry hair', 'Breakage', 'Dullness'],
                'ritual_steps' => ['Work through clean, towel-dried lengths and ends.', 'Leave for 10 minutes or wrap hair overnight.', 'Rinse thoroughly and style as usual.'],
            ],
            'hydra-veil-mist' => [
                'benefits' => ['Delivers instant hydration', 'Refreshes without heaviness', 'Leaves a soft luminous finish'],
                'concerns' => ['Dehydration', 'Tightness', 'Dull skin'],
                'ritual_steps' => ['Mist generously over clean body skin.', 'Press in with palms wherever extra hydration is needed.', 'Reapply throughout the day as desired.'],
            ],
            'silk-canvas-primer' => [
                'benefits' => ['Softens the look of texture', 'Seals in post-bath moisture', 'Leaves a satin finish'],
                'concerns' => ['Dryness', 'Uneven texture', 'Loss of radiance'],
                'ritual_steps' => ['Warm a small amount between the palms.', 'Press onto damp skin after bathing.', 'Massage upward until fully absorbed.'],
            ],
            'rose-gold-cleansing-oil' => [
                'benefits' => ['Cleanses without stripping', 'Supports supple comfort', 'Leaves skin lightly conditioned'],
                'concerns' => ['Dry skin', 'Daily buildup', 'Sensitivity'],
                'ritual_steps' => ['Dispense onto damp body skin.', 'Massage until the oil turns lightly milky.', 'Rinse with warm water and pat dry.'],
            ],
            'peptide-lip-treatment' => [
                'benefits' => ['Restores dry hands', 'Supports the skin barrier', 'Absorbs without stickiness'],
                'concerns' => ['Dry hands', 'Rough cuticles', 'Barrier weakness'],
                'ritual_steps' => ['Apply a small amount to clean hands.', 'Massage over palms, fingers, and cuticles.', 'Layer generously before sleep for overnight care.'],
            ],
            'no-01-santal-lumiere' => [
                'benefits' => ['Creates a warm aromatic veil', 'Layers easily with body care', 'Settles into a subtle skin scent'],
                'concerns' => ['Scent layering', 'Evening ritual', 'Mindful pause'],
                'ritual_steps' => ['Mist over clean skin after bathing.', 'Focus on pulse points and the collarbone.', 'Allow the scent to settle before layering oil or cream.'],
            ],
        ];

        foreach ($demoProductUpdates as $slug => $attributes) {
            Product::where('slug', $slug)->first()?->update([
                ...$attributes,
                ...($demoProductExperience[$slug] ?? []),
            ]);
        }

        Category::whereIn('slug', ['skin-care', 'makeup', 'fragrance'])
            ->whereDoesntHave('products')
            ->delete();

        $this->call(CommerceManagementSeeder::class);
        $this->call(RitualSeeder::class);
    }
}

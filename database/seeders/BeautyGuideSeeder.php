<?php

namespace Database\Seeders;

use App\Models\BeautyGuide;
use App\Models\Product;
use Illuminate\Database\Seeder;

class BeautyGuideSeeder extends Seeder
{
    public function run(): void
    {
        $guides = [
            [
                'title' => 'How to build a moisture-first hair ritual',
                'slug' => 'build-a-moisture-first-hair-ritual',
                'category' => 'hair-care',
                'eyebrow' => 'The crown ritual',
                'excerpt' => 'A simple approach to layering moisture, nourishment, and finish without overwhelming your hair.',
                'body' => 'Moisture-first care is less about adding more product and more about placing the right textures in the right order. Begin with clean hair, introduce hydration where it is needed, then seal and style with a considered hand.',
                'hero_image' => '/images/catalog/hair-care-editorial.png',
                'sections' => [
                    ['heading' => 'Read what your hair is asking for', 'body' => 'Dryness can show up as roughness, tangling, dullness, or a lack of flexibility. Start by noticing where those signs appear most—at the scalp, through the lengths, or only at the ends.'],
                    ['heading' => 'Layer from light to rich', 'body' => 'Use lighter hydration first, follow with a treatment where needed, and finish with oil, food, or styling product in smaller amounts. This keeps the ritual effective without unnecessary buildup.'],
                ],
                'steps' => ['Begin on clean, sectioned hair.', 'Apply hydration or treatment through the areas that need it most.', 'Seal the lengths and ends with a small amount of oil or hair food.', 'Style gently and adjust the amount next time based on the finish.'],
                'faqs' => [
                    ['question' => 'How often should I repeat the ritual?', 'answer' => 'Begin weekly, then adjust according to your hair, styling schedule, and how long softness lasts.'],
                    ['question' => 'Can I use both hair food and oil?', 'answer' => 'Yes. Apply the richer food first and use a small amount of oil to finish, focusing on the driest areas.'],
                ],
                'read_minutes' => 5,
                'sort_order' => 1,
                'is_featured' => true,
                'product_category' => 'hair-care',
            ],
            [
                'title' => 'Hair food, oil, gel, or pomade?',
                'slug' => 'choose-hair-food-oil-gel-or-pomade',
                'category' => 'hair-care',
                'eyebrow' => 'Choose your texture',
                'excerpt' => 'Understand what each texture contributes so you can choose with more confidence.',
                'body' => 'Each hair texture has a different role. Hair food supports nourishment, oil adds slip and shine, gel creates definition and hold, while pomade brings control and polish. Your best choice depends on the result you want today.',
                'hero_image' => '/images/campaign/ellena-hair-care-dark.png',
                'sections' => [
                    ['heading' => 'Care before control', 'body' => 'When hair feels dry, begin with nourishment before reaching for hold. Styling products perform more beautifully when the hair beneath them feels cared for.'],
                    ['heading' => 'Use less, then build', 'body' => 'Start with a small amount and add only where needed. This preserves movement and makes it easier to understand how each formula behaves on your hair.'],
                ],
                'steps' => ['Name the finish you want: softness, shine, definition, or control.', 'Choose the texture designed for that finish.', 'Warm a small amount between the hands.', 'Apply in sections and build gradually.'],
                'faqs' => [['question' => 'Which texture is best for protective styles?', 'answer' => 'Choose nourishment beneath the style, then use gel or pomade only where definition and control are required.']],
                'read_minutes' => 4,
                'sort_order' => 2,
                'is_featured' => false,
                'product_category' => 'hair-care',
            ],
            [
                'title' => 'Body lotion, oil, or both?',
                'slug' => 'body-lotion-oil-or-both',
                'category' => 'body-care',
                'eyebrow' => 'Body care, explained',
                'excerpt' => 'Learn how texture and layering can make your everyday body-care ritual work harder.',
                'body' => 'Lotion brings accessible daily moisture, while oil creates a more sensorial seal and luminous finish. Used together, they can turn a quick post-bath step into a longer-lasting ritual of comfort.',
                'hero_image' => '/images/catalog/body-care-editorial.png',
                'sections' => [
                    ['heading' => 'Choose lotion for everyday ease', 'body' => 'Lotion spreads quickly and is a natural starting point when skin needs straightforward, all-over comfort.'],
                    ['heading' => 'Choose oil for seal and finish', 'body' => 'Oil works beautifully over slightly damp skin or layered after lotion where you want extra softness and luminosity.'],
                ],
                'steps' => ['Pat the skin after bathing, leaving it slightly damp.', 'Apply lotion in long, even strokes.', 'Press oil onto drier areas or anywhere you want a more luminous finish.'],
                'faqs' => [['question' => 'Which goes first, lotion or oil?', 'answer' => 'Apply lotion first, then use oil to seal and finish.']],
                'read_minutes' => 4,
                'sort_order' => 3,
                'is_featured' => true,
                'product_category' => 'body-care',
            ],
            [
                'title' => 'A gentle baby bath-time ritual',
                'slug' => 'gentle-baby-bath-time-ritual',
                'category' => 'baby-care',
                'eyebrow' => 'Gentle beginnings',
                'excerpt' => 'A calm, uncomplicated sequence for cleansing and comforting delicate skin.',
                'body' => 'Baby care benefits from simplicity. Keep the water comfortably warm, choose mild textures, and make every movement slow and reassuring. A short, consistent sequence is often all that is needed.',
                'hero_image' => '/images/campaign/ellena-family-care-banner.png',
                'sections' => [['heading' => 'Keep the ritual simple', 'body' => 'Use only what the moment requires and avoid changing several products at once, making it easier to notice how delicate skin responds.']],
                'steps' => ['Prepare everything before bath time begins.', 'Cleanse gently with comfortably warm water.', 'Pat rather than rub the skin dry.', 'Apply a small amount of comforting moisture where needed.'],
                'faqs' => [['question' => 'Does every bath need a full routine?', 'answer' => 'No. Keep the ritual responsive, gentle, and as simple as the day requires.']],
                'read_minutes' => 3,
                'sort_order' => 4,
                'is_featured' => false,
                'product_category' => 'baby-care',
            ],
            [
                'title' => 'How to layer body care and fragrance',
                'slug' => 'layer-body-care-and-fragrance',
                'category' => 'fragrance',
                'eyebrow' => 'The finishing ritual',
                'excerpt' => 'Build a subtle scent story that begins with cared-for skin and finishes at the pulse points.',
                'body' => 'Fragrance layering should feel composed rather than crowded. Begin with softly scented or neutral body care, allow each texture to settle, then place fragrance where warmth helps it unfold naturally.',
                'hero_image' => '/images/catalog/rituals-editorial.png',
                'sections' => [['heading' => 'Create a quiet foundation', 'body' => 'Moisturized skin can hold fragrance beautifully. Choose a body texture that complements rather than competes with the notes you want to wear.']],
                'steps' => ['Apply body lotion or oil and allow it to settle.', 'Mist fragrance at the wrists, collarbone, or behind the ears.', 'Avoid rubbing the fragrance into the skin.', 'Revisit after several minutes before deciding whether to add more.'],
                'faqs' => [['question' => 'Can body mist and perfume be worn together?', 'answer' => 'Yes. Keep one layer lighter and choose notes that share a similar mood or family.']],
                'read_minutes' => 4,
                'sort_order' => 5,
                'is_featured' => true,
                'product_category' => 'fragrance',
            ],
        ];

        foreach ($guides as $data) {
            $productCategory = $data['product_category'];
            unset($data['product_category']);

            $guide = BeautyGuide::updateOrCreate(
                ['slug' => $data['slug']],
                [...$data, 'is_published' => true, 'published_at' => now()->subDay()],
            );

            $products = Product::available()
                ->whereHas('category', fn ($query) => $query->where('slug', $productCategory))
                ->orderByDesc('is_featured')
                ->orderBy('name')
                ->take(4)
                ->pluck('id');

            $guide->products()->sync($products->values()->mapWithKeys(fn (int $id, int $index) => [
                $id => ['sort_order' => $index + 1, 'note' => $index === 0 ? 'A considered starting point for this guide.' : null],
            ])->all());
        }
    }
}

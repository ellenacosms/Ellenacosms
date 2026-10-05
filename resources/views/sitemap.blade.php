<?php echo '<?xml version="1.0" encoding="UTF-8"?>'; ?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    <url><loc>{{ url('/') }}</loc></url>
    <url><loc>{{ route('shop') }}</loc></url>
    <url><loc>{{ route('rituals.index') }}</loc></url>
    <url><loc>{{ route('finder') }}</loc></url>
    <url><loc>{{ route('discover') }}</loc></url>
    <url><loc>{{ route('beauty-guide') }}</loc></url>
    <url><loc>{{ route('about') }}</loc></url>
    <url><loc>{{ route('contact') }}</loc></url>
    <url><loc>{{ route('delivery-returns') }}</loc></url>
    <url><loc>{{ route('faqs') }}</loc></url>
    @foreach ($categories as $category)
    <url><loc>{{ route('shop', ['category' => $category->slug]) }}</loc><lastmod>{{ $category->updated_at->toAtomString() }}</lastmod></url>
    @endforeach
    @foreach ($products as $product)
    <url>
        <loc>{{ route('products.show', $product) }}</loc>
        <lastmod>{{ $product->updated_at->toAtomString() }}</lastmod>
        @foreach ($product->images ?? [] as $image)
        <image:image><image:loc>{{ url($image) }}</image:loc></image:image>
        @endforeach
    </url>
    @endforeach
    @foreach ($beautyGuides as $guide)
    <url><loc>{{ route('beauty-guide.show', $guide) }}</loc><lastmod>{{ $guide->updated_at->toAtomString() }}</lastmod></url>
    @endforeach
</urlset>

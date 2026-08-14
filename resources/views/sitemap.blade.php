<?php echo '<?xml version="1.0" encoding="UTF-8"?>'; ?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>{{ url('/') }}</loc></url>
    <url><loc>{{ route('shop') }}</loc></url>
    <url><loc>{{ route('rituals.index') }}</loc></url>
    @foreach ($categories as $category)
    <url><loc>{{ route('shop', ['category' => $category->slug]) }}</loc><lastmod>{{ $category->updated_at->toAtomString() }}</lastmod></url>
    @endforeach
    @foreach ($products as $product)
    <url><loc>{{ route('products.show', $product) }}</loc><lastmod>{{ $product->updated_at->toAtomString() }}</lastmod></url>
    @endforeach
</urlset>

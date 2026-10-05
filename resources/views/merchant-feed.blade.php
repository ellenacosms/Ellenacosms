<?php echo '<?xml version="1.0" encoding="UTF-8"?>'; ?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
    <channel>
        <title>{{ config('app.name') }} product feed</title>
        <link>{{ url('/') }}</link>
        <description>Ellena Beauty products available in Uganda.</description>
        @foreach ($products as $product)
        <item>
            <g:id>{{ $product->sku ?: $product->id }}</g:id>
            <g:title>{{ $product->name }}</g:title>
            <g:description>{{ $product->description }}</g:description>
            <g:link>{{ route('products.show', $product) }}</g:link>
            @if (filled($product->images[0] ?? null))
            <g:image_link>{{ url($product->images[0]) }}</g:image_link>
            @endif
            @foreach (array_slice($product->images ?? [], 1, 10) as $image)
            <g:additional_image_link>{{ url($image) }}</g:additional_image_link>
            @endforeach
            <g:availability>{{ $product->stock > 0 ? 'in_stock' : 'out_of_stock' }}</g:availability>
            <g:price>{{ number_format((float) $product->price, 2, '.', '') }} UGX</g:price>
            <g:condition>new</g:condition>
            <g:brand>Ellena Beauty</g:brand>
            <g:identifier_exists>false</g:identifier_exists>
            @if ($product->category)
            <g:product_type>{{ $product->category->name }}</g:product_type>
            @endif
            <g:shipping>
                <g:country>UG</g:country>
                <g:service>Standard delivery</g:service>
            </g:shipping>
        </item>
        @endforeach
    </channel>
</rss>

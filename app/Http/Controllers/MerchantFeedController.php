<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Response;

class MerchantFeedController extends Controller
{
    public function __invoke(): Response
    {
        return response()
            ->view('merchant-feed', [
                'products' => Product::available()
                    ->with('category:id,name')
                    ->orderBy('id')
                    ->get(['id', 'category_id', 'name', 'slug', 'sku', 'description', 'price', 'stock', 'images']),
            ])
            ->header('Content-Type', 'application/xml; charset=UTF-8');
    }
}

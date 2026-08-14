<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('color', 190)->nullable()->after('subtitle');
            $table->string('size', 80)->nullable()->after('color');
            $table->string('stock_status', 80)->nullable()->after('stock');
            $table->decimal('wholesale_price', 10, 2)->nullable()->after('compare_price');
            $table->unsignedInteger('wholesale_min_qty')->nullable()->after('wholesale_price');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'color',
                'size',
                'stock_status',
                'wholesale_price',
                'wholesale_min_qty',
            ]);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->uuid('checkout_token')->nullable()->unique()->after('payment_status');
            $table->string('delivery_method')->default('standard')->after('country');
            $table->date('estimated_delivery_date')->nullable()->after('delivery_method');
            $table->string('payment_method')->default('manual_confirmation')->after('payment_status');
            $table->string('payment_provider')->nullable()->after('payment_method');
            $table->string('payment_reference')->nullable()->after('payment_provider');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique(['checkout_token']);
            $table->dropColumn([
                'checkout_token',
                'delivery_method',
                'estimated_delivery_date',
                'payment_method',
                'payment_provider',
                'payment_reference',
            ]);
        });
    }
};

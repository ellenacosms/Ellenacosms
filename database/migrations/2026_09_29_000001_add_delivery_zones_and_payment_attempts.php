<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_zones', function (Blueprint $table) {
            $table->id();
            $table->string('country', 100);
            $table->string('district', 100);
            $table->string('area', 100);
            $table->decimal('fee', 12, 2)->nullable();
            $table->unsignedSmallInteger('minimum_days')->default(1);
            $table->unsignedSmallInteger('maximum_days')->default(3);
            $table->decimal('free_above', 12, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['country', 'district', 'area']);
        });
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('delivery_zone_id')->nullable()->constrained()->nullOnDelete();
            $table->string('delivery_area')->nullable();
            // Existing orders retain their agreed shipping charge.
            $table->string('delivery_fee_status')->default('confirmed');
            $table->string('currency', 3)->nullable();
        });
        Schema::create('payment_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->uuid('request_id')->unique();
            $table->string('reference')->nullable()->unique();
            $table->string('provider');
            $table->string('status')->default('initiating');
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3);
            $table->text('client_secret')->nullable();
            $table->string('publishable_key')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_attempts');
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('delivery_zone_id');
            $table->dropColumn(['delivery_area', 'delivery_fee_status', 'currency']);
        });
        Schema::dropIfExists('delivery_zones');
    }
};

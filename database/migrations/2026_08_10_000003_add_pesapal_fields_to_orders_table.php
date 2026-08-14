<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_merchant_reference')->nullable()->unique()->after('payment_reference');
            $table->text('payment_redirect_url')->nullable()->after('payment_merchant_reference');
            $table->string('payment_confirmation_code')->nullable()->after('payment_merchant_reference');
            $table->text('payment_status_message')->nullable()->after('payment_confirmation_code');
            $table->timestamp('paid_at')->nullable()->after('payment_status_message');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique(['payment_merchant_reference']);
            $table->dropColumn([
                'payment_merchant_reference',
                'payment_redirect_url',
                'payment_confirmation_code',
                'payment_status_message',
                'paid_at',
            ]);
        });
    }
};

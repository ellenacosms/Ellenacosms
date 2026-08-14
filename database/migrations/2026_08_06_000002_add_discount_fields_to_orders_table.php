<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->foreignId('discount_id')->nullable()->after('payment_status')->constrained()->nullOnDelete();
            $table->string('discount_code')->nullable()->after('discount_id');
            $table->decimal('discount_amount', 10, 2)->default(0)->after('discount_code');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropForeign(['discount_id']);
            $table->dropColumn(['discount_id', 'discount_code', 'discount_amount']);
        });
    }
};

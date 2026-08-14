<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->timestamp('expires_at')->nullable()->after('paid_at')->index();
            $table->timestamp('expired_at')->nullable()->after('expires_at');
            $table->timestamp('resources_released_at')->nullable()->after('expired_at');
            $table->timestamp('payment_checked_at')->nullable()->after('resources_released_at')->index();
            $table->timestamp('confirmation_sent_at')->nullable()->after('payment_checked_at');
        });

        Schema::create('order_payment_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('source', 40);
            $table->string('status', 40);
            $table->text('message')->nullable();
            $table->string('reference')->nullable();
            $table->timestamps();
            $table->index(['order_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_payment_events');

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['expires_at']);
            $table->dropIndex(['payment_checked_at']);
            $table->dropColumn([
                'expires_at',
                'expired_at',
                'resources_released_at',
                'payment_checked_at',
                'confirmation_sent_at',
            ]);
        });
    }
};

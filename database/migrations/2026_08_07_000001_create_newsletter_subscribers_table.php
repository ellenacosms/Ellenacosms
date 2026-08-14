<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('newsletter_subscribers', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('status', 24)->default('pending')->index();
            $table->string('source', 50)->default('footer');
            $table->char('confirmation_token_hash', 64)->unique();
            $table->char('consent_ip_hash', 64)->nullable();
            $table->timestamp('consent_at');
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('unsubscribed_at')->nullable();
            $table->timestamp('mailchimp_synced_at')->nullable();
            $table->text('mailchimp_sync_error')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('newsletter_subscribers');
    }
};

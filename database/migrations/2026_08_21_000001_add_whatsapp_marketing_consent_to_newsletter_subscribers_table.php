<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('newsletter_subscribers', function (Blueprint $table) {
            $table->string('whatsapp_phone', 32)->nullable()->after('email');
            $table->timestamp('whatsapp_marketing_opted_in_at')->nullable()->index()->after('consent_at');
            $table->timestamp('whatsapp_marketing_opted_out_at')->nullable()->index()->after('whatsapp_marketing_opted_in_at');
            $table->string('whatsapp_marketing_opt_in_source', 50)->nullable()->after('whatsapp_marketing_opted_out_at');
        });
    }

    public function down(): void
    {
        Schema::table('newsletter_subscribers', function (Blueprint $table) {
            $table->dropColumn([
                'whatsapp_phone',
                'whatsapp_marketing_opted_in_at',
                'whatsapp_marketing_opted_out_at',
                'whatsapp_marketing_opt_in_source',
            ]);
        });
    }
};

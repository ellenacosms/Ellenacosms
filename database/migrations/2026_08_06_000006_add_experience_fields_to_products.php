<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->json('benefits')->nullable()->after('usage');
            $table->json('concerns')->nullable()->after('benefits');
            $table->json('ritual_steps')->nullable()->after('concerns');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['benefits', 'concerns', 'ritual_steps']);
        });
    }
};

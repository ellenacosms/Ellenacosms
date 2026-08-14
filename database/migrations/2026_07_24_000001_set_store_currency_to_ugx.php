<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('store_settings')) {
            return;
        }

        DB::table('store_settings')->updateOrInsert(
            ['key' => 'currency'],
            [
                'value' => 'UGX',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );
    }

    public function down(): void
    {
        if (! Schema::hasTable('store_settings')) {
            return;
        }

        DB::table('store_settings')
            ->where('key', 'currency')
            ->where('value', 'UGX')
            ->update(['value' => 'USD', 'updated_at' => now()]);
    }
};

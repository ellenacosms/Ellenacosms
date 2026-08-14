<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $duplicates = DB::table('reviews')
            ->select('product_id', 'user_id')
            ->whereNotNull('user_id')
            ->groupBy('product_id', 'user_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $duplicate) {
            $duplicateIds = DB::table('reviews')
                ->where('product_id', $duplicate->product_id)
                ->where('user_id', $duplicate->user_id)
                ->orderByDesc('id')
                ->skip(1)
                ->pluck('id');

            DB::table('reviews')->whereIn('id', $duplicateIds)->delete();
        }

        Schema::table('reviews', function (Blueprint $table): void {
            $table->unique(['product_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table): void {
            $table->dropUnique('reviews_product_id_user_id_unique');
        });
    }
};

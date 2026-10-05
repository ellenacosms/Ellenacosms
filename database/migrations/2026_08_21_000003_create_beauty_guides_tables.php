<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('beauty_guides', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('category', 50)->index();
            $table->string('eyebrow')->nullable();
            $table->text('excerpt');
            $table->longText('body');
            $table->string('hero_image', 2048)->nullable();
            $table->json('sections')->nullable();
            $table->json('steps')->nullable();
            $table->json('faqs')->nullable();
            $table->string('seo_title')->nullable();
            $table->string('seo_description', 320)->nullable();
            $table->unsignedTinyInteger('read_minutes')->default(4);
            $table->unsignedSmallInteger('sort_order')->default(0)->index();
            $table->boolean('is_featured')->default(false)->index();
            $table->boolean('is_published')->default(false)->index();
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('beauty_guide_product', function (Blueprint $table) {
            $table->foreignId('beauty_guide_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->string('note')->nullable();

            $table->primary(['beauty_guide_id', 'product_id']);
            $table->index(['beauty_guide_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('beauty_guide_product');
        Schema::dropIfExists('beauty_guides');
    }
};

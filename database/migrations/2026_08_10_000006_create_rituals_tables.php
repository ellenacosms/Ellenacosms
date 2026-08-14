<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rituals', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('eyebrow')->nullable();
            $table->text('description');
            $table->string('image', 2048)->nullable();
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->json('steps')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0)->index();
            $table->boolean('is_featured')->default(false)->index();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('product_ritual', function (Blueprint $table) {
            $table->foreignId('ritual_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('step_order')->default(0);
            $table->string('instruction')->nullable();

            $table->primary(['ritual_id', 'product_id']);
            $table->index(['ritual_id', 'step_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_ritual');
        Schema::dropIfExists('rituals');
    }
};

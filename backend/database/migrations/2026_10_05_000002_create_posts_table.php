<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->string('category');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');
            $table->longText('body');
            $table->json('requirements')->nullable();
            $table->string('poster_path')->nullable();
            $table->string('status')->default('draft');

            // Demonstration content, so a fresh install has something to show
            // locally without ever reaching a resident in production.
            $table->boolean('is_demo')->default(false);

            $table->timestampTz('published_at')->nullable();
            $table->timestampsTz();

            // The landing page's only query: published, dated, newest first.
            $table->index(['status', 'published_at']);
            $table->index(['category', 'status', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};

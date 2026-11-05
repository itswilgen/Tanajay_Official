<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guides', function (Blueprint $table) {
            $table->id();
            $table->string('title', 160);
            $table->string('summary', 280);
            $table->json('steps');
            $table->json('requirements');
            $table->string('fee', 120)->nullable();
            $table->string('processing_time', 120)->nullable();
            $table->string('office', 160);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(false);

            // Demonstration content, so a fresh install has something to show
            // locally without ever reaching a resident in production.
            $table->boolean('is_demo')->default(false);

            $table->timestampsTz();

            $table->index(['is_published', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guides');
    }
};

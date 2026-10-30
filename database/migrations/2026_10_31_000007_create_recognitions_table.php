<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recognitions', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->string('conferred_by', 160);
            $table->unsignedSmallInteger('year');

            // The award's own seal or badge, on the `public` disk. Optional:
            // most recognitions arrive as a certificate, not as artwork.
            $table->string('badge_path')->nullable();

            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(false);

            // Demonstration content, so a fresh install has something to show
            // locally without ever reaching a resident in production.
            $table->boolean('is_demo')->default(false);

            $table->timestampsTz();

            $table->index(['is_published', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recognitions');
    }
};

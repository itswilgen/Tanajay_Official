<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title', 160);
            $table->string('description', 400)->nullable();
            $table->string('venue', 160);
            $table->timestampTz('starts_at');

            // Null for an event that is over the same day. A festival that runs
            // for a week sets it, and stays listed until its last day ends.
            $table->timestampTz('ends_at')->nullable();
            $table->boolean('is_published')->default(false);

            // Demonstration content, so a fresh install has something to show
            // locally without ever reaching a resident in production.
            $table->boolean('is_demo')->default(false);

            $table->timestampsTz();

            $table->index(['is_published', 'starts_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};

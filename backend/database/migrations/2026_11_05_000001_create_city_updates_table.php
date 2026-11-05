<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('city_updates', function (Blueprint $table) {
            $table->id();

            // What kind of development this is, in the city's own words:
            // "City magazine", "Public works", "Environment". Short, because it
            // is set as a badge on the cover artwork and again beside it.
            $table->string('category', 48);

            $table->string('title', 160);

            // Held for the detail route the routes file says is still to be
            // rebuilt. Unique now so the seeder can `updateOrCreate` against it
            // and so no two updates can claim the same future URL.
            $table->string('slug', 180)->unique();

            // The paragraph set beside the cover, as in the reference layout.
            $table->string('standfirst', 320);

            // What "Read more" discloses. There is no detail page yet, so the
            // band opens this in place rather than linking away to nothing.
            $table->text('body');

            // The portrait cover. `poster_path` rather than `cover_path` so the
            // record carries its artwork under the same column name, and
            // through the same HasPoster trait, as notices, events and
            // programmes — the shape of the artwork differs, the contract
            // does not.
            $table->string('poster_path')->nullable();

            // When the office issued it. Nullable, and a date in the future is
            // a scheduled update that must stay off the public band until it
            // arrives — see CityUpdate::released().
            $table->timestampTz('published_at')->nullable();

            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(false);

            // Demonstration content, so a fresh install has something to show
            // locally without ever reaching a resident in production.
            $table->boolean('is_demo')->default(false);

            $table->timestampsTz();

            // The band's own query: published, already released, newest first.
            $table->index(['is_published', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('city_updates');
    }
};

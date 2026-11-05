<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The publicity material an office already makes for an event or a
     * programme — the pubmat it posts on the city's page — so the site can show
     * the same artwork residents have seen. A path on the `public` disk, as
     * `posts.poster_path` is. Optional: plenty of programmes never get one.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('poster_path')->nullable()->after('ends_at');
        });

        Schema::table('programs', function (Blueprint $table) {
            $table->string('poster_path')->nullable()->after('how_to_apply');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('poster_path');
        });

        Schema::table('programs', function (Blueprint $table) {
            $table->dropColumn('poster_path');
        });
    }
};

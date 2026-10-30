<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            // A notice an office has flagged for the alert band under the
            // banner: a class suspension, a typhoon signal, a water
            // interruption. `urgent_until` lets the flag lapse on its own, so
            // yesterday's suspension does not sit at the top of the page
            // because nobody remembered to clear it.
            $table->boolean('is_urgent')->default(false)->after('is_demo');
            $table->timestampTz('urgent_until')->nullable()->after('is_urgent');

            $table->index(['is_urgent', 'urgent_until']);
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex(['is_urgent', 'urgent_until']);
            $table->dropColumn(['is_urgent', 'urgent_until']);
        });
    }
};

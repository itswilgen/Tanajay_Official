<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('officials', function (Blueprint $table) {
            $table->id();
            $table->string('branch', 20);
            $table->string('position', 120);
            // Null while the seat's holder is unconfirmed or the seat is
            // vacant: the position is still worth listing, and a placeholder
            // stored as a name would be drawn as one.
            $table->string('name', 160)->nullable();
            $table->string('photo_path')->nullable();
            $table->string('committee', 200)->nullable();

            // The Mayor and the Vice Mayor: drawn larger, ahead of the council.
            $table->boolean('is_principal')->default(false);

            // A signed message, shown as "From the Mayor's Desk" when it is on
            // an executive principal's record.
            $table->text('message')->nullable();

            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(false);

            // Demonstration content, so a fresh install has something to show
            // locally without ever reaching a resident in production.
            $table->boolean('is_demo')->default(false);

            $table->timestampsTz();

            $table->index(['is_published', 'branch', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('officials');
    }
};

<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

/**
 * Puts a sample poster on the `public` disk and returns the path to store in
 * a record's `poster_path`.
 *
 * The artwork in `assets/posters` was drawn for these samples — type, flat
 * geometry and Lucide pictograms, no photographs and no city seal — and every
 * one is stamped SAMPLE and says it is not an actual announcement. None
 * prints a date, because the sample events are re-dated each time they are
 * seeded. They are copied under `posters/demo/`, apart from the real pubmats
 * an office uploads, because storage is not versioned and the seeder is.
 */
final class DemoPosters
{
    private const DIRECTORY = 'posters/demo';

    public function store(string $name): string
    {
        $path = self::DIRECTORY."/{$name}.webp";

        Storage::disk('public')->put(
            $path,
            File::get(database_path("seeders/assets/posters/{$name}.webp")),
        );

        return $path;
    }
}

<?php

namespace App\Queries;

use App\Models\HeroSlide;
use App\Support\PublicCache;
use Illuminate\Support\Facades\Cache;

/**
 * Banner photographs, in the order the office arranged them.
 *
 * There is deliberately no hard-coded fallback list: a path written into the
 * source cannot be withdrawn by the office that owns the photograph, and the
 * banner is designed to stand on the Mayor's plate alone when nothing is
 * published.
 *
 * Only the file and its alt text are sent. The banner no longer draws a
 * caption, so a slide's category, title and description stay in the table,
 * where the office still writes them, and out of a payload that has nothing to
 * render them with. Send them again when something on the page does.
 */
final class HeroPhotos
{
    /**
     * @return list<array{path: string, alt: string}>
     */
    public function get(): array
    {
        return Cache::remember(
            PublicCache::key('hero-slides'),
            now()->addMinutes(10),
            // array_values, because the page renders this as a JSON array and
            // iterates it. A map that lost its sequential keys would encode as
            // an object instead, and the banner would silently render nothing.
            fn (): array => array_values(
                HeroSlide::query()
                    ->where('is_published', true)
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->get(['id', 'image_path', 'alt_text'])
                    ->map(fn (HeroSlide $slide): array => [
                        'path' => 'storage/'.$slide->image_path,
                        'alt' => $slide->alt_text,
                    ])
                    ->all(),
            ),
        );
    }
}

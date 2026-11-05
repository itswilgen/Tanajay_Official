<?php

namespace App\Queries;

use App\Models\CityUpdate;
use App\Support\PublicCache;
use Illuminate\Support\Facades\Cache;

/**
 * The newest developments in the city, for the band under the banner.
 *
 * `body` is read here, unlike in LatestNotices: the band's "Read more" opens
 * each update in place rather than linking to a detail page, so the text it
 * discloses has to be on the page already. `slug` stays behind until that route
 * exists, for the same reason the notices query withholds it.
 */
final class LatestCityUpdates
{
    /**
     * Four: one featured on the shelf and three beside it. A fifth cover makes
     * the rail scroll, and a band above the fold should not scroll.
     */
    private const LIMIT = 4;

    /**
     * @return list<array{id: int, category: string, title: string, standfirst: string, body: string, cover: string|null, published_at: string|null}>
     */
    public function get(): array
    {
        return Cache::remember(
            PublicCache::key('city-updates'),
            now()->addMinutes(5),
            fn (): array => array_values(
                CityUpdate::query()
                    ->publiclyVisible()
                    ->released()
                    // The office's own arrangement first, so it can hold an
                    // issue at the head of the shelf, and the date only breaks
                    // ties within one rank.
                    ->orderBy('sort_order')
                    ->orderByDesc('published_at')
                    ->orderByDesc('id')
                    ->limit(self::LIMIT)
                    ->get(['id', 'category', 'title', 'standfirst', 'body', 'poster_path', 'published_at'])
                    ->map(fn (CityUpdate $update): array => [
                        'id' => $update->id,
                        'category' => $update->category,
                        'title' => $update->title,
                        'standfirst' => $update->standfirst,
                        'body' => $update->body,
                        // Named for the slot it fills rather than for the
                        // column it comes from: the band sets it as a portrait
                        // magazine cover, not as a 16:9 poster.
                        'cover' => $update->posterUrl(),
                        'published_at' => $update->published_at?->toIso8601String(),
                    ])
                    ->all(),
            ),
        );
    }
}

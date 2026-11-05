<?php

namespace App\Queries;

use App\Models\Post;
use App\Support\PublicCache;
use Illuminate\Support\Facades\Cache;

/**
 * The newest published notices.
 *
 * The payload is listed field by field rather than handed to `toArray()`, so
 * what reaches the browser is a decision made here and not a side effect of
 * the model's casts. `slug` and `body` are deliberately absent: there is no
 * detail page to link to yet, so the landing page states each notice instead
 * of linking it, and shipping an identifier the page cannot use would only
 * invite a link that resolves to nothing. Add them back alongside that route.
 */
final class LatestNotices
{
    /**
     * The landing page is a signpost, not an archive: a handful of notices,
     * the newest first. The listing that carried the rest is being rebuilt.
     */
    private const LIMIT = 5;

    /**
     * @return list<array{id: int, category: string, title: string, description: string, poster: string|null, published_at: string|null}>
     */
    public function get(): array
    {
        return Cache::remember(
            PublicCache::key('notices'),
            now()->addMinutes(2),
            fn (): array => array_values(
                Post::query()
                    ->publiclyVisible()
                    ->orderByDesc('published_at')
                    ->orderByDesc('id')
                    ->limit(self::LIMIT)
                    // `body` is the long form of every notice and nothing here
                    // renders it, so it is not read off the disk either.
                    ->get(['id', 'category', 'title', 'description', 'poster_path', 'published_at'])
                    ->map(fn (Post $notice): array => [
                        'id' => $notice->id,
                        'category' => $notice->category,
                        'title' => $notice->title,
                        'description' => $notice->description,
                        'poster' => $notice->posterUrl(),
                        'published_at' => $notice->published_at?->toIso8601String(),
                    ])
                    ->all(),
            ),
        );
    }
}

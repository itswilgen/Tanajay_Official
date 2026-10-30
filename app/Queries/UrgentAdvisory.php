<?php

namespace App\Queries;

use App\Models\Post;
use App\Support\PublicCache;
use Illuminate\Support\Facades\Cache;

/**
 * The one notice an office has flagged for the alert band under the banner.
 *
 * One, not a ticker: a scrolling strip of several alerts makes a reader wait
 * for the one that concerns them, and moving text is hard to read on a phone.
 * If two are flagged at once the newest wins, and the rest are still in the
 * notices further down the page.
 */
final class UrgentAdvisory
{
    /**
     * @return array{id: int, category: string, title: string, published_at: string|null}|null
     */
    public function get(): ?array
    {
        return Cache::remember(
            PublicCache::key('urgent-advisory'),
            // Short, because the flag can lapse on its own between edits, and
            // nothing bumps the cache version when it does.
            now()->addMinute(),
            function (): ?array {
                $notice = Post::query()
                    ->publiclyVisible()
                    ->currentlyUrgent()
                    ->orderByDesc('published_at')
                    ->orderByDesc('id')
                    ->first(['id', 'category', 'title', 'published_at']);

                return $notice === null ? null : [
                    'id' => $notice->id,
                    'category' => $notice->category,
                    'title' => $notice->title,
                    'published_at' => $notice->published_at?->toIso8601String(),
                ];
            },
        );
    }
}

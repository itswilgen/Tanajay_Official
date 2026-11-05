<?php

namespace App\Queries;

use App\Models\Event;
use App\Support\PublicCache;
use Illuminate\Support\Facades\Cache;

/**
 * The next few public events, soonest first.
 */
final class UpcomingEvents
{
    /**
     * Five: the column beside the notices holds about that many date blocks
     * before it runs longer than the notices it sits next to.
     */
    private const LIMIT = 5;

    /**
     * @return list<array{id: int, title: string, description: string|null, venue: string, starts_at: string, ends_at: string|null, poster: string|null}>
     */
    public function get(): array
    {
        return Cache::remember(
            // Keyed by the day as well as the version: an event drops off at
            // midnight without anybody saving anything, and a cache that only
            // the version counter could clear would keep it up until then.
            PublicCache::key('events:'.now()->toDateString()),
            now()->addMinutes(10),
            fn (): array => array_values(
                Event::query()
                    ->publiclyVisible()
                    ->upcoming()
                    ->orderBy('starts_at')
                    ->orderBy('id')
                    ->limit(self::LIMIT)
                    ->get(['id', 'title', 'description', 'venue', 'starts_at', 'ends_at', 'poster_path'])
                    ->map(fn (Event $event): array => [
                        'id' => $event->id,
                        'title' => $event->title,
                        'description' => $event->description,
                        'venue' => $event->venue,
                        'starts_at' => $event->starts_at->toIso8601String(),
                        'ends_at' => $event->ends_at?->toIso8601String(),
                        'poster' => $event->posterUrl(),
                    ])
                    ->all(),
            ),
        );
    }
}

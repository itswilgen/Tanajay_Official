<?php

namespace App\Queries;

use App\Models\Recognition;
use App\Support\PublicCache;
use Illuminate\Support\Facades\Cache;

/**
 * Awards and seals conferred on the City Government, most recent year first.
 */
final class Recognitions
{
    /**
     * Eight: one row of badges on a wide screen, two on a tablet. An older
     * award past that is history, and belongs on the Awards page.
     */
    private const LIMIT = 8;

    /**
     * @return list<array{id: int, title: string, conferred_by: string, year: int, badge: string|null}>
     */
    public function get(): array
    {
        return Cache::remember(
            PublicCache::key('recognitions'),
            now()->addMinutes(10),
            fn (): array => array_values(
                Recognition::query()
                    ->publiclyVisible()
                    ->orderByDesc('year')
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->limit(self::LIMIT)
                    ->get(['id', 'title', 'conferred_by', 'year', 'badge_path'])
                    ->map(fn (Recognition $recognition): array => [
                        'id' => $recognition->id,
                        'title' => $recognition->title,
                        'conferred_by' => $recognition->conferred_by,
                        'year' => $recognition->year,
                        'badge' => $recognition->badgeUrl(),
                    ])
                    ->all(),
            ),
        );
    }
}

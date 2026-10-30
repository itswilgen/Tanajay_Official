<?php

namespace App\Queries;

use App\Models\Guide;
use App\Support\PublicCache;
use Illuminate\Support\Facades\Cache;

/**
 * The "How do I…" guides, in the order the office arranged them.
 */
final class CitizenGuides
{
    /**
     * Six: the tasks people most often come to City Hall for. Past that the
     * section stops being a shortcut and becomes a directory, which is a page
     * of its own.
     */
    private const LIMIT = 6;

    /**
     * @return list<array{id: int, title: string, summary: string, steps: list<string>, requirements: list<string>, fee: string|null, processing_time: string|null, office: string}>
     */
    public function get(): array
    {
        return Cache::remember(
            PublicCache::key('guides'),
            now()->addMinutes(10),
            fn (): array => array_values(
                Guide::query()
                    ->publiclyVisible()
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->limit(self::LIMIT)
                    ->get()
                    ->map(fn (Guide $guide): array => [
                        'id' => $guide->id,
                        'title' => $guide->title,
                        'summary' => $guide->summary,
                        'steps' => $guide->steps,
                        'requirements' => $guide->requirements,
                        'fee' => $guide->fee,
                        'processing_time' => $guide->processing_time,
                        'office' => $guide->office,
                    ])
                    ->all(),
            ),
        );
    }
}

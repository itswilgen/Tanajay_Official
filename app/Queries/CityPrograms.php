<?php

namespace App\Queries;

use App\Models\Program;
use App\Support\PublicCache;
use Illuminate\Support\Facades\Cache;

/**
 * The city's standing programmes, in the order the office arranged them.
 */
final class CityPrograms
{
    /**
     * Six, for the same reason as the guides: past that it is a directory,
     * and a directory is a page of its own.
     */
    private const LIMIT = 6;

    /**
     * @return list<array{id: int, title: string, summary: string, audience: string, office: string, how_to_apply: string, poster: string|null}>
     */
    public function get(): array
    {
        return Cache::remember(
            PublicCache::key('programs'),
            now()->addMinutes(10),
            fn (): array => array_values(
                Program::query()
                    ->publiclyVisible()
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->limit(self::LIMIT)
                    ->get(['id', 'title', 'summary', 'audience', 'office', 'how_to_apply', 'poster_path'])
                    ->map(fn (Program $program): array => [
                        'id' => $program->id,
                        'title' => $program->title,
                        'summary' => $program->summary,
                        'audience' => $program->audience,
                        'office' => $program->office,
                        'how_to_apply' => $program->how_to_apply,
                        'poster' => $program->posterUrl(),
                    ])
                    ->all(),
            ),
        );
    }
}

<?php

namespace App\Queries;

use App\Enums\Branch;
use App\Models\Official;
use App\Support\PublicCache;
use Illuminate\Support\Facades\Cache;

/**
 * The city's elected officials: the principals (Mayor, Vice Mayor) first, then
 * the members of the Sangguniang Panlungsod, each group in the order the
 * office arranged it.
 *
 * The message is deliberately left out. It belongs to the Mayor's Desk, and a
 * card in a grid of officials has no room to draw it.
 */
final class PublicServants
{
    /**
     * @return list<array{id: int, branch: string, position: string, name: string|null, photo: string|null, committee: string|null, is_principal: bool}>
     */
    public function get(): array
    {
        return Cache::remember(
            PublicCache::key('public-servants'),
            now()->addMinutes(10),
            fn (): array => array_values(
                Official::query()
                    ->publiclyVisible()
                    ->orderByDesc('is_principal')
                    // Executive before legislative among the principals, so
                    // the Mayor leads the Vice Mayor whatever order they were
                    // entered in.
                    ->orderByRaw('case when branch = ? then 0 else 1 end', [Branch::Executive->value])
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->get(['id', 'branch', 'position', 'name', 'photo_path', 'committee', 'is_principal'])
                    ->map(fn (Official $official): array => [
                        'id' => $official->id,
                        'branch' => $official->branch->value,
                        'position' => $official->position,
                        'name' => $official->name,
                        'photo' => $official->photoUrl(),
                        'committee' => $official->committee,
                        'is_principal' => $official->is_principal,
                    ])
                    ->all(),
            ),
        );
    }
}

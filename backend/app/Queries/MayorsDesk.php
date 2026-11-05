<?php

namespace App\Queries;

use App\Enums\Branch;
use App\Models\AgendaItem;
use App\Models\Official;
use App\Support\PublicCache;
use Illuminate\Support\Facades\Cache;

/**
 * "From the Mayor's Desk": the Mayor's signed message and the priority agenda.
 *
 * The two are read together because they are drawn together, and either can
 * stand alone: an agenda the office has published is worth showing before the
 * message is written, and the reverse.
 */
final class MayorsDesk
{
    /**
     * @return array{message: array{name: string, position: string, photo: string|null, text: string}|null, agenda: list<array{id: int, title: string, summary: string}>}
     */
    public function get(): array
    {
        return Cache::remember(
            PublicCache::key('mayors-desk'),
            now()->addMinutes(10),
            fn (): array => [
                'message' => $this->message(),
                'agenda' => $this->agenda(),
            ],
        );
    }

    /**
     * @return array{name: string, position: string, photo: string|null, text: string}|null
     */
    private function message(): ?array
    {
        $mayor = Official::query()
            ->publiclyVisible()
            ->where('branch', Branch::Executive)
            ->where('is_principal', true)
            // A message is only shown signed.
            ->whereNotNull('message')
            ->whereNotNull('name')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->first();

        if ($mayor === null || $mayor->message === null || $mayor->name === null) {
            return null;
        }

        return [
            'name' => $mayor->name,
            'position' => $mayor->position,
            'photo' => $mayor->photoUrl(),
            'text' => $mayor->message,
        ];
    }

    /**
     * @return list<array{id: int, title: string, summary: string}>
     */
    private function agenda(): array
    {
        return array_values(
            AgendaItem::query()
                ->publiclyVisible()
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get(['id', 'title', 'summary'])
                ->map(fn (AgendaItem $item): array => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'summary' => $item->summary,
                ])
                ->all(),
        );
    }
}

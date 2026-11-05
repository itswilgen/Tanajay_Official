<?php

namespace App\Models;

use App\Concerns\HasPoster;
use App\Concerns\InvalidatesPublicCache;
use App\Concerns\PubliclyListed;
use Carbon\CarbonImmutable;
use Database\Factories\EventFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A dated public event: a festival day, a medical mission, a public hearing.
 *
 * @property int $id
 * @property string $title
 * @property string|null $description
 * @property string $venue
 * @property CarbonImmutable $starts_at
 * @property CarbonImmutable|null $ends_at
 * @property string|null $poster_path
 * @property bool $is_published
 * @property bool $is_demo
 */
#[Fillable([
    'title', 'description', 'venue', 'starts_at', 'ends_at', 'poster_path',
    'is_published', 'is_demo',
])]
class Event extends Model
{
    /** @use HasFactory<EventFactory> */
    use HasFactory;

    use HasPoster;
    use InvalidatesPublicCache;
    use PubliclyListed;

    protected function casts(): array
    {
        return [
            'starts_at' => 'immutable_datetime',
            'ends_at' => 'immutable_datetime',
            'is_published' => 'boolean',
            'is_demo' => 'boolean',
        ];
    }

    /**
     * Not over yet, judged by the day rather than the minute: an event that
     * started this morning is still today's event at four in the afternoon,
     * and a festival stays listed until its last day has ended.
     *
     * @param  Builder<$this>  $query
     */
    #[Scope]
    protected function upcoming(Builder $query): void
    {
        $today = now()->startOfDay();

        $query->where(fn (Builder $q) => $q
            ->where(fn (Builder $single) => $single->whereNull('ends_at')->where('starts_at', '>=', $today))
            ->orWhere('ends_at', '>=', $today));
    }
}

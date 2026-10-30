<?php

namespace App\Models;

use App\Concerns\HasPoster;
use App\Concerns\InvalidatesPublicCache;
use App\Enums\PublicationStatus;
use Carbon\CarbonImmutable;
use Database\Factories\PostFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * One notice published by the City Government: an announcement, a vacancy, a
 * scholarship, an event, or the requirements for a service.
 *
 * @property int $id
 * @property string $category
 * @property string $title
 * @property string $slug
 * @property string $description
 * @property string $body
 * @property list<string>|null $requirements
 * @property string|null $poster_path
 * @property PublicationStatus $status
 * @property bool $is_demo
 * @property bool $is_urgent
 * @property CarbonImmutable|null $urgent_until
 * @property CarbonImmutable|null $published_at
 */
#[Fillable([
    'category', 'title', 'slug', 'description', 'body', 'requirements',
    'poster_path', 'status', 'is_demo', 'is_urgent', 'urgent_until',
    'published_at',
])]
class Post extends Model
{
    /** @use HasFactory<PostFactory> */
    use HasFactory;

    use HasPoster;
    use InvalidatesPublicCache;

    protected function casts(): array
    {
        return [
            'requirements' => 'array',
            'status' => PublicationStatus::class,
            'is_demo' => 'boolean',
            'is_urgent' => 'boolean',
            'urgent_until' => 'immutable_datetime',
            'published_at' => 'immutable_datetime',
        ];
    }

    /**
     * Published, with a publication date that has already passed. A future
     * `published_at` is a scheduled post and must stay off the public site.
     *
     * @param  Builder<$this>  $query
     */
    #[Scope]
    protected function published(Builder $query): void
    {
        $query->where('status', PublicationStatus::Published)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    /**
     * What the public may actually read. Demo rows exist so a fresh install has
     * something to show locally, and are withheld everywhere else.
     *
     * @param  Builder<$this>  $query
     */
    #[Scope]
    protected function publiclyVisible(Builder $query): void
    {
        $query->published()->unless(
            app()->environment('local'),
            fn (Builder $q) => $q->where('is_demo', false),
        );
    }

    /**
     * Flagged by its office for the alert band under the banner, and not yet
     * lapsed. A flag with no end date holds until the office clears it; one
     * with an end date clears itself, which is what keeps a suspension that
     * ended yesterday from heading the page today.
     *
     * @param  Builder<$this>  $query
     */
    #[Scope]
    protected function currentlyUrgent(Builder $query): void
    {
        $query->where('is_urgent', true)->where(
            fn (Builder $q) => $q->whereNull('urgent_until')->orWhere('urgent_until', '>', now()),
        );
    }
}

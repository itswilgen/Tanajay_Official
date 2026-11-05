<?php

namespace App\Models;

use App\Concerns\HasPoster;
use App\Concerns\InvalidatesPublicCache;
use App\Concerns\PubliclyListed;
use Carbon\CarbonImmutable;
use Database\Factories\CityUpdateFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * One recent development in the city, published with cover artwork: an issue
 * of the city magazine, a public works project reaching a milestone, a service
 * going online.
 *
 * This is not the same thing as a notice. A notice tells a resident to do
 * something or warns them about something, and is read for its text; an update
 * reports what the city has been doing, is read for its cover first, and keeps
 * no requirements or deadline. The two are separate records because an office
 * publishing a magazine issue should not have to borrow the shape of an
 * advisory to do it.
 *
 * @property int $id
 * @property string $category
 * @property string $title
 * @property string $slug
 * @property string $standfirst
 * @property string $body
 * @property string|null $poster_path
 * @property CarbonImmutable|null $published_at
 * @property int $sort_order
 * @property bool $is_published
 * @property bool $is_demo
 */
#[Fillable([
    'category', 'title', 'slug', 'standfirst', 'body', 'poster_path',
    'published_at', 'sort_order', 'is_published', 'is_demo',
])]
class CityUpdate extends Model
{
    /** @use HasFactory<CityUpdateFactory> */
    use HasFactory;

    use HasPoster;
    use InvalidatesPublicCache;
    use PubliclyListed;

    protected function casts(): array
    {
        return [
            'published_at' => 'immutable_datetime',
            'sort_order' => 'integer',
            'is_published' => 'boolean',
            'is_demo' => 'boolean',
        ];
    }

    /**
     * Already issued. An update with no date has not been released by its
     * office, and one dated ahead is scheduled — a magazine issue prepared for
     * next month must not appear on the band this month.
     *
     * `publiclyVisible()` from PubliclyListed answers whether the office
     * published the record at all; this answers whether its moment has come.
     * The band composes the two.
     *
     * @param  Builder<$this>  $query
     */
    #[Scope]
    protected function released(Builder $query): void
    {
        $query->whereNotNull('published_at')->where('published_at', '<=', now());
    }
}

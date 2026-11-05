<?php

namespace App\Concerns;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;

/**
 * The public-visibility rule for every record the City Information Office
 * lists on the landing page, other than notices.
 *
 * A record is public when the office has published it, and demonstration rows
 * are withheld everywhere except a `local` environment. It is the same rule as
 * `Post::publiclyVisible()`, minus the scheduled-date check notices need, and
 * it lives here once so no new model can drift from it.
 */
trait PubliclyListed
{
    /**
     * @param  Builder<$this>  $query
     */
    #[Scope]
    protected function publiclyVisible(Builder $query): void
    {
        $query->where('is_published', true)->unless(
            app()->environment('local'),
            fn (Builder $q) => $q->where('is_demo', false),
        );
    }
}

<?php

namespace App\Concerns;

/**
 * A record that may carry a poster: a `poster_path` column holding a path on
 * the `public` disk. Notices, events and programmes all do, and all three
 * hand the page the same kind of URL, so the rule lives here once.
 *
 * @property string|null $poster_path
 */
trait HasPoster
{
    /** The URL the page loads the poster from, if there is one. */
    public function posterUrl(): ?string
    {
        return $this->poster_path === null ? null : 'storage/'.$this->poster_path;
    }
}

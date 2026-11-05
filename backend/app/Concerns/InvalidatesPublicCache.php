<?php

namespace App\Concerns;

use App\Support\PublicCache;

/**
 * Bumps the public cache version whenever the model is written or removed, so
 * the public pages stop serving a stale copy of this record.
 *
 * Laravel calls `bootInvalidatesPublicCache()` automatically, which leaves a
 * model's own `booted()` method free for its other listeners.
 */
trait InvalidatesPublicCache
{
    public static function bootInvalidatesPublicCache(): void
    {
        static::saved(fn () => PublicCache::invalidate());
        static::deleted(fn () => PublicCache::invalidate());
    }
}

<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/**
 * Cache keys for every public page.
 *
 * Rather than deleting individual entries, each key is namespaced by a single
 * version counter. Bumping the counter makes all existing keys unreachable at
 * once, which is both cheaper and safer than enumerating keys when one edit
 * can affect many cached pages.
 *
 * There is deliberately one counter for the whole public site rather than one
 * per section. The same record can appear in several places at once — a notice
 * is both the banner's advisory and a row in the record — so splitting the
 * counters only created ways for one section to keep serving something another
 * had already corrected. The extra churn costs a few cold queries; stale
 * public information costs a resident a wasted trip.
 */
final class PublicCache
{
    private const VERSION_KEY = 'public:data_version';

    /**
     * The current data version; every key below is namespaced by it.
     *
     * An absent counter reads as 0, not 1, and that matters: most stores treat
     * `increment` on a missing key as "start at 1" rather than as an error, so
     * a default of 1 made the very first edit after a cold cache a no-op — it
     * wrote the version the keys were already using, and every stale entry
     * stayed reachable.
     */
    public static function version(): int
    {
        return (int) Cache::get(self::VERSION_KEY, 0);
    }

    /** Invalidate every cached public page by moving the version forward. */
    public static function invalidate(): void
    {
        // `increment` is the atomic path and is what should normally run. A few
        // stores (memcached among them) refuse it outright when the key is
        // absent and return false; seeding the counter by hand is not atomic,
        // but two concurrent edits racing to replace a missing counter both
        // want the same thing — to stop serving the version they just read.
        if (Cache::increment(self::VERSION_KEY) === false) {
            Cache::forever(self::VERSION_KEY, self::version() + 1);
        }
    }

    /**
     * Build a versioned cache key. Any filter value is hashed so the key stays
     * a bounded length no matter how long the query string was.
     */
    public static function key(string $name, mixed $filters = null): string
    {
        $key = 'public:'.$name.':'.self::version();

        if ($filters === null) {
            return $key;
        }

        return $key.':'.hash('sha256', json_encode($filters, JSON_THROW_ON_ERROR));
    }
}

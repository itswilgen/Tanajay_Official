<?php

namespace Tests\Unit;

use App\Support\PublicCache;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class PublicCacheTest extends TestCase
{
    public function test_keys_are_namespaced_by_the_current_version(): void
    {
        $this->assertSame('public:notices:0', PublicCache::key('notices'));

        PublicCache::invalidate();

        $this->assertSame('public:notices:1', PublicCache::key('notices'));
    }

    /**
     * The case that was wrong once: the counter does not exist yet, an office
     * publishes something, and the cached page has to stop being served. Most
     * stores read `increment` on a missing key as "start at 1", so a version
     * that also defaulted to 1 left the first edit invisible.
     */
    public function test_the_first_invalidation_on_a_cold_cache_changes_the_key(): void
    {
        $this->assertNull(Cache::get('public:data_version'));

        $before = PublicCache::key('notices');

        PublicCache::invalidate();

        $this->assertNotSame($before, PublicCache::key('notices'));
    }

    public function test_each_invalidation_moves_the_version_forward(): void
    {
        $keys = [];

        foreach (range(1, 3) as $ignored) {
            $keys[] = PublicCache::key('notices');
            PublicCache::invalidate();
        }

        $this->assertSame($keys, array_unique($keys));
    }

    /** Filtered keys stay a bounded length however long the filters were. */
    public function test_filters_are_hashed_into_the_key(): void
    {
        $key = PublicCache::key('notices', ['category' => str_repeat('a', 2000)]);

        $this->assertStringStartsWith('public:notices:0:', $key);
        $this->assertSame(81, strlen($key));
        $this->assertNotSame(
            $key,
            PublicCache::key('notices', ['category' => 'Announcements']),
        );
    }
}

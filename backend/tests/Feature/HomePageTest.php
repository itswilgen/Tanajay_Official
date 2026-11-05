<?php

namespace Tests\Feature;

use App\Models\HeroSlide;
use App\Models\Post;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The landing page is currently the whole public site, so these tests are the
 * only guard on what a resident can see. They are written around the one
 * question that matters for a government site: does anything reach the page
 * that the City Information Office has not released?
 */
class HomePageTest extends TestCase
{
    use RefreshDatabase;

    /**
     * The front end is a separate deployment that reads this one document, so
     * its key set is a published contract rather than an implementation
     * detail — and the exact set, not merely a subset. A dropped key is a
     * section of the live site that renders as nothing; an added one is a
     * payload the front end was never told about.
     *
     * It is asserted here, once, because `assertJsonPath($key, null)` cannot
     * do it: that passes whether the key holds null or is missing altogether,
     * which is the right reading for "no mayor's message is published today"
     * and the wrong one for "the controller stopped sending the field".
     */
    public function test_it_sends_every_key_the_front_end_reads(): void
    {
        $payload = $this->getJson('/api/home')->assertOk()->json();

        $this->assertSame([
            'name',
            'city',
            'navigation',
            'heroPhotos',
            'cityUpdates',
            'shortcuts',
            'guides',
            'mayorsDesk',
            'notices',
            'events',
            'programs',
            'publicServants',
            'recognitions',
        ], array_keys($payload));
    }

    public function test_it_renders_the_landing_page(): void
    {
        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonStructure([
                'heroPhotos',
                'notices',
                'shortcuts',
            ]);
    }

    public function test_it_renders_with_nothing_published(): void
    {
        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('heroPhotos', [])
            ->assertJsonPath('notices', []);
    }

    public function test_it_shows_the_shortcuts_from_configuration(): void
    {
        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('shortcuts', config('portal.shortcuts'));
    }

    public function test_it_shows_a_published_notice(): void
    {
        $notice = Post::factory()->create([
            'title' => 'Barangay health station schedule for November',
        ]);

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonCount(1, 'notices')
            ->assertJsonPath('notices.0.id', $notice->id)
            ->assertJsonPath('notices.0.title', $notice->title);
    }

    /**
     * A draft is work in progress inside an office. A scheduled notice has a
     * release date the city chose; publishing it early would be the portal
     * overriding that decision.
     */
    public function test_it_withholds_drafts_and_scheduled_notices(): void
    {
        Post::factory()->draft()->create();
        Post::factory()->scheduled()->create();

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('notices', []);
    }

    /**
     * Demo rows exist so a fresh clone has something on the page locally. They
     * are fabricated content, so anywhere that is not a developer's machine
     * they must stay out of sight.
     */
    public function test_it_withholds_demo_notices_outside_local(): void
    {
        Post::factory()->demo()->create();

        $this->assertNotSame('local', app()->environment());

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('notices', []);
    }

    /** The page is a signpost, not an archive: five notices, the newest first. */
    public function test_it_shows_the_five_newest_notices_first(): void
    {
        foreach (range(1, 7) as $daysAgo) {
            Post::factory()->create([
                'title' => "Notice from {$daysAgo} day(s) ago",
                'published_at' => now()->subDays($daysAgo),
            ]);
        }

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonCount(5, 'notices')
            ->assertJsonPath('notices.0.title', 'Notice from 1 day(s) ago')
            ->assertJsonPath('notices.4.title', 'Notice from 5 day(s) ago');
    }

    /**
     * The office arranges the banner by hand, so `sort_order` decides the
     * sequence and the id only breaks ties — otherwise two slides given the
     * same position would swap places between requests.
     */
    public function test_it_orders_hero_slides_by_sort_order_then_id(): void
    {
        $third = HeroSlide::factory()->create(['sort_order' => 2, 'alt_text' => 'third']);
        $first = HeroSlide::factory()->create(['sort_order' => 1, 'alt_text' => 'first']);
        $second = HeroSlide::factory()->create(['sort_order' => 1, 'alt_text' => 'second']);

        $this->assertTrue($first->id < $second->id);
        $this->assertTrue($third->id < $first->id);

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonCount(3, 'heroPhotos')
            ->assertJsonPath('heroPhotos.0.alt', 'first')
            ->assertJsonPath('heroPhotos.1.alt', 'second')
            ->assertJsonPath('heroPhotos.2.alt', 'third');
    }

    public function test_it_withholds_unpublished_hero_slides(): void
    {
        HeroSlide::factory()->unpublished()->create();

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('heroPhotos', []);
    }

    /**
     * The image path is stored relative to the public disk, and the page needs
     * a URL. The prefix is the one thing a slide cannot supply for itself.
     */
    public function test_it_prefixes_hero_slide_paths_with_the_storage_disk(): void
    {
        HeroSlide::factory()->create(['image_path' => 'hero-slides/plaza.webp']);

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('heroPhotos.0.path', 'storage/hero-slides/plaza.webp');
    }

    /**
     * The banner draws no caption, so a slide sends its file and the alt text
     * that now carries what the photograph shows — and nothing the page would
     * have to ignore.
     */
    public function test_hero_slides_send_only_the_photograph_and_its_alt_text(): void
    {
        HeroSlide::factory()->create(['alt_text' => 'The public plaza at dusk']);

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('heroPhotos.0.alt', 'The public plaza at dusk')
            ->assertJsonMissingPath('heroPhotos.0.category')
            ->assertJsonMissingPath('heroPhotos.0.title')
            ->assertJsonMissingPath('heroPhotos.0.description');
    }

    /**
     * A notice's poster is stored on the public disk like every other upload,
     * and reaches the page as a URL — or as null, which the page takes as
     * "set this notice in type".
     */
    public function test_a_notice_sends_its_poster_as_a_storage_url_or_null(): void
    {
        Post::factory()->create(['poster_path' => 'posters/water-interruption.webp', 'published_at' => now()->subHour()]);
        Post::factory()->create(['poster_path' => null, 'published_at' => now()->subDay()]);

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('notices.0.poster', 'storage/posters/water-interruption.webp')
            ->assertJsonPath('notices.1.poster', null)
            ->assertJsonMissingPath('notices.0.poster_path');
    }

    /**
     * There is no notice detail page yet, so a slug on the page would only
     * tempt a link that resolves to nothing.
     */
    public function test_it_does_not_expose_notice_slugs_or_bodies(): void
    {
        Post::factory()->create();

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonMissingPath('notices.0.slug')
            ->assertJsonMissingPath('notices.0.body')
            ->assertJsonMissingPath('notices.0.status');
    }

    /** A saved notice must reach the page, not sit behind the cached copy. */
    public function test_saving_a_notice_invalidates_the_cached_page(): void
    {
        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('notices', []);

        Post::factory()->create(['title' => 'Water interruption on Magallanes Street']);

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('notices.0.title', 'Water interruption on Magallanes Street');
    }
}

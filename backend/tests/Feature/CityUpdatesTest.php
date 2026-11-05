<?php

namespace Tests\Feature;

use App\Models\CityUpdate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CityUpdatesTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_band_has_nothing_to_show_until_an_update_is_published(): void
    {
        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('cityUpdates', []);
    }

    public function test_an_update_sends_its_category_title_standfirst_and_body(): void
    {
        CityUpdate::factory()->create([
            'category' => 'City magazine',
            'title' => 'Tanjay Frontliner, Volume I',
            'standfirst' => 'The City Information Office collects the year in one issue.',
            'body' => 'The issue carries the budget, the council record and the barangay reports.',
        ]);

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('cityUpdates.0.category', 'City magazine')
            ->assertJsonPath('cityUpdates.0.title', 'Tanjay Frontliner, Volume I')
            ->assertJsonPath('cityUpdates.0.standfirst', 'The City Information Office collects the year in one issue.')
            // The band's "Read more" discloses the body in place, so unlike
            // the notices listing this payload has to carry it.
            ->assertJsonPath('cityUpdates.0.body', 'The issue carries the budget, the council record and the barangay reports.')
            ->assertJsonPath('cityUpdates.0.cover', null);
    }

    public function test_an_update_withholds_the_columns_the_band_does_not_read(): void
    {
        CityUpdate::factory()->create(['slug' => 'tanjay-frontliner-volume-one']);

        $this->getJson('/api/home')
            ->assertOk()
            // There is no detail route yet, so the slug stays behind the
            // controller rather than sitting in the payload inviting
            // a link that would go nowhere.
            ->assertJsonMissingPath('cityUpdates.0.slug')
            ->assertJsonMissingPath('cityUpdates.0.sort_order')
            ->assertJsonMissingPath('cityUpdates.0.is_published')
            ->assertJsonMissingPath('cityUpdates.0.is_demo');
    }

    public function test_an_update_sends_its_cover_as_a_storage_url(): void
    {
        CityUpdate::factory()->create(['poster_path' => 'posters/demo/update-frontliner.webp']);

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('cityUpdates.0.cover', 'storage/posters/demo/update-frontliner.webp')
            ->assertJsonMissingPath('cityUpdates.0.poster_path');
    }

    public function test_unpublished_and_demo_updates_are_withheld(): void
    {
        CityUpdate::factory()->unpublished()->create();
        CityUpdate::factory()->demo()->create();

        $this->assertNotSame('local', app()->environment());

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('cityUpdates', []);
    }

    public function test_an_update_dated_ahead_or_not_dated_at_all_is_not_released(): void
    {
        CityUpdate::factory()->scheduled()->create();
        CityUpdate::factory()->undated()->create();

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('cityUpdates', []);
    }

    public function test_updates_follow_the_offices_order_and_stop_at_four(): void
    {
        foreach ([3, 1, 2, 4, 5] as $order) {
            CityUpdate::factory()->create(['title' => "Update {$order}", 'sort_order' => $order]);
        }

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonCount(4, 'cityUpdates')
            ->assertJsonPath('cityUpdates.0.title', 'Update 1')
            ->assertJsonPath('cityUpdates.3.title', 'Update 4');
    }

    public function test_the_newest_wins_a_tie_on_the_offices_order(): void
    {
        CityUpdate::factory()->create(['title' => 'Older', 'published_at' => now()->subMonth()]);
        CityUpdate::factory()->create(['title' => 'Newer', 'published_at' => now()->subDay()]);

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('cityUpdates.0.title', 'Newer')
            ->assertJsonPath('cityUpdates.1.title', 'Older');
    }

    public function test_publishing_an_update_reaches_an_already_cached_page(): void
    {
        $this->getJson('/api/home')->assertJsonPath('cityUpdates', []);

        CityUpdate::factory()->create(['title' => 'Public market renewal']);

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('cityUpdates.0.title', 'Public market renewal');
    }
}

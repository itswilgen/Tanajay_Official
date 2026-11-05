<?php

namespace Tests\Feature;

use App\Models\Event;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class UpcomingEventsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Mid-afternoon in the city, so "earlier today" and "yesterday" are
        // different days whatever time the suite runs.
        Carbon::setTestNow('2026-10-30 15:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_the_column_has_nothing_to_show_until_an_event_is_published(): void
    {
        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('events', []);
    }

    public function test_an_event_carries_its_venue_and_times_in_city_time(): void
    {
        Event::factory()->on(now()->addDays(2)->setTime(8, 0))->create([
            'title' => 'Medical mission',
            'venue' => 'City Plaza',
        ]);

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('events.0.title', 'Medical mission')
            ->assertJsonPath('events.0.venue', 'City Plaza')
            ->assertJsonPath('events.0.starts_at', '2026-11-01T08:00:00+08:00')
            ->assertJsonPath('events.0.ends_at', null)
            ->assertJsonPath('events.0.poster', null)
            ->assertJsonMissingPath('events.0.is_demo');
    }

    public function test_an_event_sends_its_poster_as_a_storage_url(): void
    {
        Event::factory()->create(['poster_path' => 'posters/medical-mission.webp']);

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('events.0.poster', 'storage/posters/medical-mission.webp')
            ->assertJsonMissingPath('events.0.poster_path');
    }

    public function test_past_events_drop_off_but_todays_and_running_ones_stay(): void
    {
        Event::factory()->on(now()->subDay())->create(['title' => 'Yesterday']);
        Event::factory()->on(now()->setTime(8, 0))->create(['title' => 'This morning']);
        Event::factory()->on(now()->subDays(3), now()->addDays(2))->create(['title' => 'Festival week']);
        Event::factory()->on(now()->subDays(5), now()->subDays(1))->create(['title' => 'Last week']);

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonCount(2, 'events')
            ->assertJsonPath('events.0.title', 'Festival week')
            ->assertJsonPath('events.1.title', 'This morning');
    }

    public function test_events_are_soonest_first_and_stop_at_five(): void
    {
        foreach ([4, 2, 6, 1, 3, 5] as $days) {
            Event::factory()->on(now()->addDays($days))->create(['title' => "In {$days} days"]);
        }

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonCount(5, 'events')
            ->assertJsonPath('events.0.title', 'In 1 days')
            ->assertJsonPath('events.4.title', 'In 5 days');
    }

    public function test_unpublished_and_demo_events_are_withheld(): void
    {
        Event::factory()->unpublished()->create();
        Event::factory()->demo()->create();

        $this->assertNotSame('local', app()->environment());

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('events', []);
    }

    public function test_an_event_leaves_the_page_the_day_after_it_ends_without_an_edit(): void
    {
        Event::factory()->on(now()->setTime(9, 0))->create(['title' => 'Today only']);

        $this->getJson('/api/home')->assertJsonCount(1, 'events');

        Carbon::setTestNow('2026-10-31 08:00:00');

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('events', []);
    }
}

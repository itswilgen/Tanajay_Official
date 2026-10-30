<?php

namespace Tests\Feature;

use App\Models\Post;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * The alert band under the header. It is the most prominent thing a notice
 * can become, so these tests are about it disappearing as much as appearing.
 */
class UrgentAdvisoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_nothing_shows_when_no_notice_is_flagged(): void
    {
        Post::factory()->create();

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('urgentAdvisory', null));
    }

    public function test_a_flagged_notice_shows_with_only_what_the_band_draws(): void
    {
        $notice = Post::factory()->urgent()->create(['title' => 'Classes suspended in all levels']);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('urgentAdvisory.id', $notice->id)
                ->where('urgentAdvisory.title', 'Classes suspended in all levels')
                ->missing('urgentAdvisory.body')
                ->missing('urgentAdvisory.slug'));
    }

    /**
     * Yesterday's suspension must not head today's page because nobody
     * remembered to clear the flag.
     */
    public function test_a_lapsed_flag_clears_itself(): void
    {
        Post::factory()->urgent(now()->subMinute())->create();

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('urgentAdvisory', null));
    }

    public function test_a_flag_with_a_future_end_still_shows(): void
    {
        $notice = Post::factory()->urgent(now()->addDay())->create();

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('urgentAdvisory.id', $notice->id));
    }

    public function test_drafts_scheduled_and_demo_notices_never_reach_the_band(): void
    {
        Post::factory()->urgent()->draft()->create();
        Post::factory()->urgent()->scheduled()->create();
        Post::factory()->urgent()->demo()->create();

        $this->assertNotSame('local', app()->environment());

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('urgentAdvisory', null));
    }

    public function test_the_newest_of_two_flagged_notices_wins(): void
    {
        Post::factory()->urgent()->create(['published_at' => now()->subDays(2)]);
        $newer = Post::factory()->urgent()->create(['published_at' => now()->subHour()]);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('urgentAdvisory.id', $newer->id));
    }
}

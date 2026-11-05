<?php

namespace Tests\Feature;

use App\Models\Post;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The urgency flag an office can set on a notice.
 *
 * Nothing on the public page reads it today: it was written for an alert band
 * above the banner, and that band has been taken out. The column, the scope
 * and the factory state are kept so a section can single out a suspension
 * again without a migration — which makes this file the only thing standing
 * between `urgent_until` and silent rot.
 *
 * The lapse is the part worth holding. A flag that cannot clear itself leaves
 * yesterday's suspension looking current, and it is the one behaviour here
 * that depends on the clock rather than on a boolean.
 */
class PostUrgencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_unflagged_notice_is_not_urgent(): void
    {
        Post::factory()->create();

        $this->assertSame(0, Post::query()->currentlyUrgent()->count());
    }

    public function test_a_flag_with_no_end_date_holds(): void
    {
        $notice = Post::factory()->urgent()->create();

        $this->assertSame(
            [$notice->id],
            Post::query()->currentlyUrgent()->pluck('id')->all(),
        );
    }

    public function test_a_flag_with_a_future_end_still_holds(): void
    {
        $notice = Post::factory()->urgent(now()->addDay())->create();

        $this->assertSame(
            [$notice->id],
            Post::query()->currentlyUrgent()->pluck('id')->all(),
        );
    }

    public function test_a_lapsed_flag_clears_itself(): void
    {
        Post::factory()->urgent(now()->subMinute())->create();

        $this->assertSame(0, Post::query()->currentlyUrgent()->count());
    }
}

<?php

namespace Tests\Feature;

use App\Models\Recognition;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class RecognitionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_strip_has_nothing_to_show_until_a_recognition_is_published(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('recognitions', []));
    }

    public function test_a_recognition_states_who_conferred_it_and_when(): void
    {
        Recognition::factory()->create([
            'title' => 'An award',
            'conferred_by' => 'A conferring body',
            'year' => 2025,
            'badge_path' => 'badges/award.webp',
        ]);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('recognitions.0.title', 'An award')
                ->where('recognitions.0.conferred_by', 'A conferring body')
                ->where('recognitions.0.year', 2025)
                ->where('recognitions.0.badge', 'storage/badges/award.webp')
                ->missing('recognitions.0.badge_path')
                ->missing('recognitions.0.is_demo'));
    }

    public function test_the_most_recent_year_leads_and_the_strip_stops_at_eight(): void
    {
        foreach (range(2016, 2025) as $year) {
            Recognition::factory()->create(['title' => "Award {$year}", 'year' => $year]);
        }

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('recognitions', 8)
                ->where('recognitions.0.title', 'Award 2025')
                ->where('recognitions.7.title', 'Award 2018'));
    }

    public function test_unpublished_and_demo_recognitions_are_withheld(): void
    {
        Recognition::factory()->unpublished()->create();
        Recognition::factory()->demo()->create();

        $this->assertNotSame('local', app()->environment());

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('recognitions', []));
    }

    public function test_publishing_a_recognition_reaches_an_already_cached_page(): void
    {
        $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('recognitions', []));

        Recognition::factory()->create(['title' => 'A seal']);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('recognitions.0.title', 'A seal'));
    }
}

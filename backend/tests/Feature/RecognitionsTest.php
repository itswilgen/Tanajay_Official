<?php

namespace Tests\Feature;

use App\Models\Recognition;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecognitionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_strip_has_nothing_to_show_until_a_recognition_is_published(): void
    {
        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('recognitions', []);
    }

    public function test_a_recognition_states_who_conferred_it_and_when(): void
    {
        Recognition::factory()->create([
            'title' => 'An award',
            'conferred_by' => 'A conferring body',
            'year' => 2025,
            'badge_path' => 'badges/award.webp',
        ]);

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('recognitions.0.title', 'An award')
            ->assertJsonPath('recognitions.0.conferred_by', 'A conferring body')
            ->assertJsonPath('recognitions.0.year', 2025)
            ->assertJsonPath('recognitions.0.badge', 'storage/badges/award.webp')
            ->assertJsonMissingPath('recognitions.0.badge_path')
            ->assertJsonMissingPath('recognitions.0.is_demo');
    }

    public function test_the_most_recent_year_leads_and_the_strip_stops_at_eight(): void
    {
        foreach (range(2016, 2025) as $year) {
            Recognition::factory()->create(['title' => "Award {$year}", 'year' => $year]);
        }

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonCount(8, 'recognitions')
            ->assertJsonPath('recognitions.0.title', 'Award 2025')
            ->assertJsonPath('recognitions.7.title', 'Award 2018');
    }

    public function test_unpublished_and_demo_recognitions_are_withheld(): void
    {
        Recognition::factory()->unpublished()->create();
        Recognition::factory()->demo()->create();

        $this->assertNotSame('local', app()->environment());

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('recognitions', []);
    }

    public function test_publishing_a_recognition_reaches_an_already_cached_page(): void
    {
        $this->getJson('/api/home')->assertJsonPath('recognitions', []);

        Recognition::factory()->create(['title' => 'A seal']);

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('recognitions.0.title', 'A seal');
    }
}

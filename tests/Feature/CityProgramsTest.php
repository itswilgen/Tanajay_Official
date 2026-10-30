<?php

namespace Tests\Feature;

use App\Models\Program;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class CityProgramsTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_section_has_nothing_to_show_until_a_programme_is_published(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('programs', []));
    }

    public function test_a_programme_names_who_it_is_for_the_office_and_how_to_apply(): void
    {
        Program::factory()->create([
            'title' => 'Seeds and farm inputs',
            'audience' => 'Farmers and fisherfolk',
            'office' => 'City Agriculture Office',
            'how_to_apply' => 'Register at the office with your RSBSA number.',
        ]);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('programs.0.title', 'Seeds and farm inputs')
                ->where('programs.0.audience', 'Farmers and fisherfolk')
                ->where('programs.0.office', 'City Agriculture Office')
                ->where('programs.0.how_to_apply', 'Register at the office with your RSBSA number.')
                ->where('programs.0.poster', null)
                ->missing('programs.0.sort_order')
                ->missing('programs.0.is_demo'));
    }

    public function test_a_programme_sends_its_poster_as_a_storage_url(): void
    {
        Program::factory()->create(['poster_path' => 'posters/seeds.webp']);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('programs.0.poster', 'storage/posters/seeds.webp')
                ->missing('programs.0.poster_path'));
    }

    public function test_unpublished_and_demo_programmes_are_withheld(): void
    {
        Program::factory()->unpublished()->create();
        Program::factory()->demo()->create();

        $this->assertNotSame('local', app()->environment());

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('programs', []));
    }

    public function test_programmes_follow_the_offices_order_and_stop_at_six(): void
    {
        foreach ([3, 1, 2, 4, 5, 6, 7] as $order) {
            Program::factory()->create(['title' => "Programme {$order}", 'sort_order' => $order]);
        }

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('programs', 6)
                ->where('programs.0.title', 'Programme 1')
                ->where('programs.5.title', 'Programme 6'));
    }

    public function test_publishing_a_programme_reaches_an_already_cached_page(): void
    {
        $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('programs', []));

        Program::factory()->create(['title' => 'Crisis assistance']);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('programs.0.title', 'Crisis assistance'));
    }
}

<?php

namespace Tests\Feature;

use App\Models\Official;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class PublicServantsTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_section_has_nothing_to_show_until_an_official_is_published(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('publicServants', []));
    }

    public function test_principals_lead_the_mayor_first_then_the_council_in_order(): void
    {
        // Entered in the wrong order on purpose.
        Official::factory()->create(['position' => 'Councilor B', 'sort_order' => 2]);
        Official::factory()->viceMayor()->create();
        Official::factory()->create(['position' => 'Councilor A', 'sort_order' => 1]);
        Official::factory()->mayor()->create(['sort_order' => 5]);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('publicServants', 4)
                ->where('publicServants.0.position', 'City Mayor')
                ->where('publicServants.0.branch', 'executive')
                ->where('publicServants.0.is_principal', true)
                ->where('publicServants.1.position', 'City Vice Mayor')
                ->where('publicServants.1.branch', 'legislative')
                ->where('publicServants.2.position', 'Councilor A')
                ->where('publicServants.3.position', 'Councilor B'));
    }

    public function test_the_card_carries_only_what_it_draws(): void
    {
        Official::factory()->mayor('A message for the desk, not the card.')->create([
            'committee' => 'Executive',
        ]);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('publicServants.0.committee', 'Executive')
                ->missing('publicServants.0.message')
                ->missing('publicServants.0.photo_path')
                ->missing('publicServants.0.sort_order')
                ->missing('publicServants.0.is_demo'));
    }

    public function test_an_unconfirmed_seat_is_listed_by_position_without_a_name(): void
    {
        Official::factory()->create(['position' => 'City Councilor', 'name' => null]);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('publicServants.0.position', 'City Councilor')
                ->where('publicServants.0.name', null));
    }

    public function test_unpublished_and_demo_officials_are_withheld(): void
    {
        Official::factory()->unpublished()->create();
        Official::factory()->demo()->create();

        $this->assertNotSame('local', app()->environment());

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('publicServants', []));
    }

    public function test_publishing_an_official_reaches_an_already_cached_page(): void
    {
        $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('publicServants', []));

        Official::factory()->viceMayor()->create();

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('publicServants.0.position', 'City Vice Mayor'));
    }
}

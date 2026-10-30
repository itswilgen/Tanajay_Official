<?php

namespace Tests\Feature;

use App\Models\Guide;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class CitizenGuidesTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_section_has_nothing_to_show_until_a_guide_is_published(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('guides', []));
    }

    public function test_a_published_guide_carries_its_steps_requirements_and_facts(): void
    {
        Guide::factory()->create([
            'title' => 'Renew a business permit',
            'steps' => ['Fill in the form', 'Pay at the cashier'],
            'requirements' => ['Last year’s permit'],
            'fee' => '₱500',
            'processing_time' => 'One day',
            'office' => 'Business Permits and Licensing Office',
        ]);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('guides.0.title', 'Renew a business permit')
                ->where('guides.0.steps', ['Fill in the form', 'Pay at the cashier'])
                ->where('guides.0.requirements', ['Last year’s permit'])
                ->where('guides.0.fee', '₱500')
                ->where('guides.0.processing_time', 'One day')
                ->where('guides.0.office', 'Business Permits and Licensing Office')
                ->missing('guides.0.is_demo')
                ->missing('guides.0.sort_order'));
    }

    public function test_unpublished_and_demo_guides_are_withheld(): void
    {
        Guide::factory()->unpublished()->create();
        Guide::factory()->demo()->create();

        $this->assertNotSame('local', app()->environment());

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('guides', []));
    }

    public function test_guides_follow_the_offices_order_and_stop_at_six(): void
    {
        foreach ([3, 1, 2, 4, 5, 6, 7] as $order) {
            Guide::factory()->create(['title' => "Guide {$order}", 'sort_order' => $order]);
        }

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('guides', 6)
                ->where('guides.0.title', 'Guide 1')
                ->where('guides.5.title', 'Guide 6'));
    }

    public function test_publishing_a_guide_reaches_an_already_cached_page(): void
    {
        $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('guides', []));

        Guide::factory()->create(['title' => 'Get a cedula']);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('guides.0.title', 'Get a cedula'));
    }
}

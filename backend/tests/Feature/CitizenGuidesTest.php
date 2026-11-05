<?php

namespace Tests\Feature;

use App\Models\Guide;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CitizenGuidesTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_section_has_nothing_to_show_until_a_guide_is_published(): void
    {
        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('guides', []);
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

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('guides.0.title', 'Renew a business permit')
            ->assertJsonPath('guides.0.steps', ['Fill in the form', 'Pay at the cashier'])
            ->assertJsonPath('guides.0.requirements', ['Last year’s permit'])
            ->assertJsonPath('guides.0.fee', '₱500')
            ->assertJsonPath('guides.0.processing_time', 'One day')
            ->assertJsonPath('guides.0.office', 'Business Permits and Licensing Office')
            ->assertJsonMissingPath('guides.0.is_demo')
            ->assertJsonMissingPath('guides.0.sort_order');
    }

    public function test_unpublished_and_demo_guides_are_withheld(): void
    {
        Guide::factory()->unpublished()->create();
        Guide::factory()->demo()->create();

        $this->assertNotSame('local', app()->environment());

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('guides', []);
    }

    public function test_guides_follow_the_offices_order_and_stop_at_six(): void
    {
        foreach ([3, 1, 2, 4, 5, 6, 7] as $order) {
            Guide::factory()->create(['title' => "Guide {$order}", 'sort_order' => $order]);
        }

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonCount(6, 'guides')
            ->assertJsonPath('guides.0.title', 'Guide 1')
            ->assertJsonPath('guides.5.title', 'Guide 6');
    }

    public function test_publishing_a_guide_reaches_an_already_cached_page(): void
    {
        $this->getJson('/api/home')->assertJsonPath('guides', []);

        Guide::factory()->create(['title' => 'Get a cedula']);

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('guides.0.title', 'Get a cedula');
    }
}

<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportConcernTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_national_complaint_line_is_shared_with_every_page(): void
    {
        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('city.feedback.national.number', '8888')
            ->assertJsonStructure([
                'city' => [
                    'feedback' => [
                        'national' => [
                            'label',
                            'note',
                        ],
                    ],
                ],
            ]);
    }

    /**
     * The city's own channel is the contact block, not a second copy of it,
     * so it carries the same verification flag the footer discloses.
     */
    public function test_the_city_channel_reuses_the_contact_block_and_its_flag(): void
    {
        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('city.contact.email', config('portal.city.contact.email'))
            ->assertJsonPath('city.contact.verified', config('portal.city.contact.verified'))
            ->assertJsonMissingPath('city.feedback.city');
    }
}

<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class ReportConcernTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_national_complaint_line_is_shared_with_every_page(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('city.feedback.national.number', '8888')
                ->has('city.feedback.national.label')
                ->has('city.feedback.national.note'));
    }

    /**
     * The city's own channel is the contact block, not a second copy of it,
     * so it carries the same verification flag the footer discloses.
     */
    public function test_the_city_channel_reuses_the_contact_block_and_its_flag(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('city.contact.email', config('portal.city.contact.email'))
                ->where('city.contact.verified', config('portal.city.contact.verified'))
                ->missing('city.feedback.city'));
    }
}

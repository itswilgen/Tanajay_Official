<?php

namespace Tests\Feature;

use App\Models\AgendaItem;
use App\Models\Official;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MayorsDeskTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_desk_is_empty_until_a_message_or_agenda_is_published(): void
    {
        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('mayorsDesk.message', null)
            ->assertJsonPath('mayorsDesk.agenda', []);
    }

    public function test_the_mayors_message_is_signed_with_name_and_position(): void
    {
        Official::factory()->mayor('Maayong adlaw, Tanjay.')->create(['name' => 'Hon. Example Mayor']);

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('mayorsDesk.message.name', 'Hon. Example Mayor')
            ->assertJsonPath('mayorsDesk.message.position', 'City Mayor')
            ->assertJsonPath('mayorsDesk.message.text', 'Maayong adlaw, Tanjay.')
            ->assertJsonPath('mayorsDesk.message.photo', null)
            ->assertJsonMissingPath('mayorsDesk.message.is_demo');
    }

    public function test_a_photograph_is_served_from_public_storage(): void
    {
        Official::factory()->mayor()->create(['photo_path' => 'officials/mayor.webp']);

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('mayorsDesk.message.photo', 'storage/officials/mayor.webp');
    }

    public function test_only_a_signed_executive_message_reaches_the_desk(): void
    {
        // A message on a councilor's record, an unsigned one, and the Mayor's
        // record with no message: none of them is the Mayor's Desk.
        Official::factory()->create(['message' => 'Not the Mayor.']);
        Official::factory()->mayor('Unsigned.')->create(['name' => null]);
        Official::factory()->mayor(null)->create();

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('mayorsDesk.message', null);
    }

    public function test_unpublished_and_demo_records_are_withheld(): void
    {
        Official::factory()->mayor()->unpublished()->create();
        Official::factory()->mayor()->demo()->create();
        AgendaItem::factory()->unpublished()->create();
        AgendaItem::factory()->demo()->create();

        $this->assertNotSame('local', app()->environment());

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('mayorsDesk.message', null)
            ->assertJsonPath('mayorsDesk.agenda', []);
    }

    public function test_the_agenda_follows_the_offices_numbering_and_stands_alone(): void
    {
        foreach ([3, 1, 2] as $order) {
            AgendaItem::factory()->create(['title' => "Point {$order}", 'sort_order' => $order]);
        }

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('mayorsDesk.message', null)
            ->assertJsonCount(3, 'mayorsDesk.agenda')
            ->assertJsonPath('mayorsDesk.agenda.0.title', 'Point 1')
            ->assertJsonPath('mayorsDesk.agenda.2.title', 'Point 3')
            ->assertJsonMissingPath('mayorsDesk.agenda.0.sort_order')
            ->assertJsonMissingPath('mayorsDesk.agenda.0.is_demo');
    }

    public function test_publishing_reaches_an_already_cached_page(): void
    {
        $this->getJson('/api/home')->assertJsonPath('mayorsDesk.agenda', []);

        AgendaItem::factory()->create(['title' => 'Health']);

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('mayorsDesk.agenda.0.title', 'Health');
    }
}

<?php

namespace Tests\Feature;

use Database\Seeders\DemoContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DemoContentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The seeder copies the Mayor's portrait and the sample posters onto
        // the public disk.
        Storage::fake('public');
    }

    /**
     * The whole sample set, seeded the way a developer's machine has it, must
     * leave every section of the public page empty anywhere but `local` — the
     * guarantee that lets the samples exist at all.
     */
    public function test_the_sample_set_never_reaches_a_page_outside_local(): void
    {
        $this->seed(DemoContentSeeder::class);

        $this->app->detectEnvironment(fn (): string => 'production');

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('cityUpdates', [])
            ->assertJsonPath('guides', [])
            ->assertJsonPath('mayorsDesk.message', null)
            ->assertJsonPath('mayorsDesk.agenda', [])
            ->assertJsonPath('events', [])
            ->assertJsonPath('programs', [])
            ->assertJsonPath('publicServants', [])
            ->assertJsonPath('recognitions', []);
    }

    public function test_the_sample_set_fills_every_section_locally(): void
    {
        $this->seed(DemoContentSeeder::class);

        $this->app->detectEnvironment(fn (): string => 'local');

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonCount(4, 'cityUpdates')
            ->assertJsonCount(4, 'guides')
            ->assertJsonPath('mayorsDesk.message.name', 'Hon. Jose “PEPE” T. Orlino')
            ->assertJsonPath('mayorsDesk.message.photo', 'storage/officials/mayor-portrait.webp')
            ->assertJsonCount(8, 'mayorsDesk.agenda')
            ->assertJsonCount(4, 'events')
            ->assertJsonCount(6, 'programs')
            ->assertJsonCount(14, 'publicServants')
            ->assertJsonCount(4, 'recognitions');
    }

    /**
     * Apart from the Mayor, whose name is already on the banner plate, no
     * sample official is given a name.
     */
    public function test_the_mayors_portrait_is_copied_onto_the_public_disk(): void
    {
        $this->seed(DemoContentSeeder::class);

        Storage::disk('public')->assertExists('officials/mayor-portrait.webp');
    }

    /**
     * Every sample event, programme and update, and the sample advisory,
     * carries artwork, and every path it points at is actually on the disk — a
     * path to a missing file would leave the page an empty frame to hide.
     *
     * The updates are keyed `cover` rather than `poster`, because the band sets
     * them as portrait magazine covers; they are pulled in under the same name
     * so the one check covers every sample on the page.
     */
    public function test_every_sample_poster_is_on_the_public_disk(): void
    {
        $this->seed(DemoContentSeeder::class);

        $this->app->detectEnvironment(fn (): string => 'local');

        $payload = $this->getJson('/api/home')->json();

        $posters = collect([...$payload['events'], ...$payload['programs'], ...$payload['notices']])
            ->pluck('poster')
            ->concat(collect($payload['cityUpdates'])->pluck('cover'));

        $this->assertCount(15, $posters);
        $this->assertNotContains(null, $posters);

        foreach ($posters as $url) {
            $this->assertStringStartsWith('storage/posters/demo/', $url);
            Storage::disk('public')->assertExists(substr($url, strlen('storage/')));
        }
    }

    public function test_no_sample_official_is_given_an_invented_name(): void
    {
        $this->seed(DemoContentSeeder::class);

        $this->app->detectEnvironment(fn (): string => 'local');

        $named = collect($this->getJson('/api/home')->json('publicServants'))
            ->pluck('name')
            ->filter()
            ->values()
            ->all();

        $this->assertSame(['Hon. Jose “PEPE” T. Orlino'], $named);
    }
}

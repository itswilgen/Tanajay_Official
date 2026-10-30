<?php

namespace Tests\Feature;

use Database\Seeders\DemoContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
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

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('urgentAdvisory', null)
                ->where('guides', [])
                ->where('mayorsDesk.message', null)
                ->where('mayorsDesk.agenda', [])
                ->where('events', [])
                ->where('programs', [])
                ->where('publicServants', [])
                ->where('recognitions', []));
    }

    public function test_the_sample_set_fills_every_section_locally(): void
    {
        $this->seed(DemoContentSeeder::class);

        $this->app->detectEnvironment(fn (): string => 'local');

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->whereNot('urgentAdvisory', null)
                ->has('guides', 4)
                ->where('mayorsDesk.message.name', 'Hon. Jose T. Orlino')
                ->where('mayorsDesk.message.photo', 'storage/officials/mayor-portrait.webp')
                ->has('mayorsDesk.agenda', 8)
                ->has('events', 4)
                ->has('programs', 6)
                ->has('publicServants', 14)
                ->has('recognitions', 4));
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
     * Every sample event and programme, and the sample advisory, carries a
     * poster, and every poster it points at is actually on the disk — a path
     * to a missing file would leave the page an empty frame to hide.
     */
    public function test_every_sample_poster_is_on_the_public_disk(): void
    {
        $this->seed(DemoContentSeeder::class);

        $this->app->detectEnvironment(fn (): string => 'local');

        $this->get('/')->assertInertia(function (AssertableInertia $page) {
            $props = $page->toArray()['props'];

            $posters = collect([...$props['events'], ...$props['programs'], ...$props['notices']])
                ->pluck('poster');

            $this->assertCount(11, $posters);
            $this->assertNotContains(null, $posters);

            foreach ($posters as $url) {
                $this->assertStringStartsWith('storage/posters/demo/', $url);
                Storage::disk('public')->assertExists(substr($url, strlen('storage/')));
            }
        });
    }

    public function test_no_sample_official_is_given_an_invented_name(): void
    {
        $this->seed(DemoContentSeeder::class);

        $this->app->detectEnvironment(fn (): string => 'local');

        $this->get('/')->assertInertia(function (AssertableInertia $page) {
            $named = collect($page->toArray()['props']['publicServants'])
                ->pluck('name')
                ->filter()
                ->values()
                ->all();

            $this->assertSame(['Hon. Jose T. Orlino'], $named);
        });
    }
}

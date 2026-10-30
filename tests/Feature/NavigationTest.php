<?php

namespace Tests\Feature;

use App\Support\SiteNavigation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;
use UnexpectedValueException;

class NavigationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * The anchors the landing page renders. A menu entry pointing anywhere
     * else would scroll to nothing, which is the failure this menu is built
     * to avoid.
     */
    private const PAGE_SECTIONS = [
        '#services',
        '#information',
        '#figures',
        '#transparency',
        '#hotlines',
        '#contact',
    ];

    public function test_the_menu_is_shared_with_the_page_in_the_national_order(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('navigation', 6)
                ->where('navigation.0.label', 'Home')
                ->where('navigation.1.label', 'The City')
                ->where('navigation.2.label', 'Invest')
                ->where('navigation.3.label', 'Government')
                ->where('navigation.4.label', 'Transparency')
                ->where('navigation.5.label', 'Services'));
    }

    public function test_home_is_a_link_and_every_other_heading_opens_a_group(): void
    {
        $navigation = SiteNavigation::primary();

        $this->assertSame('/', $navigation[0]['href']);
        $this->assertSame([], $navigation[0]['items']);

        foreach (array_slice($navigation, 1) as $group) {
            $this->assertNull($group['href'], "{$group['label']} should open a group, not link");
            $this->assertNotEmpty($group['items'], "{$group['label']} opens onto nothing");
        }
    }

    /**
     * An entry either lands on a section the page renders or has no `href` at
     * all, which the header draws as "Soon". Anything in between — a path to a
     * page that does not exist — is the broken link this test is for.
     */
    public function test_every_linked_entry_lands_on_a_section_the_page_renders(): void
    {
        foreach (SiteNavigation::primary() as $group) {
            foreach ($group['items'] as $item) {
                $entries = [$item, ...$item['items']];

                foreach ($entries as $entry) {
                    if ($entry['href'] === null) {
                        continue;
                    }

                    $this->assertContains(
                        $entry['href'],
                        self::PAGE_SECTIONS,
                        "{$group['label']} → {$entry['label']} points at {$entry['href']}",
                    );
                }
            }
        }
    }

    public function test_the_city_and_government_follow_the_national_menu(): void
    {
        $navigation = collect(SiteNavigation::primary());

        $this->assertSame(
            ['City Profile', 'Getting Here', 'Tanjay Hymn', 'History', 'Barangays'],
            array_column($navigation->firstWhere('label', 'The City')['items'], 'label'),
        );

        $government = $navigation->firstWhere('label', 'Government')['items'];

        $this->assertSame(
            ["Citizen's Charter", 'Executive Department', 'Sangguniang Panlungsod', 'Vision, Mission and Goals', 'GAD Corner', 'Executive Orders', 'Awards', 'Directory'],
            array_column($government, 'label'),
        );
        $this->assertNotEmpty(end($government)['items'], 'Directory should open a submenu');
    }

    public function test_services_mirrors_the_service_shortcuts(): void
    {
        $services = collect(SiteNavigation::primary())->firstWhere('label', 'Services');

        $this->assertSame(
            array_column(config('portal.shortcuts'), 'title'),
            array_column($services['items'], 'label'),
        );
        $this->assertSame(
            array_column(config('portal.shortcuts'), 'href'),
            array_column($services['items'], 'href'),
        );
    }

    /**
     * An obligation the city has not published is still named, and the menu
     * says it is outstanding rather than linking it as if it were there.
     */
    public function test_an_unpublished_obligation_leads_to_the_section_that_states_it(): void
    {
        $transparency = collect(SiteNavigation::primary())->firstWhere('label', 'Transparency');
        $charter = collect($transparency['items'])->firstWhere('label', "Citizen's Charter");

        $this->assertSame('#transparency', $charter['href']);
        $this->assertSame('RA 11032 · not yet published', $charter['note']);
    }

    public function test_a_published_obligation_links_to_its_own_page(): void
    {
        config(['portal.city.transparency.0.href' => '/citizens-charter']);
        config(['portal.city.transparency.0.available' => true]);

        $transparency = collect(SiteNavigation::primary())->firstWhere('label', 'Transparency');

        $this->assertSame('/citizens-charter', $transparency['items'][0]['href']);
        $this->assertSame('RA 11032', $transparency['items'][0]['note']);
    }

    public function test_an_unknown_source_fails_instead_of_rendering_an_empty_group(): void
    {
        config(['portal.navigation' => [['label' => 'Typo', 'source' => 'shortcutz']]]);

        $this->expectException(UnexpectedValueException::class);

        SiteNavigation::primary();
    }
}

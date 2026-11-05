<?php

namespace App\Support;

use Illuminate\Support\Facades\Config;
use UnexpectedValueException;

/**
 * The header's primary navigation, assembled from config/portal.php.
 *
 * The menu is content, not markup: the City Information Office decides what
 * it offers, so it lives in config beside the rest of the city's copy, and the
 * header only draws what it is given. This class is the one place that turns
 * the config into the shape the header reads — every entry has a label, an
 * `href` when it is a link of its own, and `items` when it opens a group.
 *
 * Inside a group an entry's `href` may be null: a page that is planned but not
 * built, which the header lists as "Soon" rather than as a link. An entry may
 * also carry one level of `items` of its own, which the header opens as a
 * submenu.
 *
 * Two groups are built from elsewhere in the same file rather than restated:
 * Transparency from the transparency obligations, Services from the service
 * shortcuts. Each therefore opens exactly what its section on the page shows,
 * and an obligation published in one place is published in both.
 *
 * @phpstan-type NavLeaf array{label: string, href: string|null, note: string|null}
 * @phpstan-type NavItem array{label: string, href: string|null, note: string|null, items: list<NavLeaf>}
 * @phpstan-type NavEntry array{label: string, href: string|null, items: list<NavItem>}
 */
final class SiteNavigation
{
    /**
     * Where an obligation with nothing published behind it leads instead: the
     * section that states it is outstanding.
     */
    private const TRANSPARENCY_SECTION = '#transparency';

    /**
     * @return list<NavEntry>
     */
    public static function primary(): array
    {
        $entries = [];

        foreach (Config::array('portal.navigation') as $entry) {
            $entries[] = [
                'label' => $entry['label'],
                'href' => $entry['href'] ?? null,
                'items' => match (true) {
                    isset($entry['source']) => self::fromSource($entry['source']),
                    isset($entry['items']) => self::fromConfig($entry['items']),
                    default => [],
                },
            ];
        }

        return $entries;
    }

    /**
     * Entries written out in the navigation config itself, each with at most
     * one level of submenu beneath it.
     *
     * @param  array<int, array{label: string, href: string|null, items?: array<int, array{label: string, href: string|null}>}>  $items
     * @return list<NavItem>
     */
    private static function fromConfig(array $items): array
    {
        return array_values(array_map(fn (array $item): array => [
            'label' => $item['label'],
            'href' => $item['href'],
            'note' => null,
            'items' => array_values(array_map(fn (array $child): array => [
                'label' => $child['label'],
                'href' => $child['href'],
                'note' => null,
            ], $item['items'] ?? [])),
        ], $items));
    }

    /**
     * A group built from another part of the portal config.
     *
     * An unknown source is a typo in config, and it fails here rather than
     * rendering a heading that opens onto nothing.
     *
     * @return list<NavItem>
     */
    private static function fromSource(string $source): array
    {
        return match ($source) {
            'transparency' => self::transparency(),
            'shortcuts' => self::shortcuts(),
            default => throw new UnexpectedValueException("Unknown navigation source [{$source}]."),
        };
    }

    /**
     * Each obligation, named in the menu whether or not it has been published.
     *
     * One that has not leads to the section that says so, and the menu says so
     * too: a resident looking for the Citizen's Charter learns it is owed and
     * outstanding, which is the honest answer, instead of finding it missing
     * from the menu and assuming the city has no such duty.
     *
     * @return list<NavItem>
     */
    private static function transparency(): array
    {
        $items = [];

        foreach (Config::array('portal.city.transparency') as $item) {
            $published = $item['available'] && $item['href'] !== null;

            $items[] = [
                'label' => $item['title'],
                'href' => $published ? $item['href'] : self::TRANSPARENCY_SECTION,
                'note' => $published ? $item['basis'] : "{$item['basis']} · not yet published",
                'items' => [],
            ];
        }

        return $items;
    }

    /**
     * The service shortcuts, in the order the page's service grid shows them.
     *
     * @return list<NavItem>
     */
    private static function shortcuts(): array
    {
        $items = [];

        foreach (Config::array('portal.shortcuts') as $shortcut) {
            $items[] = [
                'label' => $shortcut['title'],
                'href' => $shortcut['href'],
                'note' => null,
                'items' => [],
            ];
        }

        return $items;
    }
}

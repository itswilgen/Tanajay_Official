<?php

namespace Database\Seeders;

use App\Models\HeroSlide;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

/**
 * The photographs the City Information Office has already uploaded.
 *
 * These files were sitting in storage with no rows pointing at them, so the
 * banner had been falling back to its empty state on every visit. The captions
 * below are read off the photographs themselves and should be confirmed by the
 * office that took them — they are descriptive, not archival.
 *
 * Two further files in the same folder are deliberately absent:
 * LGXxzLwZ… (the mangrove boardwalk) and a2oPKCI7… (the waterfall) both carry a
 * third-party DUMAGUETE.com watermark. Another publisher's mark has no place on
 * the city's own banner, so they stay unpublished until the city has its own
 * photographs of those two places.
 */
class HeroSlideSeeder extends Seeder
{
    /**
     * @var list<array{image:string, category:string, title:string, description:string, alt:string}>
     */
    private const SLIDES = [
        [
            'image' => 'cRQ9PU5x8ZA1Uq8Zlia4OULDk4YV5BlY9ANYJi6d.jpg',
            'category' => 'The Government Center',
            'title' => 'Tanjay City Government Center',
            'description' => 'City offices, the session hall, and the public plaza now sit under one roof on the national highway.',
            'alt' => 'The Tanjay City Government Center: a multi-storey building in glass and stone, with the city seal on its tower and a stepped plaza in front.',
        ],
        [
            'image' => 'q1ghL4vQ4TYY8JtGSZSop410ppO45ZmpgWXafVpg.jpg',
            'category' => 'The city',
            'title' => 'The uplands above the plain',
            'description' => 'Tanjay is the one city in Negros Oriental with a broad lowland, and it rises quickly behind it.',
            'alt' => 'Rolling green hills scattered with houses, a paved road winding between them, and a mountain range beyond.',
        ],
        [
            'image' => 'tsUv9AMVApij4NhpzVScaX83v2qQtLpVniGsHBHF.jpg',
            'category' => 'City government',
            'title' => 'The keys to the Government Center',
            'description' => 'The ceremonial key handed over at the opening of the new seat of the city government.',
            'alt' => 'Officials in barong tagalog on the steps of the Government Center, one holding up a large ceremonial key lettered Tanjay City Government Center.',
        ],
        [
            'image' => 'ScclN3gSCOA2OCQNcvA0T04wJuIhRvdJaX5vfOfT.jpg',
            'category' => 'City services',
            'title' => 'Distribution day',
            'description' => 'Goods stacked and waiting at a city distribution, with barangay residents assembled to receive them.',
            'alt' => 'A large crowd assembled under a covered court, with sacks and boxes stacked in the foreground and uniformed officers in the front row.',
        ],
        [
            'image' => 'CLBmrWdsIWBvDFXMQ52ez6lx0N3lwQywEgFmMOa8.jpg',
            'category' => 'Infrastructure',
            'title' => 'A road opened',
            'description' => 'Barangay road projects are turned over to the community that will use them.',
            'alt' => 'A group standing behind a yellow ribbon stretched across a newly concreted road, with palms and greenery behind.',
        ],
        [
            'image' => 'EZ5hjfvrHcCBUBPWARJRMcqYG1eOPLrXTdSAV6XT.jpg',
            'category' => 'City government',
            'title' => 'Flag ceremony',
            'description' => 'The working week in the city government opens with the national anthem.',
            'alt' => 'People standing outdoors with their right hands over their hearts during a flag ceremony, a flagpole and a building behind them.',
        ],
        [
            'image' => 'PG2bBvCkyC52N9znx9jCQcHlCZ5UtfglIBJTqKY5.jpg',
            'category' => 'Community',
            'title' => 'An assembly in the barangay',
            'description' => 'Much of the city government is conducted in halls like this one, barangay by barangay.',
            'alt' => 'Residents of all ages seated and standing together for a group photograph inside a decorated community hall.',
        ],
        [
            'image' => 'vbZH2CDw8s0m5xfEu0CM14v4I0FET1KIKJ2Kiw1Y.jpg',
            'category' => 'Community',
            'title' => 'The fiesta tournaments',
            'description' => 'School and barangay teams fill the gymnasium through the July fiesta season.',
            'alt' => 'Rows of young people in numbered white and gold jerseys performing together on a gymnasium floor.',
        ],
    ];

    public function run(): void
    {
        $disk = Storage::disk('public');

        foreach (self::SLIDES as $index => $slide) {
            $path = 'hero-slides/'.$slide['image'];

            // A row whose file is missing would render as a broken banner, which
            // is worse than one slide fewer.
            if (! $disk->exists($path)) {
                $this->command->warn("Hero photograph missing, skipped: {$path}");

                continue;
            }

            HeroSlide::query()->updateOrCreate(
                ['image_path' => $path],
                [
                    'title' => $slide['title'],
                    'category' => $slide['category'],
                    'description' => $slide['description'],
                    'alt_text' => $slide['alt'],
                    'sort_order' => $index + 1,
                    'is_published' => true,
                ],
            );
        }
    }
}

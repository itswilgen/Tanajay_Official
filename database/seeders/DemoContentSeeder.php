<?php

namespace Database\Seeders;

use App\Enums\Branch;
use App\Enums\PublicationStatus;
use App\Models\AgendaItem;
use App\Models\Event;
use App\Models\Guide;
use App\Models\Official;
use App\Models\Post;
use App\Models\Program;
use App\Models\Recognition;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

/**
 * Sample records for the landing page's sections, so a local install shows
 * every section in place before the City Information Office has written any
 * of them.
 *
 * Every record is labelled as a sample in its own text and carries `is_demo`,
 * which keeps it off the public site outside `local`. The label is in the copy
 * rather than only in the flag because an invented city guide, fee or official
 * that escaped into production would otherwise be indistinguishable from a
 * real one. The only real person named is the Mayor, whose name is already on
 * the official banner plate; every other official is a position, not a name.
 *
 * Called by DatabaseSeeder in `local` and `testing` only.
 */
class DemoContentSeeder extends Seeder
{
    public function __construct(private readonly DemoPosters $posters) {}

    public function run(): void
    {
        $this->urgentAdvisory();
        $this->guides();
        $this->mayorsDesk();
        $this->publicServants();
        $this->programs();
        $this->events();
        $this->recognitions();
    }

    private function urgentAdvisory(): void
    {
        Post::query()->updateOrCreate(
            ['slug' => 'demo-urgent-advisory'],
            [
                'category' => 'Announcements',
                'title' => 'Sample urgent advisory — how a class or work suspension notice appears',
                'description' => 'This record demonstrates the alert band under the banner. No suspension is being announced.',
                'body' => 'Demonstration content only. Replace with a verified advisory before publication.',
                'poster_path' => $this->posters->store('notice-advisory'),
                'status' => PublicationStatus::Published,
                'is_demo' => true,
                'is_urgent' => true,
                'urgent_until' => null,
                'published_at' => now()->subHour(),
            ],
        );
    }

    private function guides(): void
    {
        $guides = [
            [
                'title' => 'Get a community tax certificate (cedula)',
                'summary' => 'Sample guide — shows how a walk-in service is laid out. Steps, fee and time must be confirmed by the office.',
                'office' => 'City Treasurer’s Office',
            ],
            [
                'title' => 'Renew a business permit',
                'summary' => 'Sample guide — shows how a permit renewal with several offices is laid out.',
                'office' => 'Business Permits and Licensing Office',
            ],
            [
                'title' => 'Request a copy of a birth certificate',
                'summary' => 'Sample guide — shows how a civil registry request is laid out.',
                'office' => 'City Civil Registry Office',
            ],
            [
                'title' => 'Apply for a barangay clearance',
                'summary' => 'Sample guide — shows how a service handled at barangay level is laid out.',
                'office' => 'Your barangay hall',
            ],
        ];

        foreach ($guides as $order => $guide) {
            Guide::query()->updateOrCreate(
                ['title' => $guide['title'], 'is_demo' => true],
                [
                    ...$guide,
                    'steps' => [
                        'Sample step — go to the office named below during office hours.',
                        'Sample step — present the requirements and fill in the form.',
                        'Sample step — pay any fee at the cashier and keep the official receipt.',
                    ],
                    'requirements' => [
                        'Sample requirement — one valid government-issued ID',
                        'Sample requirement — the office’s own form',
                    ],
                    'fee' => 'Sample — to be confirmed by the office',
                    'processing_time' => 'Sample — to be confirmed by the office',
                    'sort_order' => $order,
                    'is_published' => true,
                ],
            );
        }
    }

    /**
     * The Mayor's name is the one real name in these samples: it is already
     * printed on the official banner plate. So is the portrait — it is cropped
     * from that same plate, which the city has already published — and it is
     * copied onto the public disk here because storage is not versioned. The
     * message is plainly a sample.
     */
    private function mayorsDesk(): void
    {
        $portrait = 'officials/mayor-portrait.webp';

        Storage::disk('public')->put(
            $portrait,
            File::get(database_path('seeders/assets/mayor-portrait.webp')),
        );

        Official::query()->updateOrCreate(
            ['position' => 'City Mayor', 'is_demo' => true],
            [
                'branch' => Branch::Executive,
                'name' => 'Hon. Jose T. Orlino',
                'photo_path' => $portrait,
                'is_principal' => true,
                'message' => 'Sample message — this is where the Mayor’s own words to the people of Tanjay will appear, in a short paragraph or two. Replace it with the message the Mayor’s office issues before publication.',
                'sort_order' => 0,
                'is_published' => true,
            ],
        );

        $agenda = [
            'Health', 'Education', 'Agriculture', 'Infrastructure',
            'Livelihood', 'Peace and order', 'Environment', 'Good governance',
        ];

        foreach ($agenda as $order => $title) {
            AgendaItem::query()->updateOrCreate(
                ['title' => $title, 'is_demo' => true],
                [
                    'summary' => 'Sample — the Mayor’s office states its '.mb_strtolower($title).' priority here, in a sentence or two.',
                    'sort_order' => $order,
                    'is_published' => true,
                ],
            );
        }
    }

    /**
     * Positions only. No councilor is named, because a sample that put a name
     * to a seat would be a claim about a real person.
     */
    private function publicServants(): void
    {
        Official::query()->updateOrCreate(
            ['position' => 'City Vice Mayor', 'is_demo' => true],
            [
                'branch' => Branch::Legislative,
                'name' => null,
                'committee' => 'Presiding Officer, Sangguniang Panlungsod',
                'is_principal' => true,
                'sort_order' => 0,
                'is_published' => true,
            ],
        );

        $seats = [
            ...array_map(fn (int $n): string => "City Councilor {$n}", range(1, 10)),
            'Liga ng mga Barangay President',
            'SK Federation President',
        ];

        foreach ($seats as $order => $position) {
            Official::query()->updateOrCreate(
                ['position' => $position, 'is_demo' => true],
                [
                    'branch' => Branch::Legislative,
                    'name' => null,
                    'committee' => 'Sample — committee to be confirmed',
                    'is_principal' => false,
                    'sort_order' => $order + 1,
                    'is_published' => true,
                ],
            );
        }
    }

    private function programs(): void
    {
        $programs = [
            ['audience' => 'Senior citizens', 'title' => 'Sample programme — assistance for senior citizens', 'office' => 'Office of Senior Citizens Affairs', 'poster' => 'program-seniors'],
            ['audience' => 'Students', 'title' => 'Sample programme — educational assistance', 'office' => 'City Scholarship Office', 'poster' => 'program-education'],
            ['audience' => 'Farmers and fisherfolk', 'title' => 'Sample programme — seeds and farm inputs', 'office' => 'City Agriculture Office', 'poster' => 'program-farm'],
            ['audience' => 'Families in need', 'title' => 'Sample programme — crisis assistance', 'office' => 'City Social Welfare and Development Office', 'poster' => 'program-crisis'],
            ['audience' => 'Small businesses', 'title' => 'Sample programme — livelihood start-up support', 'office' => 'City Livelihood Office', 'poster' => 'program-livelihood'],
            ['audience' => 'Every resident', 'title' => 'Sample programme — free consultation days', 'office' => 'City Health Office', 'poster' => 'program-health'],
        ];

        foreach ($programs as $order => $program) {
            Program::query()->updateOrCreate(
                ['title' => $program['title'], 'is_demo' => true],
                [
                    ...Arr::except($program, 'poster'),
                    'poster_path' => $this->posters->store($program['poster']),
                    'summary' => 'Sample — shows how a programme is described: what it gives and who qualifies. Not an announcement of an actual programme.',
                    'how_to_apply' => 'Sample — the office states where to apply and what to bring.',
                    'sort_order' => $order,
                    'is_published' => true,
                ],
            );
        }
    }

    /**
     * Dated relative to today, so the column always has upcoming events to
     * show however long ago the database was seeded.
     */
    private function events(): void
    {
        $events = [
            ['title' => 'Sample event — a one-day public activity', 'days' => 3, 'hour' => 8, 'length' => null, 'poster' => 'event-activity'],
            ['title' => 'Sample event — a public hearing', 'days' => 9, 'hour' => 14, 'length' => null, 'poster' => 'event-hearing'],
            ['title' => 'Sample event — a multi-day festival', 'days' => 16, 'hour' => 9, 'length' => 4, 'poster' => 'event-festival'],
            ['title' => 'Sample event — a service caravan in the barangays', 'days' => 27, 'hour' => 8, 'length' => null, 'poster' => 'event-caravan'],
        ];

        foreach ($events as $event) {
            $startsAt = now()->startOfDay()->addDays($event['days'])->setHour($event['hour']);

            Event::query()->updateOrCreate(
                ['title' => $event['title'], 'is_demo' => true],
                [
                    'description' => 'Sample — no event is being announced by this record.',
                    'venue' => 'Venue to be confirmed',
                    'starts_at' => $startsAt,
                    'ends_at' => $event['length'] === null ? null : $startsAt->addDays($event['length'])->setHour(18),
                    'poster_path' => $this->posters->store($event['poster']),
                    'is_published' => true,
                ],
            );
        }
    }

    /**
     * No real award or conferring body is named. "Seal of Good Local
     * Governance, DILG" on a sample would be a claim about the city.
     */
    private function recognitions(): void
    {
        foreach (range(1, 4) as $order) {
            Recognition::query()->updateOrCreate(
                ['title' => "Sample recognition {$order} — award title to be confirmed", 'is_demo' => true],
                [
                    'conferred_by' => 'Conferring agency to be confirmed',
                    'year' => now()->year - intdiv($order - 1, 2),
                    'sort_order' => $order,
                    'is_published' => true,
                ],
            );
        }
    }
}

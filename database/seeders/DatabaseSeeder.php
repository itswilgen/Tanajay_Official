<?php

namespace Database\Seeders;

use App\Enums\PublicationStatus;
use App\Models\Post;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

class DatabaseSeeder extends Seeder
{
    public function run(DemoPosters $posters): void
    {
        // Real photographs the City Information Office has already uploaded, so
        // the banner has something to show in every environment.
        $this->call(HeroSlideSeeder::class);

        if (! app()->environment(['local', 'testing'])) {
            $this->command->warn('Demonstration notices are seeded only in local or testing environments.');

            return;
        }

        /*
        | Demonstration notices.
        |
        | Every one is labelled as a sample in its own copy and carries
        | `is_demo`, which keeps it off the public site outside local. An
        | invented city announcement that escaped into production would be
        | indistinguishable from an official one, so the label is in the text
        | itself rather than only in the flag.
        */
        $notices = [
            [
                'category' => 'Announcements',
                'title' => 'Public information portal demonstration notice',
                'slug' => 'demo-public-information-portal-notice',
                'description' => 'This record demonstrates how an announcement appears in the public listing.',
                'body' => 'Demonstration content only. Replace with a verified announcement before publication.',
                'poster' => 'notice-portal',
                'published_at' => '2026-09-09 00:00:00+08',
            ],
            [
                'category' => 'Job Vacancies',
                'title' => 'Sample public service assistant opening',
                'slug' => 'demo-public-service-assistant-opening',
                'description' => 'Example vacancy record for demonstrating requirements and publication dates.',
                'body' => 'Demonstration content only. Replace this sample with a verified vacancy notice before publication.',
                'requirements' => ['Sample résumé', 'Sample application letter'],
                'poster' => 'notice-vacancy',
                'published_at' => '2026-09-20 00:00:00+08',
            ],
            [
                'category' => 'Scholarships',
                'title' => 'Example student assistance application',
                'slug' => 'demo-student-assistance-application',
                'description' => 'A placeholder scholarship listing showing where eligibility and application details will appear.',
                'body' => 'Demonstration content only. No scholarship programme, eligibility, or deadline is being announced by this sample record.',
                'requirements' => ['Example proof of enrollment', 'Example application form'],
                'poster' => 'notice-scholarship',
                'published_at' => '2026-09-16 00:00:00+08',
            ],
            [
                'category' => 'Services',
                'title' => 'Example certificate request guide',
                'slug' => 'demo-certificate-request-guide',
                'description' => 'A sample service guide for showing requirements and detail page behaviour.',
                'body' => 'Demonstration content only. Contact information and service requirements must be verified by the responsible office before this record is used.',
                'requirements' => ['Example valid identification'],
                'poster' => 'notice-certificate',
                'published_at' => '2026-09-12 00:00:00+08',
            ],
            [
                'category' => 'Events',
                'title' => 'Example city event listing',
                'slug' => 'demo-city-event-listing',
                'description' => 'A placeholder event record showing how scheduled activities are presented.',
                'body' => 'Demonstration content only. No event is being announced by this sample record.',
                'poster' => 'notice-event',
                'published_at' => '2026-09-05 00:00:00+08',
            ],
        ];

        foreach ($notices as $notice) {
            Post::query()->updateOrCreate(
                ['slug' => $notice['slug']],
                [
                    ...Arr::except($notice, 'poster'),
                    'poster_path' => $posters->store($notice['poster']),
                    'status' => PublicationStatus::Published,
                    'is_demo' => true,
                ],
            );
        }

        // Samples for every other landing-page section, under the same rule.
        $this->call(DemoContentSeeder::class);
    }
}

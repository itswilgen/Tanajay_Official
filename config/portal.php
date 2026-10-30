<?php

return [
    /*
    |---------------------------------------------------------------------------
    | City identity
    |---------------------------------------------------------------------------
    | Masthead, contact, and footer content for the official site chrome.
    | Shared with every Inertia page as the `city` prop. Values that still need
    | confirmation from the City Information Office are marked `verified`
    | false, and the interface labels them instead of presenting them as final.
    */

    'city' => [
        'name' => 'City of Tanjay',
        'legal_name' => 'City Government of Tanjay',
        'province' => 'Province of Negros Oriental',
        // Negros Oriental left Central Visayas when the Negros Island Region
        // was re-established in 2024. "Region VII" is how most older material
        // still refers to the province, so the former name is kept alongside.
        'region' => 'Negros Island Region',
        'region_note' => 'Formerly Region VII · Central Visayas',
        'republic' => 'Republic of the Philippines',
        'tagline' => 'Official website of the City Government of Tanjay',
        'charter' => 'Cityhood granted under Republic Act No. 9026 (2001)',

        'office_hours' => [
            'weekdays' => 'Monday to Friday, 8:00 AM – 5:00 PM',
            'note' => 'Closed on weekends and declared holidays. No noon break.',

            /*
            | The same schedule in a form a machine can read, so the hero can
            | state whether City Hall is open right now instead of leaving a
            | resident to work it out from the prose above. `days` are ISO
            | weekday numbers (1 = Monday). Keep the two in step: the prose is
            | what a reader sees on the contact pages, this is what the status
            | indicator computes from. Declared holidays are not modelled, so
            | the indicator is advisory and the note above remains the caveat.
            */
            'schedule' => [
                'days' => [1, 2, 3, 4, 5],
                'opens' => '08:00',
                'closes' => '17:00',
            ],
        ],

        'contact' => [
            'address' => 'Tanjay City Government Center, Rizal Street, Tanjay City, Negros Oriental 6204',
            'trunkline' => '(035) 527 0823',
            'email' => 'info@tanjaycity.gov.ph',
            'verified' => false,
        ],

        /*
        | Emergency numbers are the single most consequential content on a city
        | site, so they are listed separately and shown above the footer.
        |
        | These are transcribed from a public directory of Tanjay City offices,
        | not from the City Government itself. They are real numbers rather than
        | placeholders — an invented emergency number is far more dangerous than
        | a missing one, because it fails at the moment it is needed. They are
        | still unconfirmed, which is what `hotlines_verified` tells the
        | interface to disclose. Clear this flag only once the City Information
        | Office has confirmed every line below.
        */
        'hotlines' => [
            ['label' => 'City Disaster Risk Reduction (CDRRMO)', 'number' => '(035) 415 3062', 'available' => '24 hours'],
            ['label' => 'Tanjay City Police Station', 'number' => '(035) 415 9319', 'available' => '24 hours'],
            ['label' => 'Bureau of Fire Protection – Tanjay', 'number' => '(035) 415 8626', 'available' => '24 hours'],
            ['label' => 'City Health Unit – emergency', 'number' => '(035) 415 8462', 'available' => '24 hours'],
            ['label' => 'Ambulance / urgent care', 'number' => '(035) 415 3119', 'available' => '24 hours'],
            ['label' => 'National Emergency Hotline', 'number' => '911', 'available' => '24 hours'],
        ],
        'hotlines_verified' => false,

        /*
        | Report a concern.
        |
        | Where a resident takes a complaint or a suggestion about a city
        | service. RA 11032 obliges every office to have a feedback mechanism,
        | and the national government runs one above all of them. The city's
        | own channel is the contact block above, so it is not restated here
        | and inherits that block's `verified` flag; only the national line,
        | which is the same for every office in the country, is listed.
        */
        'feedback' => [
            'national' => [
                'label' => '8888 Citizens’ Complaint Hotline',
                'number' => '8888',
                'note' => 'The national hotline for complaints about any government office or employee, run by the Office of the President.',
            ],
        ],

        /*
        | The city in figures.
        |
        | These are facts about Tanjay rather than counts of what this portal
        | holds, so they are stated here with their source and census year
        | instead of being derived from the database. A reader checking the
        | population against the PSA should find the same number and the same
        | year. Update the year alongside the value, never on its own.
        */
        'figures' => [
            ['value' => '84,593', 'label' => 'Residents', 'note' => '2024 census'],
            ['value' => '24', 'label' => 'Barangays', 'note' => 'Nine of them Poblacion'],
            ['value' => '267.05', 'label' => 'Square kilometres', 'note' => 'Total land area'],
            ['value' => '1580', 'label' => 'Founded', 'note' => 'Parish established 11 June'],
        ],
        'figures_note' => 'Population from the 2024 census. Tanjay became a component city on 1 April 2001 under Republic Act No. 9026.',

        /*
        | Transparency.
        |
        | The Full Disclosure Policy (DILG MC 2011-134, under section 352 of the
        | Local Government Code) obliges a city to publish its budget and
        | finances on its website, and RA 11032 obliges it to publish a
        | Citizen's Charter. Both are legal duties rather than site features, so
        | they get a named section on the home page rather than a footer link.
        | `available` marks what this portal can actually serve today; the rest
        | render as "not yet published" instead of as dead links.
        |
        | All four are pending while the information listing is rebuilt. Point
        | each one at its own page as that page lands, and set `available` then
        | — not before, because an `available` item with no page behind it is
        | the one failure mode this section exists to prevent.
        */
        'transparency' => [
            [
                'title' => "Citizen's Charter",
                'description' => 'Every frontline service, the documents it needs, the fee, and how long it must take.',
                'href' => null,
                'available' => false,
                'basis' => 'RA 11032',
            ],
            [
                'title' => 'Full Disclosure Policy',
                'description' => 'Budget, procurement, and the quarterly financial reports the city is obliged to publish.',
                'href' => null,
                'available' => false,
                'basis' => 'DILG MC 2011-134',
            ],
            [
                'title' => 'Freedom of Information',
                'description' => 'How to request a public record from the City Government, and what to expect back.',
                'href' => null,
                'available' => false,
                'basis' => 'Local FOI ordinance',
            ],
            [
                'title' => 'Data privacy notice',
                'description' => 'What this site collects, why, and the rights you hold over it.',
                'href' => null,
                'available' => false,
                'basis' => 'RA 10173',
            ],
        ],
    ],

    /*
    |---------------------------------------------------------------------------
    | Primary navigation
    |---------------------------------------------------------------------------
    | The menu in the header, in order. Assembled for the page by
    | App\Support\SiteNavigation and shared on every response.
    |
    | The six headings and their entries follow the national government
    | website convention. The landing page is still the whole site, so an
    | entry either points at a section of it or has `href` null: a page that
    | is planned and not yet built. Those are listed — residents should see
    | what the site will hold — but drawn as "Soon" and not as links, because
    | a menu item that opens nothing is a broken promise in the most visible
    | place on the site. Give an entry its `href` in the same change that
    | ships its page.
    |
    | An entry with `items` opens a submenu (Government → Directory). One
    | level only: a third level of flyouts is unusable on a phone.
    |
    | `source` builds a group from another part of this file instead of
    | restating it, so the Transparency menu and the transparency section, and
    | the Services menu and the service shortcuts, cannot disagree.
    */

    'navigation' => [
        ['label' => 'Home', 'href' => '/'],
        [
            'label' => 'The City',
            'items' => [
                ['label' => 'City Profile', 'href' => '#figures'],
                ['label' => 'Getting Here', 'href' => '#contact'],
                ['label' => 'Tanjay Hymn', 'href' => null],
                ['label' => 'History', 'href' => null],
                ['label' => 'Barangays', 'href' => null],
            ],
        ],
        [
            'label' => 'Invest',
            'items' => [
                ['label' => 'The City in Figures', 'href' => '#figures'],
                ['label' => 'Permits and Requirements', 'href' => '#information'],
                ['label' => 'Reach City Hall', 'href' => '#contact'],
            ],
        ],
        [
            'label' => 'Government',
            'items' => [
                ['label' => "Citizen's Charter", 'href' => '#transparency'],
                ['label' => 'Executive Department', 'href' => null],
                ['label' => 'Sangguniang Panlungsod', 'href' => null],
                ['label' => 'Vision, Mission and Goals', 'href' => null],
                ['label' => 'GAD Corner', 'href' => null],
                ['label' => 'Executive Orders', 'href' => null],
                ['label' => 'Awards', 'href' => null],
                [
                    'label' => 'Directory',
                    'href' => null,
                    'items' => [
                        ['label' => 'Emergency Hotlines', 'href' => '#hotlines'],
                        ['label' => 'City Hall Contact', 'href' => '#contact'],
                    ],
                ],
            ],
        ],
        ['label' => 'Transparency', 'source' => 'transparency'],
        ['label' => 'Services', 'source' => 'shortcuts'],
    ],

    /*
    |---------------------------------------------------------------------------
    | Service shortcuts
    |---------------------------------------------------------------------------
    | The handful of tasks people actually open a city site to do. Each one
    | points at something this site really serves, so the home page never
    | promises a transaction the portal cannot complete. `icon` maps to a
    | Lucide name in resources/js/components/site/service-grid.tsx, and
    | `cover` to that file's cover artwork in resources/images/services — the
    | portal's own category art, which announces nothing, so it is the same in
    | every environment. A card whose cover is missing falls back to its icon.
    |
    | Every `href` is an anchor on the landing page, because the landing page
    | is currently the whole site. The four content categories all lead to the
    | published notices; give each its own listing page as those are rebuilt,
    | and change the `cta` to match. The last two already point at the sections
    | that genuinely answer them.
    */

    'shortcuts' => [
        [
            'icon' => 'file-text',
            'cover' => 'requirements',
            'title' => 'Services & requirements',
            'description' => 'Checklists, fees, and where to go for permits, clearances, and civil registry requests.',
            'href' => '#information',
            'cta' => 'See what is published',
        ],
        [
            'icon' => 'briefcase',
            'cover' => 'jobs',
            'title' => 'Job vacancies',
            'description' => 'Plantilla and contractual postings from city offices, with closing dates and requirements.',
            'href' => '#information',
            'cta' => 'See what is published',
        ],
        [
            'icon' => 'graduation-cap',
            'cover' => 'scholarships',
            'title' => 'Scholarships',
            'description' => 'Educational assistance programmes, eligibility, and application deadlines.',
            'href' => '#information',
            'cta' => 'See what is published',
        ],
        [
            'icon' => 'megaphone',
            'cover' => 'announcements',
            'title' => 'Announcements',
            'description' => 'Advisories, suspensions, and official notices from the City Government.',
            'href' => '#information',
            'cta' => 'See what is published',
        ],
        [
            'icon' => 'phone',
            'cover' => 'hotlines',
            'title' => 'Emergency hotlines',
            'description' => 'Disaster response, police, fire, and health numbers answered around the clock.',
            'href' => '#hotlines',
            'cta' => 'View the numbers',
        ],
        [
            'icon' => 'scale',
            'cover' => 'transparency',
            'title' => 'Transparency & records',
            'description' => 'What the City Government is obliged to disclose, and what is still being prepared.',
            'href' => '#transparency',
            'cta' => 'See obligations',
        ],
    ],
];

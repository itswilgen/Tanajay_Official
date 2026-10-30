<?php

namespace App\Http\Controllers;

use App\Queries\CitizenGuides;
use App\Queries\CityPrograms;
use App\Queries\HeroPhotos;
use App\Queries\LatestNotices;
use App\Queries\MayorsDesk;
use App\Queries\PublicServants;
use App\Queries\Recognitions;
use App\Queries\UpcomingEvents;
use App\Queries\UrgentAdvisory;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The landing page.
 *
 * Everything it shows is published through the database rather than written
 * into the page, so the City Information Office stays the author of its own
 * content. Each section is read by its own query class in App\Queries, cached
 * behind App\Support\PublicCache, whose version counter is bumped whenever a
 * record is saved — a resident never reads a figure the office has already
 * corrected. This controller only assembles them.
 */
class HomeController extends Controller
{
    public function __invoke(
        HeroPhotos $heroPhotos,
        UrgentAdvisory $urgentAdvisory,
        LatestNotices $notices,
        CitizenGuides $guides,
        MayorsDesk $mayorsDesk,
        UpcomingEvents $events,
        CityPrograms $programs,
        PublicServants $publicServants,
        Recognitions $recognitions,
    ): Response {
        return Inertia::render('home', [
            'heroPhotos' => $heroPhotos->get(),
            'urgentAdvisory' => $urgentAdvisory->get(),
            'shortcuts' => config('portal.shortcuts'),
            'guides' => $guides->get(),
            'mayorsDesk' => $mayorsDesk->get(),
            'notices' => $notices->get(),
            'events' => $events->get(),
            'programs' => $programs->get(),
            'publicServants' => $publicServants->get(),
            'recognitions' => $recognitions->get(),
        ]);
    }
}

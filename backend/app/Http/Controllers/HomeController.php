<?php

namespace App\Http\Controllers;

use App\Queries\CitizenGuides;
use App\Queries\CityPrograms;
use App\Queries\HeroPhotos;
use App\Queries\LatestCityUpdates;
use App\Queries\LatestNotices;
use App\Queries\MayorsDesk;
use App\Queries\PublicServants;
use App\Queries\Recognitions;
use App\Queries\UpcomingEvents;
use App\Support\SiteNavigation;
use Illuminate\Http\JsonResponse;

/**
 * Everything the landing page shows, as one JSON document.
 *
 * Everything it carries is published through the database rather than written
 * into the page, so the City Information Office stays the author of its own
 * content. Each section is read by its own query class in App\Queries, cached
 * behind App\Support\PublicCache, whose version counter is bumped whenever a
 * record is saved — a resident never reads a figure the office has already
 * corrected. This controller only assembles them.
 *
 * One request, not ten. The front end is a separate deployment and every
 * call it makes crosses an origin, so a section per endpoint would mean ten
 * round trips and a page that assembles itself in pieces while someone
 * watches. The whole document is a few kilobytes and comes from one cache
 * generation, which also means the page can never show one section from before
 * an edit beside another from after it.
 *
 * The keys are flat, and the four that do not come from a query class sit
 * among them: `name`, `city` and `navigation` used to be shared on every
 * server-rendered response, and `shortcuts` is configuration rather than a
 * published record. The front end reads them the same way it reads the rest.
 *
 * Media paths are left relative — `storage/posters/x.webp` — because the one
 * thing this application cannot know is the URL the front end was served
 * from. The client resolves them against the API's own origin.
 */
class HomeController extends Controller
{
    public function __invoke(
        HeroPhotos $heroPhotos,
        LatestCityUpdates $cityUpdates,
        LatestNotices $notices,
        CitizenGuides $guides,
        MayorsDesk $mayorsDesk,
        UpcomingEvents $events,
        CityPrograms $programs,
        PublicServants $publicServants,
        Recognitions $recognitions,
    ): JsonResponse {
        return response()->json([
            'name' => config('app.name'),
            'city' => config('portal.city'),
            'navigation' => SiteNavigation::primary(),
            'heroPhotos' => $heroPhotos->get(),
            'cityUpdates' => $cityUpdates->get(),
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

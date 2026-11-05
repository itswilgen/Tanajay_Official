<?php

use App\Http\Controllers\HomeController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public API
|--------------------------------------------------------------------------
| The whole of the public site's data. The front end is deployed separately
| and reads these; nothing here is authenticated, because nothing here is
| anything but already-published municipal information.
|
| Keep every public route rate limited. The limiter is defined in
| AppServiceProvider and exists to blunt scraping rather than to ration
| ordinary reading.
*/

Route::get('/home', HomeController::class)
    ->middleware('throttle:public')
    ->name('api.home');

/*
| Health, for the front end's deployment and for whatever watches this host.
|
| It touches the database on purpose. A check that only proves PHP answered
| would have gone on reporting "ok" through the one outage that actually takes
| the portal down, because every section of the page is a database read. The
| query is the cheapest one there is, and this route is not cached.
|
| Laravel's own `/up` is still mounted and is the liveness check — this is the
| readiness check, and it says which of the two failed.
*/
Route::get('/health', function () {
    try {
        DB::connection()->select('select 1');
        $database = 'ok';
    } catch (Throwable $e) {
        report($e);
        $database = 'unavailable';
    }

    return response()->json([
        'status' => $database === 'ok' ? 'ok' : 'degraded',
        'database' => $database,
        'name' => config('app.name'),
    ], $database === 'ok' ? 200 : 503);
})->middleware('throttle:public')->name('api.health');

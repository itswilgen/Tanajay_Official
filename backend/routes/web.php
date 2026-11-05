<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web routes
|--------------------------------------------------------------------------
| This application serves no pages. The public site is a separate front end
| deployment that reads routes/api.php; what lives here is the one thing
| somebody who opens this host in a browser needs, which is to be told where
| the site is and what this host is for.
|
| It is deliberately not a redirect to the front end: this host has no
| business knowing where the site is deployed, and a 302 away from an API
| would confuse every client that follows redirects by default.
*/

Route::get('/', fn () => response()->json([
    'name' => config('app.name'),
    'service' => 'Public information API',
    'endpoints' => [
        'home' => route('api.home'),
        'health' => route('api.health'),
    ],
]))->middleware('throttle:public')->name('index');

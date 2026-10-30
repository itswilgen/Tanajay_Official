<?php

use App\Http\Controllers\HomeController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
| The landing page is the whole of the site for now. The information
| listing, the barangay and tourism sections, and the staff workspace were
| removed so each can be rebuilt deliberately; add their routes back here as
| they land, and keep the public ones rate limited.
*/

Route::get('/', HomeController::class)
    ->middleware('throttle:public')
    ->name('home');

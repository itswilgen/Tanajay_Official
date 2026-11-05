<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Nothing is appended to either group. The page-rendering middleware
        // that used to sit here left with Inertia, and the asset preload
        // header went with it: this application serves no HTML, so there are
        // no assets for it to announce.
        //
        // CORS is handled by the framework's own HandleCors, which is already
        // in the global stack and reads config/cors.php. That file is the
        // allow list, and it is the only thing standing between this API and
        // any site that wants to read from it.
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Every route here answers in JSON, including the failures. Without
        // this a 404 or a 500 came back as Laravel's HTML error page, which a
        // front end fetch cannot read and reports to the reader as a parse
        // error instead of as the status it actually got.
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => true);
    })->create();

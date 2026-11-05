<?php

/*
|--------------------------------------------------------------------------
| Cross-origin requests
|--------------------------------------------------------------------------
| The front end is a separate deployment, so every request it makes to this
| API is a cross-origin one and the browser will only hand back the response
| if this file says it may.
|
| What this API serves is municipal information the City Information Office
| has already published, with no session, no cookie and no credential
| anywhere in it. So the default is open, and that is a deliberate choice
| rather than a missing allow list: a closed default means the portal goes
| dark the first time someone deploys the front end to a URL nobody
| remembered to record here, and it buys nothing, because an origin header
| is set by the browser and anything that is not a browser ignores this file
| entirely. CORS is not what keeps data private — not publishing it is.
|
| Set CORS_ALLOWED_ORIGINS to narrow it, as a comma-separated list:
|
|   CORS_ALLOWED_ORIGINS="https://tanjay.gov.ph,https://www.tanjay.gov.ph"
|
| Narrow it as soon as there is a reason to — an origin list is how you stop
| another site presenting this city's information inside its own pages. And
| narrow it *before* anything authenticated is added here: the moment
| `supports_credentials` goes true, a wildcard is rejected by every browser
| and an explicit list stops being optional.
*/

$origins = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')),
)));

return [

    'paths' => ['api/*', 'up', 'storage/*'],

    'allowed_methods' => ['GET', 'HEAD', 'OPTIONS'],

    'allowed_origins' => $origins === [] ? ['*'] : $origins,

    /*
    | Vercel gives every branch and every commit its own preview URL, so a
    | fixed list cannot name them in advance. This matches the project's own
    | preview hosts and nothing else, and only applies once
    | CORS_ALLOWED_ORIGINS has narrowed the list above — with the wildcard in
    | place it is redundant.
    |
    | Set CORS_ALLOWED_ORIGIN_PATTERNS to the project slug:
    |
    |   CORS_ALLOWED_ORIGIN_PATTERNS="^https://tanjay-portal-[a-z0-9-]+\.vercel\.app$"
    */
    'allowed_origins_patterns' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('CORS_ALLOWED_ORIGIN_PATTERNS', '')),
    ))),

    'allowed_headers' => ['Accept', 'Content-Type', 'X-Requested-With'],

    /*
    | Nothing is exposed beyond the safe-listed response headers. The front
    | end reads the body and the status; there is no pagination cursor or
    | rate-limit budget here that it needs to see.
    */
    'exposed_headers' => [],

    /*
    | Browsers cap this themselves — Chromium at 2 hours — and a preflight
    | that is cached for a day survives a change to the list above for a day
    | too. Two hours is what actually gets honoured.
    */
    'max_age' => 7200,

    /*
    | False, and it must stay false while `allowed_origins` can be a
    | wildcard. There is no session to send.
    */
    'supports_credentials' => false,

];

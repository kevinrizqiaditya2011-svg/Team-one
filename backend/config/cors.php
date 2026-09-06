<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Di produksi, frontend dan backend berada di domain yang sama (same-origin),
    | sehingga CORS tidak relevan — cookie session dikirim normal.
    | Di development, Vite dev server di port 5173 butuh izin khusus.
    |
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', ''),
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://energikita.my.id',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];

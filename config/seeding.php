<?php

return [
    'demo_data' => filter_var(env('SEED_DEMO_DATA', false), FILTER_VALIDATE_BOOL),
    'admin_email' => env('SEED_ADMIN_EMAIL', 'admin@ellena.test'),
    'customer_email' => env('SEED_CUSTOMER_EMAIL', 'customer@ellena.test'),
    'admin_password' => env('SEED_ADMIN_PASSWORD'),
    'customer_password' => env('SEED_CUSTOMER_PASSWORD'),
];

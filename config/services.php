<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'mailchimp' => [
        'api_key' => env('MAILCHIMP_API_KEY'),
        'server_prefix' => env('MAILCHIMP_SERVER_PREFIX'),
        'list_id' => env('MAILCHIMP_LIST_ID'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env(
            'GOOGLE_REDIRECT_URI',
            rtrim((string) env('APP_URL'), '/').'/auth/google/callback',
        ),
        'ca_bundle' => env('GOOGLE_CA_BUNDLE'),
    ],

    'search_console' => [
        'verification' => env('GOOGLE_SITE_VERIFICATION'),
    ],

    'dgateway' => [
        'api_url' => env('DGATEWAY_API_URL', 'https://dgatewayapi.desispay.com'),
        'api_key' => env('DGATEWAY_API_KEY') ?: env('D_GATEWAY_API_KEY'),
        'webhook_url' => env('DGATEWAY_WEBHOOK_URL', rtrim((string) env('APP_URL'), '/').'/payments/dgateway/webhook'),
        'mobile_provider' => env('DGATEWAY_MOBILE_PROVIDER', 'iotec'),
        'cards_enabled' => (bool) env('DGATEWAY_CARDS_ENABLED', false),
        'ca_bundle' => env('DGATEWAY_CA_BUNDLE') ?: env('GOOGLE_CA_BUNDLE'),
    ],

    'n8n' => [
        'order_webhook_url' => env('N8N_ORDER_WEBHOOK_URL'),
        'order_webhook_secret' => env('N8N_ORDER_WEBHOOK_SECRET'),
        'order_webhook_hosts' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('N8N_ORDER_WEBHOOK_HOSTS', '')),
        ))),
        'ca_bundle' => env('N8N_CA_BUNDLE') ?: env('GOOGLE_CA_BUNDLE'),
        'checkout_session_secret' => env('N8N_CHECKOUT_SESSION_SECRET'),
        'checkout_session_minutes' => (int) env('N8N_CHECKOUT_SESSION_MINUTES', 30),
        'checkout_max_age_seconds' => (int) env('N8N_CHECKOUT_MAX_AGE_SECONDS', 300),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];

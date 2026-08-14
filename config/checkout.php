<?php

return [
    'unpaid_order_expiry_minutes' => (int) env('CHECKOUT_UNPAID_EXPIRY_MINUTES', 30),
    'delivery_methods' => [
        'standard' => [
            'label' => 'Standard delivery',
            'description' => 'Thoughtful tracked delivery to your door.',
            'fee' => 12,
            'free_shipping_eligible' => true,
            'minimum_business_days' => 3,
            'maximum_business_days' => 5,
        ],
        'express' => [
            'label' => 'Express delivery',
            'description' => 'Priority handling for your Ellena ritual.',
            'fee' => 25,
            'free_shipping_eligible' => false,
            'minimum_business_days' => 1,
            'maximum_business_days' => 2,
        ],
    ],
    'payment_method' => 'manual_confirmation',
];

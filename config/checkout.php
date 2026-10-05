<?php

return [
    'unpaid_order_expiry_minutes' => (int) env('CHECKOUT_UNPAID_EXPIRY_MINUTES', 30),
    'payment_method' => 'manual_confirmation',
];

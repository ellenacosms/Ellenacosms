<p>Hello {{ $order->customer_name }},</p>
<p>Your delivery fee for order {{ $order->number }} has been confirmed.</p>
<p>Delivery: {{ $order->currency }} {{ number_format((float) $order->shipping, 2) }}<br>
Total: {{ $order->currency }} {{ number_format((float) $order->total, 2) }}</p>
<p><a href="{{ route('payments.dgateway.resume', ['order' => $order->checkout_token]) }}">Review your order and pay securely</a></p>
<p>Please review the latest total on the order page before paying.</p>

<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Ellena payment confirmation</title>
</head>
<body style="margin:0;background:#f1ece4;color:#211f1b;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:40px 16px;background:#f1ece4;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fffdf9;padding:48px 36px;">
                    <tr><td align="center" style="font-family:Georgia,serif;font-size:32px;">ELLENA</td></tr>
                    <tr><td align="center" style="padding-top:34px;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Payment confirmed</td></tr>
                    <tr><td align="center" style="padding-top:16px;font-family:Georgia,serif;font-size:36px;line-height:1.15;">Your ritual is secured.</td></tr>
                    <tr><td align="center" style="padding:20px 0 28px;font-size:14px;line-height:1.8;color:#625d56;">Thank you, {{ $order->customer_name }}. We verified payment for order <strong>{{ $order->number }}</strong>.</td></tr>
                    <tr>
                        <td style="border-top:1px solid #ded7cd;border-bottom:1px solid #ded7cd;padding:20px 0;">
                            @foreach ($order->items as $item)
                                <div style="padding:6px 0;font-size:14px;">{{ $item->quantity }} × {{ $item->product_name }}</div>
                            @endforeach
                        </td>
                    </tr>
                    <tr><td align="center" style="padding-top:26px;font-size:16px;font-weight:bold;">Total: UGX {{ number_format((float) $order->total, 0) }}</td></tr>
                    <tr><td align="center" style="padding-top:24px;font-size:12px;line-height:1.7;color:#807970;">We will email you again as your order moves through fulfilment.</td></tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

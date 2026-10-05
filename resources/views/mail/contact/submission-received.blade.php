<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>New Ellena contact message</title>
</head>
<body style="margin:0;background:#f1ece4;color:#211f1b;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:40px 16px;background:#f1ece4;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fffdf9;padding:44px 34px;">
                    <tr><td align="center" style="font-family:Georgia,serif;font-size:32px;">ELLENA</td></tr>
                    <tr><td align="center" style="padding-top:32px;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Contact form</td></tr>
                    <tr><td align="center" style="padding-top:16px;font-family:Georgia,serif;font-size:34px;line-height:1.15;">New customer message.</td></tr>
                    <tr>
                        <td style="padding-top:28px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #ded7cd;border-bottom:1px solid #ded7cd;padding:18px 0;">
                                <tr><td style="padding:8px 0;font-size:13px;color:#807970;">Name</td><td style="padding:8px 0;font-size:14px;font-weight:bold;">{{ $submission->name }}</td></tr>
                                <tr><td style="padding:8px 0;font-size:13px;color:#807970;">Email</td><td style="padding:8px 0;font-size:14px;">{{ $submission->email }}</td></tr>
                                <tr><td style="padding:8px 0;font-size:13px;color:#807970;">Phone</td><td style="padding:8px 0;font-size:14px;">{{ $submission->phone ?: 'Not provided' }}</td></tr>
                                <tr><td style="padding:8px 0;font-size:13px;color:#807970;">Topic</td><td style="padding:8px 0;font-size:14px;">{{ str($submission->topic)->replace('-', ' ')->title() }}</td></tr>
                                <tr><td style="padding:8px 0;font-size:13px;color:#807970;">Order</td><td style="padding:8px 0;font-size:14px;">{{ $submission->order_number ?: 'Not provided' }}</td></tr>
                                <tr><td style="padding:8px 0;font-size:13px;color:#807970;">Preferred reply</td><td style="padding:8px 0;font-size:14px;">{{ str($submission->preferred_contact_method)->title() }}</td></tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top:26px;font-size:14px;line-height:1.8;color:#625d56;white-space:pre-line;">{{ $submission->message }}</td>
                    </tr>
                    <tr>
                        <td align="center" style="padding-top:30px;">
                            <a href="{{ url('/admin/contact-submissions') }}" style="display:inline-block;padding:15px 24px;background:#211f1b;color:#ffffff;text-decoration:none;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Open admin inbox</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

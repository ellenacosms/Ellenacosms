<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Google sign-in | Ellena</title>
    <style>
        body { align-items: center; background: #f7f3ee; color: #29241f; display: flex; font-family: Arial, sans-serif; justify-content: center; margin: 0; min-height: 100vh; }
        main { max-width: 360px; padding: 32px; text-align: center; }
        h1 { font-family: Georgia, serif; font-size: 32px; font-weight: 400; margin: 0 0 12px; }
        p { color: #6d645c; font-size: 14px; line-height: 1.7; }
        a { color: #29241f; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    </style>
</head>
<body>
    <main>
        <h1>{{ $payload['status'] === 'success' ? 'You are signed in.' : 'Sign-in needs attention.' }}</h1>
        <p>{{ $payload['message'] ?? 'This window should close automatically.' }}</p>
        <a href="{{ $payload['redirect'] }}">Continue to Ellena</a>
    </main>
    <script>
        const payload = {{ Illuminate\Support\Js::from($payload) }};
        const openerOrigin = {{ Illuminate\Support\Js::from($openerOrigin) }};

        if (window.opener && !window.opener.closed) {
            window.opener.postMessage(payload, openerOrigin);
            window.close();
        }
    </script>
</body>
</html>

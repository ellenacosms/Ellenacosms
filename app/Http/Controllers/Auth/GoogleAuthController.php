<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use GuzzleHttp\Client;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Facades\Socialite;
use RuntimeException;
use Throwable;

class GoogleAuthController extends Controller
{
    private const POPUP_SESSION_KEY = 'oauth.google.popup';

    public function redirect(Request $request): RedirectResponse
    {
        $this->rememberPopupContext($request);
        $destination = $this->intendedDestination($request);

        if (! $this->isConfigured()) {
            return redirect()->to($destination)->withErrors([
                'google' => 'Google sign-in is not configured yet. Please use email registration instead.',
            ]);
        }

        $request->session()->put('url.intended', $destination);

        return $this->googleProvider()->redirect();
    }

    public function callback(Request $request): RedirectResponse|Response
    {
        $popup = $this->pullPopupContext($request);

        try {
            $googleUser = $this->googleProvider()->user();
            $rawUser = $googleUser->getRaw();
            $email = Str::lower(trim((string) $googleUser->getEmail()));
            $googleId = trim((string) $googleUser->getId());
            $emailVerified = filter_var($rawUser['email_verified'] ?? false, FILTER_VALIDATE_BOOL);

            if ($email === '' || $googleId === '' || ! $emailVerified) {
            return $this->authenticationFailure(
                $request,
                $popup,
                'Google could not provide a verified email address for this account.',
            );
            }

            $user = DB::transaction(function () use ($email, $googleId, $googleUser): User {
                $user = User::query()
                    ->where('google_id', $googleId)
                    ->orWhere('email', $email)
                    ->lockForUpdate()
                    ->first();

                if ($user?->is_admin) {
                    abort(403, 'Administrator accounts must use the private sign-in route.');
                }

                if ($user && $user->google_id && $user->google_id !== $googleId) {
                    abort(409, 'This email address is already linked to another Google account.');
                }

                if (! $user) {
                    $user = User::create([
                        'name' => $googleUser->getName() ?: Str::before($email, '@'),
                        'email' => $email,
                        'password' => Str::password(40),
                        'google_id' => $googleId,
                        'avatar_url' => $googleUser->getAvatar(),
                    ]);
                }

                $user->forceFill([
                    'google_id' => $googleId,
                    'avatar_url' => $googleUser->getAvatar(),
                    'email_verified_at' => $user->email_verified_at ?? now(),
                ])->save();

                return $user;
            });

            Auth::login($user, remember: true);
            $request->session()->regenerate();

            $redirect = $request->session()->pull('url.intended', route('checkout.create'));

            if ($popup) {
                return $this->popupResponse($popup, 'success', $redirect);
            }

            return redirect()->to($redirect);
        } catch (Throwable $exception) {
            Log::warning('Google authentication failed.', [
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);

            return $this->authenticationFailure(
                $request,
                $popup,
                'Google sign-in could not be completed. Please try again or use email instead.',
            );
        }
    }

    private function rememberPopupContext(Request $request): void
    {
        $channel = trim((string) $request->query('channel'));

        if (! $request->boolean('popup') || preg_match('/\A[A-Za-z0-9_-]{32,128}\z/', $channel) !== 1) {
            $request->session()->forget(self::POPUP_SESSION_KEY);

            return;
        }

        $request->session()->put(self::POPUP_SESSION_KEY, [
            'channel' => $channel,
            'openerOrigin' => $request->getSchemeAndHttpHost(),
        ]);
    }

    /** @return array{channel: string, openerOrigin: string}|null */
    private function pullPopupContext(Request $request): ?array
    {
        $popup = $request->session()->pull(self::POPUP_SESSION_KEY);

        if (! is_array($popup)
            || ! isset($popup['channel'], $popup['openerOrigin'])
            || ! is_string($popup['channel'])
            || ! is_string($popup['openerOrigin'])) {
            return null;
        }

        return $popup;
    }

    /** @param array{channel: string, openerOrigin: string}|null $popup */
    private function authenticationFailure(Request $request, ?array $popup, string $message): RedirectResponse|Response
    {
        $redirect = $request->session()->get('url.intended', route('checkout.create'));

        if (! is_string($redirect)) {
            $redirect = route('checkout.create');
        }

        if ($popup) {
            return $this->popupResponse($popup, 'error', $redirect, $message);
        }

        return redirect()->to($redirect)->withErrors(['google' => $message]);
    }

    private function intendedDestination(Request $request): string
    {
        return $request->string('return')->toString() === 'register'
            ? route('dashboard')
            : route('checkout.create');
    }

    /** @param array{channel: string, openerOrigin: string} $popup */
    private function popupResponse(array $popup, string $status, string $redirect, ?string $message = null): Response
    {
        return response()->view('auth.google-popup', [
            'openerOrigin' => $popup['openerOrigin'],
            'payload' => [
                'type' => 'ellena:google-auth',
                'channel' => $popup['channel'],
                'status' => $status,
                'redirect' => $redirect,
                'message' => $message,
            ],
        ]);
    }

    private function isConfigured(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'))
            && filled(config('services.google.redirect'));
    }

    private function googleProvider(): Provider
    {
        $provider = Socialite::driver('google');

        $caBundle = config('services.google.ca_bundle');

        if (filled($caBundle)) {
            if (! is_string($caBundle) || ! is_readable($caBundle)) {
                throw new RuntimeException('The configured Google CA bundle is not readable.');
            }

            if (! method_exists($provider, 'setHttpClient')) {
                throw new RuntimeException('The Google OAuth provider cannot configure its HTTP client.');
            }

            $provider->setHttpClient(new Client([
                'verify' => $caBundle,
                'connect_timeout' => 5,
                'timeout' => 15,
            ]));
        }

        return $provider;
    }
}

<?php

namespace App\Http\Controllers;

use App\Jobs\SyncNewsletterSubscriberToMailchimp;
use App\Mail\ConfirmNewsletterSubscription;
use App\Models\NewsletterSubscriber;
use App\Services\MailchimpNewsletter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class NewsletterController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        if ($request->filled('website')) {
            return back()->with('success', 'Please check your inbox to confirm your subscription.');
        }

        $data = $request->validate([
            'email' => ['required', 'string', 'email:rfc', 'max:255'],
            'consent' => ['accepted'],
            'whatsapp_phone' => ['nullable', 'required_if:whatsapp_marketing_consent,true', 'string', 'max:32', 'regex:/^[0-9+()\\s-]{8,32}$/'],
            'whatsapp_marketing_consent' => ['boolean'],
            'source' => ['nullable', 'string', 'in:footer,popup,checkout'],
            'website' => ['nullable', 'string', 'max:0'],
        ]);
        $email = Str::lower(trim($data['email']));
        $subscriber = NewsletterSubscriber::where('email', $email)->first();
        $whatsappOptedIn = $request->boolean('whatsapp_marketing_consent');
        $whatsappPhone = $whatsappOptedIn
            ? $this->normaliseWhatsAppPhone((string) $data['whatsapp_phone'])
            : null;

        if ($subscriber?->status === NewsletterSubscriber::STATUS_CONFIRMED) {
            if ($whatsappOptedIn) {
                $subscriber->update([
                    'whatsapp_phone' => $whatsappPhone,
                    'whatsapp_marketing_opted_in_at' => now(),
                    'whatsapp_marketing_opted_out_at' => null,
                    'whatsapp_marketing_opt_in_source' => $data['source'] ?? 'footer',
                ]);
            }

            return back()->with('success', $whatsappOptedIn
                ? 'You are already on the private list and are now opted in to WhatsApp updates.'
                : 'You are already on the Ellena private list.');
        }

        $token = Str::random(64);
        $subscriber ??= new NewsletterSubscriber;
        $subscriber->fill([
            'email' => $email,
            'whatsapp_phone' => $whatsappOptedIn ? $whatsappPhone : $subscriber->whatsapp_phone,
            'status' => NewsletterSubscriber::STATUS_PENDING,
            'source' => $data['source'] ?? 'footer',
            'confirmation_token_hash' => hash('sha256', $token),
            'consent_ip_hash' => hash_hmac('sha256', (string) $request->ip(), (string) config('app.key')),
            'consent_at' => now(),
            'confirmed_at' => null,
            'unsubscribed_at' => null,
            'whatsapp_marketing_opted_in_at' => $whatsappOptedIn ? now() : $subscriber->whatsapp_marketing_opted_in_at,
            'whatsapp_marketing_opted_out_at' => $whatsappOptedIn ? null : $subscriber->whatsapp_marketing_opted_out_at,
            'whatsapp_marketing_opt_in_source' => $whatsappOptedIn ? ($data['source'] ?? 'footer') : $subscriber->whatsapp_marketing_opt_in_source,
            'mailchimp_synced_at' => null,
            'mailchimp_sync_error' => null,
        ])->save();

        Mail::to($subscriber->email)->send(new ConfirmNewsletterSubscription(
            route('newsletter.confirm', ['token' => $token]),
        ));

        return back()->with('success', 'Please check your inbox to confirm your subscription.');
    }

    public function confirm(string $token, MailchimpNewsletter $mailchimp): Response
    {
        abort_unless(strlen($token) === 64, 404);

        $subscriber = NewsletterSubscriber::where(
            'confirmation_token_hash',
            hash('sha256', $token),
        )->firstOrFail();

        if ($subscriber->status !== NewsletterSubscriber::STATUS_CONFIRMED) {
            $subscriber->update([
                'status' => NewsletterSubscriber::STATUS_CONFIRMED,
                'confirmed_at' => now(),
                'unsubscribed_at' => null,
            ]);

            if ($mailchimp->configured()) {
                SyncNewsletterSubscriberToMailchimp::dispatch($subscriber->id);
            }
        }

        return Inertia::render('storefront/newsletter-status', [
            'mode' => 'confirmed',
            'email' => $this->maskEmail($subscriber->email),
        ]);
    }

    public function showUnsubscribe(NewsletterSubscriber $subscriber): Response
    {
        return Inertia::render('storefront/newsletter-status', [
            'mode' => 'unsubscribe',
            'email' => $this->maskEmail($subscriber->email),
            'action' => URL::signedRoute('newsletter.unsubscribe', [
                'subscriber' => $subscriber,
            ]),
        ]);
    }

    public function unsubscribe(
        NewsletterSubscriber $subscriber,
        MailchimpNewsletter $mailchimp,
    ): RedirectResponse {
        $subscriber->update([
            'status' => NewsletterSubscriber::STATUS_UNSUBSCRIBED,
            'unsubscribed_at' => now(),
            'mailchimp_synced_at' => null,
        ]);

        if ($mailchimp->configured()) {
            SyncNewsletterSubscriberToMailchimp::dispatch($subscriber->id);
        }

        return to_route('home')->with('success', 'You have been removed from the Ellena private list.');
    }

    private function maskEmail(string $email): string
    {
        [$name, $domain] = explode('@', $email, 2);

        return Str::mask($name, '*', min(2, strlen($name)), max(strlen($name) - 2, 1)).'@'.$domain;
    }

    private function normaliseWhatsAppPhone(string $phone): string
    {
        $phone = preg_replace('/\\D+/', '', $phone) ?? '';

        return str_starts_with($phone, '0') ? '256'.substr($phone, 1) : $phone;
    }
}

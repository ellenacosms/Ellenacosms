<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\ConfirmNewsletterSubscription;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NewsletterSubscriberController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $search = $request->string('search')->toString();

        return Inertia::render('admin/newsletter-subscribers', [
            'subscribers' => NewsletterSubscriber::query()
                ->when($status, fn ($query) => $query->where('status', $status))
                ->when($search, fn ($query) => $query->where('email', 'like', "%{$search}%"))
                ->latest()
                ->paginate(25)
                ->withQueryString(),
            'filters' => compact('status', 'search'),
            'summary' => [
                'total' => NewsletterSubscriber::count(),
                'confirmed' => NewsletterSubscriber::confirmed()->count(),
                'pending' => NewsletterSubscriber::where('status', NewsletterSubscriber::STATUS_PENDING)->count(),
                'unsubscribed' => NewsletterSubscriber::where('status', NewsletterSubscriber::STATUS_UNSUBSCRIBED)->count(),
            ],
        ]);
    }

    public function resend(NewsletterSubscriber $subscriber): RedirectResponse
    {
        if ($subscriber->status === NewsletterSubscriber::STATUS_CONFIRMED) {
            return back()->with('success', 'This subscriber is already confirmed.');
        }

        $token = Str::random(64);
        $subscriber->update([
            'status' => NewsletterSubscriber::STATUS_PENDING,
            'confirmation_token_hash' => hash('sha256', $token),
            'unsubscribed_at' => null,
        ]);
        Mail::to($subscriber->email)->send(new ConfirmNewsletterSubscription(
            route('newsletter.confirm', ['token' => $token]),
        ));

        return back()->with('success', 'Confirmation email sent.');
    }

    public function destroy(NewsletterSubscriber $subscriber): RedirectResponse
    {
        $subscriber->delete();

        return back()->with('success', 'Subscriber permanently deleted.');
    }

    public function export(): StreamedResponse
    {
        return response()->streamDownload(function () {
            $output = fopen('php://output', 'w');
            fputcsv($output, ['Email', 'WhatsApp phone', 'WhatsApp consent date', 'Status', 'Source', 'Consent date', 'Confirmed date', 'Unsubscribed date']);

            NewsletterSubscriber::query()->latest()->chunk(500, function ($subscribers) use ($output) {
                foreach ($subscribers as $subscriber) {
                    fputcsv($output, [
                        $subscriber->email,
                        $subscriber->whatsapp_phone,
                        $subscriber->whatsapp_marketing_opted_in_at?->toIso8601String(),
                        $subscriber->status,
                        $subscriber->source,
                        $subscriber->consent_at?->toIso8601String(),
                        $subscriber->confirmed_at?->toIso8601String(),
                        $subscriber->unsubscribed_at?->toIso8601String(),
                    ]);
                }
            });

            fclose($output);
        }, 'ellena-newsletter-subscribers-'.now()->format('Y-m-d').'.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }
}

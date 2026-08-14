<?php

namespace App\Services;

use App\Models\NewsletterSubscriber;
use Illuminate\Support\Facades\Http;

class MailchimpNewsletter
{
    public function configured(): bool
    {
        return filled(config('services.mailchimp.api_key'))
            && filled(config('services.mailchimp.server_prefix'))
            && filled(config('services.mailchimp.list_id'));
    }

    public function sync(NewsletterSubscriber $subscriber): void
    {
        if (! $this->configured()) {
            return;
        }

        $status = match ($subscriber->status) {
            NewsletterSubscriber::STATUS_CONFIRMED => 'subscribed',
            NewsletterSubscriber::STATUS_UNSUBSCRIBED => 'unsubscribed',
            default => 'pending',
        };
        $memberHash = md5(strtolower($subscriber->email));
        $serverPrefix = config('services.mailchimp.server_prefix');
        $listId = config('services.mailchimp.list_id');

        Http::withBasicAuth('ellena', config('services.mailchimp.api_key'))
            ->acceptJson()
            ->timeout(12)
            ->retry(2, 300)
            ->put(
                "https://{$serverPrefix}.api.mailchimp.com/3.0/lists/{$listId}/members/{$memberHash}",
                [
                    'email_address' => $subscriber->email,
                    'status_if_new' => $status,
                    'status' => $status,
                    'tags' => ['Ellena website'],
                ],
            )
            ->throw();

        $subscriber->update([
            'mailchimp_synced_at' => now(),
            'mailchimp_sync_error' => null,
        ]);
    }
}

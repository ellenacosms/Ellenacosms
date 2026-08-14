<?php

namespace App\Jobs;

use App\Models\NewsletterSubscriber;
use App\Services\MailchimpNewsletter;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Str;
use Throwable;

class SyncNewsletterSubscriberToMailchimp implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public int $subscriberId) {}

    public function handle(MailchimpNewsletter $mailchimp): void
    {
        $subscriber = NewsletterSubscriber::find($this->subscriberId);

        if (! $subscriber || ! $mailchimp->configured()) {
            return;
        }

        try {
            $mailchimp->sync($subscriber);
        } catch (Throwable $exception) {
            $subscriber->update([
                'mailchimp_sync_error' => Str::limit($exception->getMessage(), 1000),
            ]);

            throw $exception;
        }
    }
}

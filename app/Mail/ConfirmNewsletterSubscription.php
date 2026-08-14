<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ConfirmNewsletterSubscription extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $confirmationUrl) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Confirm your place on the Ellena private list');
    }

    public function content(): Content
    {
        return new Content(view: 'mail.newsletter.confirm');
    }
}

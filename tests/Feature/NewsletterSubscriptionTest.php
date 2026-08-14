<?php

namespace Tests\Feature;

use App\Mail\ConfirmNewsletterSubscription;
use App\Models\NewsletterSubscriber;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class NewsletterSubscriptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_visitor_can_subscribe_and_confirm_their_email(): void
    {
        Mail::fake();

        $this->from('/')->post('/newsletter', [
            'email' => 'Ritual@Example.com',
            'consent' => true,
            'source' => 'footer',
            'website' => '',
        ])->assertRedirect('/');

        $subscriber = NewsletterSubscriber::firstOrFail();
        $this->assertSame('ritual@example.com', $subscriber->email);
        $this->assertSame(NewsletterSubscriber::STATUS_PENDING, $subscriber->status);
        $this->assertNotNull($subscriber->consent_at);

        $confirmationUrl = null;
        Mail::assertSent(ConfirmNewsletterSubscription::class, function ($mail) use (&$confirmationUrl) {
            $confirmationUrl = $mail->confirmationUrl;

            return true;
        });

        $this->get($confirmationUrl)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('storefront/newsletter-status')
                ->where('mode', 'confirmed'));

        $this->assertSame(
            NewsletterSubscriber::STATUS_CONFIRMED,
            $subscriber->fresh()->status,
        );
        $this->assertNotNull($subscriber->fresh()->confirmed_at);
    }

    public function test_marketing_consent_is_required(): void
    {
        Mail::fake();

        $this->from('/')->post('/newsletter', [
            'email' => 'ritual@example.com',
            'consent' => false,
            'source' => 'footer',
        ])->assertSessionHasErrors('consent');

        $this->assertDatabaseCount('newsletter_subscribers', 0);
        Mail::assertNothingSent();
    }

    public function test_confirmed_subscriber_can_unsubscribe_with_signed_links(): void
    {
        $subscriber = NewsletterSubscriber::create([
            'email' => 'ritual@example.com',
            'status' => NewsletterSubscriber::STATUS_CONFIRMED,
            'source' => 'footer',
            'confirmation_token_hash' => hash('sha256', 'confirmation-token'),
            'consent_at' => now(),
            'confirmed_at' => now(),
        ]);
        $showUrl = URL::signedRoute('newsletter.unsubscribe.show', compact('subscriber'));
        $actionUrl = URL::signedRoute('newsletter.unsubscribe', compact('subscriber'));

        $this->get($showUrl)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('storefront/newsletter-status')
                ->where('mode', 'unsubscribe'));
        $this->delete($actionUrl)->assertRedirect('/');

        $subscriber->refresh();
        $this->assertSame(NewsletterSubscriber::STATUS_UNSUBSCRIBED, $subscriber->status);
        $this->assertNotNull($subscriber->unsubscribed_at);
    }

    public function test_admin_can_view_and_export_subscribers(): void
    {
        $admin = User::factory()->withTwoFactor()->create(['is_admin' => true]);
        NewsletterSubscriber::create([
            'email' => 'ritual@example.com',
            'status' => NewsletterSubscriber::STATUS_CONFIRMED,
            'source' => 'footer',
            'confirmation_token_hash' => hash('sha256', 'confirmation-token'),
            'consent_at' => now(),
            'confirmed_at' => now(),
        ]);

        $this->actingAs($admin)
            ->get('/admin/newsletter')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/newsletter-subscribers')
                ->where('summary.confirmed', 1));

        $csv = $this->actingAs($admin)
            ->get('/admin/newsletter/export')
            ->assertOk()
            ->streamedContent();

        $this->assertStringContainsString('ritual@example.com', $csv);
        $this->assertStringContainsString('Confirmed date', $csv);
    }
}

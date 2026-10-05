<?php

namespace Tests\Feature;

use App\Mail\ContactSubmissionReceived;
use App\Models\ContactSubmission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ContactSubmissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_contact_page_renders_on_site_contact_experience(): void
    {
        $this->get('/contact')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('storefront/information')
                ->where('page', 'contact'),
            );
    }

    public function test_customer_can_submit_contact_form(): void
    {
        Mail::fake();

        $this->post('/contact', [
            'name' => 'Amina Customer',
            'email' => 'amina@example.com',
            'phone' => '+256 700 111 222',
            'topic' => 'wholesale',
            'order_number' => 'ELN-1001',
            'preferred_contact_method' => 'whatsapp',
            'message' => 'I would like to discuss wholesale quantities for salons.',
            'website' => '',
        ])->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas(ContactSubmission::class, [
            'name' => 'Amina Customer',
            'email' => 'amina@example.com',
            'topic' => 'wholesale',
            'preferred_contact_method' => 'whatsapp',
            'order_number' => 'ELN-1001',
        ]);

        Mail::assertSent(ContactSubmissionReceived::class, function ($mail) {
            return $mail->hasTo('ellenateam01@gmail.com')
                && $mail->submission->email === 'amina@example.com';
        });
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\ContactSubmission;
use App\Mail\ContactSubmissionReceived;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactSubmissionController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        if ($request->filled('website')) {
            return back()->with('success', 'Thank you. Our team will review your message shortly.');
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'string', 'email:rfc', 'max:255'],
            'phone' => ['nullable', 'string', 'max:32', 'regex:/^[0-9+()\\s-]{8,32}$/'],
            'topic' => ['required', 'string', 'in:product-advice,order-support,delivery,wholesale,partnership,other'],
            'order_number' => ['nullable', 'string', 'max:60'],
            'preferred_contact_method' => ['required', 'string', 'in:email,phone,whatsapp'],
            'message' => ['required', 'string', 'min:10', 'max:3000'],
            'website' => ['nullable', 'string', 'max:0'],
        ]);

        $submission = ContactSubmission::create([
            ...$data,
            'ip_hash' => hash_hmac('sha256', (string) $request->ip(), (string) config('app.key')),
        ]);

        Mail::to('ellenateam01@gmail.com')->send(new ContactSubmissionReceived($submission));

        return back()->with('success', 'Thank you. Your message has been received and our team will get back to you shortly.');
    }
}

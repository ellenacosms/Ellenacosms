<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactSubmission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContactSubmissionController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $topic = $request->string('topic')->toString();
        $search = $request->string('search')->toString();

        return Inertia::render('admin/contact-submissions', [
            'submissions' => ContactSubmission::query()
                ->when($status === 'unread', fn ($query) => $query->whereNull('read_at'))
                ->when($status === 'read', fn ($query) => $query->whereNotNull('read_at'))
                ->when($topic, fn ($query) => $query->where('topic', $topic))
                ->when($search, fn ($query) => $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('order_number', 'like', "%{$search}%")
                        ->orWhere('message', 'like', "%{$search}%");
                }))
                ->latest()
                ->paginate(20)
                ->withQueryString(),
            'filters' => compact('status', 'topic', 'search'),
            'summary' => [
                'total' => ContactSubmission::count(),
                'unread' => ContactSubmission::whereNull('read_at')->count(),
                'wholesale' => ContactSubmission::where('topic', 'wholesale')->count(),
                'today' => ContactSubmission::whereDate('created_at', today())->count(),
            ],
        ]);
    }

    public function show(ContactSubmission $contactSubmission): Response
    {
        if ($contactSubmission->read_at === null) {
            $contactSubmission->update(['read_at' => now()]);
        }

        return Inertia::render('admin/contact-submission-show', [
            'submission' => $contactSubmission->fresh(),
        ]);
    }

    public function markRead(ContactSubmission $contactSubmission): RedirectResponse
    {
        $contactSubmission->update([
            'read_at' => $contactSubmission->read_at ?? now(),
        ]);

        return back()->with('success', 'Message marked as read.');
    }

    public function markUnread(ContactSubmission $contactSubmission): RedirectResponse
    {
        $contactSubmission->update(['read_at' => null]);

        return back()->with('success', 'Message marked as unread.');
    }

    public function destroy(ContactSubmission $contactSubmission): RedirectResponse
    {
        $contactSubmission->delete();

        return to_route('admin.contact-submissions.index')
            ->with('success', 'Contact message permanently deleted.');
    }
}

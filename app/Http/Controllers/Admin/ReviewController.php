<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('admin/reviews', [
            'reviews' => Review::with('product')
                ->when($request->string('status')->toString() === 'pending', fn ($query) => $query->where('is_approved', false))
                ->when($request->string('status')->toString() === 'approved', fn ($query) => $query->where('is_approved', true))
                ->latest()
                ->paginate(20)
                ->withQueryString(),
            'status' => $request->string('status'),
            'summary' => [
                'total' => Review::count(),
                'pending' => Review::where('is_approved', false)->count(),
                'average' => round((float) Review::avg('rating'), 1),
            ],
        ]);
    }

    public function update(Request $request, Review $review): RedirectResponse
    {
        $data = $request->validate(['is_approved' => ['required', 'boolean']]);
        $review->update($data);

        return back()->with('success', $data['is_approved'] ? 'Review published.' : 'Review hidden.');
    }

    public function destroy(Review $review): RedirectResponse
    {
        $review->delete();

        return back()->with('success', 'Review deleted.');
    }
}

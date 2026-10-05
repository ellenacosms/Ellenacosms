<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/categories', [
            'categories' => Category::withCount('products')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120', 'unique:categories,name'],
            'description' => ['nullable', 'string'],
            'image' => $this->imageRules(),
        ]);
        Category::create([...$data, 'slug' => $this->uniqueSlug($data['name'])]);

        return back()->with('success', 'Category created.');
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120', Rule::unique('categories', 'name')->ignore($category)],
            'description' => ['nullable', 'string'],
            'image' => $this->imageRules(),
            'is_active' => ['boolean'],
        ]);
        $category->update([...$data, 'slug' => $this->uniqueSlug($data['name'], $category)]);

        return back()->with('success', 'Category updated.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        abort_if($category->products()->exists(), 422, 'Move or delete the products in this category first.');
        $category->delete();

        return back()->with('success', 'Category deleted.');
    }

    private function uniqueSlug(string $name, ?Category $category = null): string
    {
        $base = Str::slug($name) ?: 'category';
        $slug = $base;
        $suffix = 2;

        while (Category::where('slug', $slug)
            ->when($category, fn ($query) => $query->whereKeyNot($category->getKey()))
            ->exists()) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }

    /** @return array<int, mixed> */
    private function imageRules(): array
    {
        return [
            'nullable',
            'string',
            'max:2048',
            function (string $attribute, mixed $value, \Closure $fail): void {
                if ($value === null || $value === '') {
                    return;
                }

                $image = (string) $value;
                $isLocalAsset = str_starts_with($image, '/') && ! str_starts_with($image, '//');
                $scheme = parse_url($image, PHP_URL_SCHEME);
                $isHttpUrl = filter_var($image, FILTER_VALIDATE_URL)
                    && in_array($scheme, ['http', 'https'], true);

                if (! $isLocalAsset && ! $isHttpUrl) {
                    $fail('The '.$attribute.' must be a local path beginning with / or a valid http(s) URL.');
                }
            },
        ];
    }
}

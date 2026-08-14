<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BannerController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/banners', [
            'banners' => Banner::orderBy('placement')->orderBy('sort_order')->latest()->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Banner::create($this->validated($request));

        return back()->with('success', 'Banner uploaded and saved.');
    }

    public function update(Request $request, Banner $banner): RedirectResponse
    {
        $banner->update($this->validated($request, $banner));

        return back()->with('success', 'Banner updated.');
    }

    public function destroy(Banner $banner): RedirectResponse
    {
        $this->deleteManagedUpload($banner->image);
        $this->deleteManagedUpload($banner->mobile_image);
        $banner->delete();

        return back()->with('success', 'Banner deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Banner $banner = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:190'],
            'placement' => ['required', Rule::in(['hero', 'promotion'])],
            'eyebrow' => ['nullable', 'string', 'max:120'],
            'title' => ['required', 'string', 'max:190'],
            'subtitle' => ['nullable', 'string', 'max:500'],
            'image_file' => [$banner ? 'nullable' : 'required', 'image', 'mimes:jpg,jpeg,png,webp,avif', 'max:8192'],
            'mobile_image_file' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,avif', 'max:8192'],
            'cta_label' => ['nullable', 'string', 'max:80'],
            'cta_url' => [
                'nullable',
                'string',
                'max:2048',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $isSafePath = is_string($value)
                        && str_starts_with($value, '/')
                        && ! str_starts_with($value, '//');
                    $scheme = is_string($value) ? parse_url($value, PHP_URL_SCHEME) : null;
                    $isSafeUrl = filter_var($value, FILTER_VALIDATE_URL)
                        && in_array($scheme, ['http', 'https'], true);

                    if (! $isSafePath && ! $isSafeUrl) {
                        $fail('The button link must be a site path or an HTTP(S) URL.');
                    }
                },
            ],
            'text_position' => ['required', Rule::in(['left', 'center', 'right'])],
            'overlay_opacity' => ['required', 'integer', 'min:0', 'max:80'],
            'sort_order' => ['required', 'integer', 'min:0', 'max:9999'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['boolean'],
        ]);

        if ($request->file('image_file') instanceof UploadedFile) {
            if ($banner) {
                $this->deleteManagedUpload($banner->image);
            }
            $data['image'] = $this->storeUpload($request->file('image_file'), 'banners');
        }

        if ($request->file('mobile_image_file') instanceof UploadedFile) {
            if ($banner) {
                $this->deleteManagedUpload($banner->mobile_image);
            }
            $data['mobile_image'] = $this->storeUpload($request->file('mobile_image_file'), 'banners/mobile');
        }

        unset($data['image_file'], $data['mobile_image_file']);

        return $data;
    }

    private function storeUpload(UploadedFile $file, string $directory): string
    {
        $disk = (string) config('filesystems.media_disk', 'public');
        $path = $file->store($directory, $disk);

        abort_if($path === false, 500, 'The image could not be stored.');

        return Storage::disk($disk)->url($path);
    }

    private function deleteManagedUpload(?string $url): void
    {
        if (! $url) {
            return;
        }

        $disk = (string) config('filesystems.media_disk', 'public');
        $prefix = rtrim(Storage::disk($disk)->url(''), '/').'/';

        if (str_starts_with($url, $prefix)) {
            Storage::disk($disk)->delete(substr($url, strlen($prefix)));
        }
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Support\ProductSku;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class ProductTransferController extends Controller
{
    /**
     * @var list<string>
     */
    private const HEADERS = [
        'sku',
        'name',
        'category_slug',
        'subtitle',
        'description',
        'ingredients',
        'usage',
        'price',
        'compare_price',
        'stock',
        'image_urls',
        'is_featured',
        'is_active',
    ];

    /**
     * @var list<string>
     */
    private const CATALOG_HEADERS = [
        'product_id',
        'category',
        'name',
        'color',
        'size',
        'price_ugx',
        'stock_status',
        'wholesale_price_ugx',
        'wholesale_min_qty',
    ];

    public function export(): StreamedResponse
    {
        return response()->streamDownload(function (): void {
            $output = fopen('php://output', 'w');
            abort_if($output === false, 500, 'Unable to create the export.');

            fwrite($output, "\xEF\xBB\xBF");
            fputcsv($output, self::HEADERS, ',', '"', '');

            Product::with('category')
                ->orderBy('id')
                ->chunk(500, function ($products) use ($output): void {
                    foreach ($products as $product) {
                        fputcsv($output, [
                            $this->spreadsheetSafe($product->sku),
                            $this->spreadsheetSafe($product->name),
                            $this->spreadsheetSafe($product->category?->slug),
                            $this->spreadsheetSafe($product->subtitle),
                            $this->spreadsheetSafe($product->description),
                            $this->spreadsheetSafe($product->ingredients),
                            $this->spreadsheetSafe($product->usage),
                            $product->price,
                            $product->compare_price,
                            $product->stock,
                            $this->spreadsheetSafe(implode('|', $product->images ?? [])),
                            $product->is_featured ? '1' : '0',
                            $product->is_active ? '1' : '0',
                        ], ',', '"', '');
                    }
                });

            fclose($output);
        }, 'ellena-products-'.now()->format('Y-m-d-His').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function template(): StreamedResponse
    {
        return response()->streamDownload(function (): void {
            $output = fopen('php://output', 'w');
            abort_if($output === false, 500, 'Unable to create the template.');

            fwrite($output, "\xEF\xBB\xBF");
            fputcsv($output, self::HEADERS, ',', '"', '');
            fputcsv($output, [
                '',
                'Example Hair Ritual',
                'hair-care',
                'Nourishing scalp treatment',
                'Replace this example with your product description.',
                'Ceramides, squalane, and peptides.',
                'Apply morning and evening.',
                '95.00',
                '110.00',
                '25',
                'https://example.com/cover.jpg|https://example.com/detail.jpg',
                '1',
                '1',
            ], ',', '"', '');
            fclose($output);
        }, 'ellena-product-import-template.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        $handle = fopen($request->file('file')->getRealPath(), 'r');
        if ($handle === false) {
            return back()->withErrors(['file' => 'The CSV file could not be read.']);
        }

        $delimiter = $this->detectDelimiter($handle);
        $headers = fgetcsv($handle, null, $delimiter, '"', '');
        if (! is_array($headers)) {
            fclose($handle);

            return back()->withErrors(['file' => 'The CSV file is empty.']);
        }

        $headers = array_map(
            fn (mixed $header): string => Str::of((string) $header)->replace("\xEF\xBB\xBF", '')->trim()->lower()->toString(),
            $headers,
        );
        $catalogFormat = array_diff(self::CATALOG_HEADERS, $headers) === [];
        $missingHeaders = $catalogFormat
            ? []
            : array_values(array_diff(self::HEADERS, $headers));

        if ($missingHeaders !== []) {
            fclose($handle);

            return back()->withErrors([
                'file' => 'Missing columns: '.implode(', ', $missingHeaders).'. Download the template and try again.',
            ]);
        }

        $categories = Category::pluck('id', 'slug');
        $created = 0;
        $updated = 0;
        $skipped = 0;
        $rowNumber = 1;
        $errors = [];

        while (($row = fgetcsv($handle, null, $delimiter, '"', '')) !== false) {
            $rowNumber++;

            if ($rowNumber > 5001) {
                $errors[] = ['row' => $rowNumber, 'errors' => ['The import is limited to 5,000 products per file.']];
                $skipped++;
                break;
            }

            if ($this->rowIsEmpty($row)) {
                continue;
            }

            if (count($row) > count($headers)) {
                $errors[] = ['row' => $rowNumber, 'errors' => ['The row has more columns than the header.']];
                $skipped++;

                continue;
            }

            $row = array_pad($row, count($headers), null);
            $values = array_combine($headers, array_slice($row, 0, count($headers)));

            $values = array_map(function (mixed $value): ?string {
                if (is_null($value)) {
                    return null;
                }

                $value = trim((string) $value);

                return preg_match("/^'[=+\\-@]/", $value) === 1 ? substr($value, 1) : $value;
            }, $values);

            if ($catalogFormat) {
                $values = $this->mapCatalogValues($values);
            }

            $values['is_featured'] = $this->normalizeBoolean($values['is_featured'] ?? null);
            $values['is_active'] = $this->normalizeBoolean($values['is_active'] ?? null);

            $validator = Validator::make($values, [
                'sku' => ['nullable', 'string', 'max:80'],
                'name' => ['required', 'string', 'max:190'],
                'category_slug' => ['required', 'string', 'max:190'],
                'subtitle' => ['nullable', 'string', 'max:190'],
                'color' => ['nullable', 'string', 'max:190'],
                'size' => ['nullable', 'string', 'max:80'],
                'description' => ['required', 'string'],
                'ingredients' => ['nullable', 'string'],
                'usage' => ['nullable', 'string'],
                'price' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
                'compare_price' => ['nullable', 'numeric', 'min:0', 'max:99999999.99', 'gte:price'],
                'wholesale_price' => ['nullable', 'numeric', 'min:0', 'max:99999999.99'],
                'wholesale_min_qty' => ['nullable', 'integer', 'min:1', 'max:4294967295'],
                'stock' => ['required', 'integer', 'min:0', 'max:4294967295'],
                'stock_status' => ['nullable', 'string', 'max:80'],
                'image_urls' => ['nullable', 'string'],
                'is_featured' => ['required', 'boolean'],
                'is_active' => ['required', 'boolean'],
            ]);

            $rowErrors = $validator->errors()->all();
            if (! $categories->has($values['category_slug'] ?? '')) {
                $rowErrors[] = "Category slug '{$values['category_slug']}' does not exist.";
            }

            $imageUrls = $values['image_urls'] ?? '';
            $images = collect(explode('|', is_string($imageUrls) ? $imageUrls : ''))
                ->map(fn (string $url) => trim($url))
                ->filter()
                ->values();

            if ($images->count() > 12) {
                $rowErrors[] = 'A product can have at most 12 image URLs.';
            }

            foreach ($images as $image) {
                if (! filter_var($image, FILTER_VALIDATE_URL) || parse_url($image, PHP_URL_SCHEME) !== 'https') {
                    $rowErrors[] = "Image URL '{$image}' must use HTTPS.";
                }
            }

            if ($rowErrors !== []) {
                if (count($errors) < 100) {
                    $errors[] = ['row' => $rowNumber, 'errors' => $rowErrors];
                }
                $skipped++;

                continue;
            }

            $name = $values['name'] ?? null;
            if (! is_string($name)) {
                $errors[] = ['row' => $rowNumber, 'errors' => ['The product name is invalid.']];
                $skipped++;

                continue;
            }

            try {
                $product = filled($values['sku'])
                    ? Product::where('sku', $values['sku'])->first()
                    : null;
                $attributes = [
                    'category_id' => $categories[$values['category_slug']],
                    'name' => $name,
                    'slug' => $product !== null ? $product->slug : $this->uniqueSlug($name),
                    'subtitle' => $values['subtitle'] ?: null,
                    'color' => $values['color'] ?? null,
                    'size' => $values['size'] ?? null,
                    'description' => $values['description'],
                    'ingredients' => $values['ingredients'] ?: null,
                    'usage' => $values['usage'] ?: null,
                    'price' => $values['price'],
                    'compare_price' => $values['compare_price'] ?: null,
                    'wholesale_price' => $values['wholesale_price'] ?? null,
                    'wholesale_min_qty' => $values['wholesale_min_qty'] ?? null,
                    'stock' => (int) $values['stock'],
                    'stock_status' => $values['stock_status'] ?? null,
                    'images' => $images->all(),
                    'is_featured' => (bool) $values['is_featured'],
                    'is_active' => (bool) $values['is_active'],
                ];

                if ($product) {
                    $product->update($attributes);
                    $updated++;
                } else {
                    Product::create([
                        'sku' => ProductSku::generate((int) $attributes['category_id']),
                        ...$attributes,
                    ]);
                    $created++;
                }
            } catch (Throwable $exception) {
                report($exception);
                if (count($errors) < 100) {
                    $errors[] = ['row' => $rowNumber, 'errors' => ['The product could not be saved.']];
                }
                $skipped++;
            }
        }

        fclose($handle);

        return to_route('admin.products.index')->with('import_result', [
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
            'errors' => $errors,
        ])->with('success', "Import complete: {$created} created, {$updated} updated, {$skipped} skipped.");
    }

    /**
     * @param  array<int, string|null>  $row
     */
    private function rowIsEmpty(array $row): bool
    {
        return collect($row)->every(fn (mixed $value) => trim((string) $value) === '');
    }

    private function normalizeBoolean(int|string|null $value): int|string|null
    {
        return match (strtolower((string) $value)) {
            '1', 'true', 'yes', 'y' => 1,
            '0', 'false', 'no', 'n' => 0,
            default => $value,
        };
    }

    /**
     * Map the Ellena catalogue spreadsheet to the fields used by the store.
     * The source contains availability, rather than a numeric inventory count,
     * so available products are imported with one purchasable unit by default.
     *
     * @param  array<string, string|null>  $values
     * @return array<string, string|null>
     */
    private function mapCatalogValues(array $values): array
    {
        $categorySlug = Str::slug((string) ($values['category'] ?? ''));
        $categorySlug = match ($categorySlug) {
            'hair' => 'hair-care',
            'body' => 'body-care',
            default => $categorySlug,
        };

        $stockStatus = $values['stock_status'] ?? null;
        $available = ! in_array(strtolower((string) $stockStatus), [
            'out-of-stock', 'out of stock', 'unavailable', 'inactive', 'discontinued',
        ], true);
        $name = $values['name'] ?? '';
        $color = $values['color'] ?? null;
        $size = $values['size'] ?? null;

        return [
            ...$values,
            'sku' => $values['product_id'] ?? null,
            'category_slug' => $categorySlug,
            'subtitle' => collect([$color, $size])->filter()->implode(' · ') ?: null,
            'description' => "{$name} from the Ellena Beauty collection.",
            'ingredients' => null,
            'usage' => null,
            'price' => $values['price_ugx'] ?? null,
            'compare_price' => null,
            'stock' => $available ? '1' : '0',
            'image_urls' => null,
            'is_featured' => '0',
            'is_active' => $available ? '1' : '0',
            'wholesale_price' => $values['wholesale_price_ugx'] ?? null,
            'wholesale_min_qty' => $values['wholesale_min_qty'] ?? null,
        ];
    }

    /**
     * Excel uses the operating system's list separator when a CSV is saved.
     * Accept the common alternatives so a downloaded template can be edited
     * and re-saved without appearing to have a single, invalid header column.
     *
     * @param  resource  $handle
     */
    private function detectDelimiter($handle): string
    {
        $firstLine = fgets($handle);
        rewind($handle);

        if (! is_string($firstLine)) {
            return ',';
        }

        $candidates = [',', ';', "\t"];
        $delimiter = ',';
        $highestCount = 0;

        foreach ($candidates as $candidate) {
            $count = substr_count($firstLine, $candidate);

            if ($count > $highestCount) {
                $delimiter = $candidate;
                $highestCount = $count;
            }
        }

        return $delimiter;
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'product';
        $slug = $base;
        $suffix = 2;

        while (Product::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }

    private function spreadsheetSafe(mixed $value): mixed
    {
        if (is_string($value) && preg_match('/^[=+\-@]/', $value) === 1) {
            return "'".$value;
        }

        return $value;
    }
}

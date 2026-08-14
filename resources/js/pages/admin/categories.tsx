import { Head, router, useForm } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import type { Category } from '@/types';

export default function Categories({ categories }: { categories: Category[] }) {
    const form = useForm({ name: '', description: '', image: '' });
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/admin/categories', { onSuccess: () => form.reset() });
    };

    return (
        <>
            <Head title="Categories" />
            <div>
                <p className="admin-eyebrow">Catalog</p>
                <h1 className="admin-title">Categories</h1>
                <p className="mt-2 text-sm text-stone-500">
                    Organize the Ellena collection into considered edits.
                </p>
            </div>
            <div className="mt-9 grid gap-6 xl:grid-cols-[380px_1fr]">
                <form onSubmit={submit} className="admin-card h-fit">
                    <h2 className="admin-section-title">Add category</h2>
                    <div className="mt-6 space-y-5">
                        <label className="admin-field">
                            <span>Name</span>
                            <input
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                            />
                            {form.errors.name && (
                                <small>{form.errors.name}</small>
                            )}
                        </label>
                        <label className="admin-field">
                            <span>Description</span>
                            <textarea
                                rows={4}
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                            />
                        </label>
                        <label className="admin-field">
                            <span>Cover image URL</span>
                            <input
                                value={form.data.image}
                                onChange={(e) =>
                                    form.setData('image', e.target.value)
                                }
                            />
                        </label>
                        <button className="admin-button w-full">
                            Create category
                        </button>
                    </div>
                </form>
                <section className="admin-card p-0">
                    <div className="overflow-x-auto">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Products</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((category) => (
                                    <tr key={category.id}>
                                        <td>
                                            <div className="flex items-center gap-4">
                                                {category.image ? (
                                                    <img
                                                        src={category.image}
                                                        className="h-12 w-12 object-cover"
                                                        alt=""
                                                    />
                                                ) : (
                                                    <div className="h-12 w-12 bg-stone-200" />
                                                )}
                                                <div>
                                                    <p className="font-semibold">
                                                        {category.name}
                                                    </p>
                                                    <small>
                                                        {category.slug}
                                                    </small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{category.products_count}</td>
                                        <td>
                                            <span
                                                className={`status ${category.is_active ? 'status-delivered' : 'status-cancelled'}`}
                                            >
                                                {category.is_active
                                                    ? 'Active'
                                                    : 'Hidden'}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <button
                                                onClick={() => {
                                                    if (
                                                        confirm(
                                                            `Delete ${category.name}?`,
                                                        )
                                                    ) {
                                                        router.delete(
                                                            `/admin/categories/${category.id}`,
                                                        );
                                                    }
                                                }}
                                                className="admin-icon text-red-600"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </>
    );
}

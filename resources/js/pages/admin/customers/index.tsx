import { Head, Link, router } from '@inertiajs/react';
import { Search, UserRound } from 'lucide-react';
import { useState } from 'react';
import { money } from '@/lib/money';
import type { Customer, Pagination } from '@/types';

export default function Customers({
    customers,
    search: initialSearch,
}: {
    customers: Pagination<Customer>;
    search: string;
}) {
    const [search, setSearch] = useState(initialSearch ?? '');

    return (
        <>
            <Head title="Customers" />
            <div>
                <p className="admin-eyebrow">Sales</p>
                <h1 className="admin-title">Customers</h1>
                <p className="mt-2 text-sm text-stone-500">
                    Understand the people behind every Ellena order.
                </p>
            </div>
            <section className="admin-card mt-9 p-0">
                <div className="border-b border-black/10 p-5">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            router.get(
                                '/admin/customers',
                                { search },
                                { preserveState: true },
                            );
                        }}
                        className="flex max-w-sm items-center gap-3 border border-black/15 px-4 py-2.5"
                    >
                        <Search size={16} />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search name or email"
                            className="w-full border-0 bg-transparent text-sm outline-none"
                        />
                    </form>
                </div>
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Joined</th>
                                <th>Orders</th>
                                <th>Total spent</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.data.map((customer) => (
                                <tr key={customer.id}>
                                    <td>
                                        <div className="flex items-center gap-4">
                                            <div className="grid h-11 w-11 place-items-center rounded-full bg-stone-100">
                                                <UserRound size={17} />
                                            </div>
                                            <div>
                                                <p className="font-semibold">
                                                    {customer.name}
                                                </p>
                                                <small>{customer.email}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {new Date(
                                            customer.created_at,
                                        ).toLocaleDateString()}
                                    </td>
                                    <td>{customer.orders_count ?? 0}</td>
                                    <td className="font-semibold">
                                        {money(customer.orders_sum_total ?? 0)}
                                    </td>
                                    <td className="text-right">
                                        <Link
                                            href={`/admin/customers/${customer.id}`}
                                            className="admin-secondary inline-flex"
                                        >
                                            View profile
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}

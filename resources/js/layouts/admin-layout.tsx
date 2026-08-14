import { Link, usePage } from '@inertiajs/react';
import {
    BadgePercent,
    Boxes,
    MessageSquareText,
    PackageSearch,
    LayoutDashboard,
    LogOut,
    Mail,
    Menu,
    Images,
    Package,
    Settings,
    ShoppingCart,
    Store,
    Tags,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

const groups = [
    {
        label: 'Overview',
        links: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
        label: 'Catalog',
        links: [
            { href: '/admin/products', label: 'Products', icon: Package },
            { href: '/admin/categories', label: 'Categories', icon: Tags },
            {
                href: '/admin/inventory',
                label: 'Inventory',
                icon: PackageSearch,
            },
        ],
    },
    {
        label: 'Marketing',
        links: [
            {
                href: '/admin/banners',
                label: 'Ad banners',
                icon: Images,
            },
            {
                href: '/admin/discounts',
                label: 'Discounts',
                icon: BadgePercent,
            },
            {
                href: '/admin/newsletter',
                label: 'Newsletter',
                icon: Mail,
            },
        ],
    },
    {
        label: 'Sales',
        links: [
            { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
            { href: '/admin/customers', label: 'Customers', icon: Users },
        ],
    },
    {
        label: 'Experience',
        links: [
            {
                href: '/admin/reviews',
                label: 'Reviews',
                icon: MessageSquareText,
            },
            {
                href: '/admin/settings',
                label: 'Store settings',
                icon: Settings,
            },
        ],
    },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const { url } = usePage();
    const [open, setOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#f5f4f1] text-[#171715]">
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#171715] text-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex h-24 items-center justify-between border-b border-white/10 px-8">
                    <Link
                        href="/admin"
                        className="font-serif text-3xl tracking-[-.05em]"
                    >
                        ELLENA
                    </Link>
                    <button
                        onClick={() => setOpen(false)}
                        className="lg:hidden"
                    >
                        <X />
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto px-4 pb-5">
                    {groups.map((group) => (
                        <div key={group.label}>
                            <div className="px-4 pt-7 pb-2 text-[9px] font-semibold tracking-[.2em] text-white/35 uppercase">
                                {group.label}
                            </div>
                            <div className="flex flex-col gap-1">
                                {group.links.map(
                                    ({ href, label, icon: Icon }) => (
                                        <Link
                                            key={href}
                                            href={href}
                                            className={`flex items-center gap-4 px-4 py-3 text-sm transition ${url === href || (href !== '/admin' && url.startsWith(href)) ? 'bg-white text-black' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                                        >
                                            <Icon size={17} />
                                            {label}
                                        </Link>
                                    ),
                                )}
                            </div>
                        </div>
                    ))}
                </nav>
                <div className="mt-auto border-t border-white/10 p-4">
                    <Link
                        href="/"
                        className="flex items-center gap-4 px-4 py-3 text-sm text-white/60 hover:text-white"
                    >
                        <Store size={18} />
                        View storefront
                    </Link>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="flex w-full items-center gap-4 px-4 py-3 text-sm text-white/60 hover:text-white"
                    >
                        <LogOut size={18} />
                        Sign out
                    </Link>
                </div>
            </aside>
            <div className="lg:pl-72">
                <header className="flex h-20 items-center justify-between border-b border-black/10 bg-white px-5 md:px-10">
                    <button onClick={() => setOpen(true)} className="lg:hidden">
                        <Menu />
                    </button>
                    <div className="hidden items-center gap-3 text-xs font-semibold tracking-widest uppercase lg:flex">
                        <Boxes size={17} /> Commerce administration
                    </div>
                    <span
                        className="h-2 w-2 rounded-full bg-emerald-500"
                        title="Store online"
                    />
                </header>
                <main className="p-5 md:p-10">{children}</main>
            </div>
        </div>
    );
}

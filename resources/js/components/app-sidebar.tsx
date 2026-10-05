import { Link, usePage } from '@inertiajs/react';
import {
    BadgePercent,
    BookOpen,
    Inbox,
    LayoutGrid,
    Layers3,
    Heart,
    History,
    Package,
    ShoppingCart,
    ReceiptText,
    Store,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

const footerNavItems: NavItem[] = [
    { title: 'Visit storefront', href: '/', icon: Store },
];

export function AppSidebar() {
    const user = usePage().props.auth.user;
    const items = user?.is_admin
        ? [
              ...mainNavItems,
              { title: 'Admin overview', href: '/admin', icon: LayoutGrid },
              { title: 'Products', href: '/admin/products', icon: Package },
              { title: 'Rituals', href: '/admin/rituals', icon: Layers3 },
              {
                  title: 'Beauty guides',
                  href: '/admin/beauty-guides',
                  icon: BookOpen,
              },
              { title: 'Orders', href: '/admin/orders', icon: ShoppingCart },
              {
                  title: 'Contact inbox',
                  href: '/admin/contact-submissions',
                  icon: Inbox,
              },
              { title: 'Customers', href: '/admin/customers', icon: Users },
              {
                  title: 'Discounts',
                  href: '/admin/discounts',
                  icon: BadgePercent,
              },
          ]
        : [
              ...mainNavItems,
              {
                  title: 'Saved rituals',
                  href: '/dashboard#saved',
                  icon: Heart,
              },
              {
                  title: 'Recently viewed',
                  href: '/dashboard#recently-viewed',
                  icon: History,
              },
              {
                  title: 'My orders',
                  href: '/dashboard#orders',
                  icon: ReceiptText,
              },
          ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={items} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

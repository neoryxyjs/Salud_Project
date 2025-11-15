'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/crm',
    icon: LayoutDashboard,
  },
  {
    title: 'Leads',
    href: '/crm/leads',
    icon: Users,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-6">
        <span className="font-bold text-lg">QuePlan CRM</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-secondary'
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/auth/login">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Link>
        </Button>
      </div>
    </div>
  );
}


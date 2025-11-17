'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, LogOut, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

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
  {
    title: 'Planes',
    href: '/crm/plans',
    icon: FileText,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/auth/logout');
      return data;
    },
    onSuccess: () => {
      router.push('/auth/login');
    },
    onError: () => {
      // Aún así redirigir al login si hay error
      router.push('/auth/login');
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-6">
        <span className="font-bold text-lg">Solucion De Salud CRM</span>
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
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {logoutMutation.isPending ? 'Cerrando...' : 'Cerrar Sesión'}
        </Button>
      </div>
    </div>
  );
}


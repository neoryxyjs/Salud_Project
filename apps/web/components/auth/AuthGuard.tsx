'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // Verificar autenticación haciendo una petición a un endpoint protegido
  const { data, error, isLoading } = useQuery({
    queryKey: ['auth-check'],
    queryFn: async () => {
      // Intentar obtener las estadísticas del dashboard (endpoint protegido)
      const { data } = await api.get('/leads/stats/summary');
      return data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  useEffect(() => {
    if (!isLoading) {
      if (error && (error as any).response?.status === 401) {
        // No autenticado, redirigir al login
        router.push('/auth/login');
      } else if (data) {
        // Autenticado, permitir acceso
        setIsChecking(false);
      }
    }
  }, [isLoading, error, data, router]);

  // Mostrar loading mientras se verifica
  if (isLoading || isChecking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si hay error y no es 401, mostrar error
  if (error && (error as any).response?.status !== 401) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Error al verificar autenticación</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="mt-4 text-primary hover:underline"
          >
            Ir al login
          </button>
        </div>
      </div>
    );
  }

  // Si está autenticado, mostrar el contenido
  return <>{children}</>;
}


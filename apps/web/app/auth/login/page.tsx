'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Lock, Mail, Shield, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { data } = await api.post('/auth/login', credentials);
      return data;
    },
    onSuccess: () => {
      router.push('/crm');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error al iniciar sesión');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-orange-500/5 relative overflow-hidden py-8 px-4 sm:px-6 lg:px-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 opacity-10">
        <div className="absolute top-10 left-4 sm:top-20 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-4 sm:bottom-20 sm:right-10 w-64 h-64 sm:w-96 sm:h-96 bg-orange-500 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md">
        <Card className="border-2 shadow-2xl bg-background/95 backdrop-blur-sm">
          <CardHeader className="space-y-3 sm:space-y-4 pb-4 sm:pb-6 px-4 sm:px-6 pt-6 sm:pt-8">
            <div className="flex items-center justify-center mb-2 sm:mb-4">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>
            <div className="text-center space-y-1 sm:space-y-2">
              <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
                SolucionSalud CRM
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Accede al panel de control
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                  <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-10 sm:h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <span className="mr-2">Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Shield, TrendingUp, CheckCircle2, User, Mail, Phone } from 'lucide-react';
import { api } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { validateRUT, formatRUT } from '@/lib/rut-validator';

const REASONS = [
  { id: 'muy_cara', label: 'Muy cara' },
  { id: 'cubre_poco', label: 'La isapre me cubre poco' },
  { id: 'subieron_plan', label: 'Me subieron el plan de salud' },
  { id: 'mejorar_coberturas', label: 'Mejorar coberturas' },
  { id: 'no_gusta', label: 'No me gusta mi Isapre actual' },
  { id: 'otros', label: 'Otros' },
];

export default function HomePage() {
  const router = useRouter();
  const [utmParams, setUtmParams] = useState<Record<string, string>>({});

  useEffect(() => {
    // Capturar UTM parameters de la URL solo en el cliente
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const utm: Record<string, string> = {};
      if (params.get('utm_source')) utm.utm_source = params.get('utm_source')!;
      if (params.get('utm_medium')) utm.utm_medium = params.get('utm_medium')!;
      if (params.get('utm_campaign')) utm.utm_campaign = params.get('utm_campaign')!;
      setUtmParams(utm);
    }
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    region: '',
    reasons: [] as string[],
    comments: '',
  });
  const [rut, setRut] = useState('');
  const [rutError, setRutError] = useState('');

  const handleRutChange = (value: string) => {
    setRut(value);
    if (value && !validateRUT(value)) {
      setRutError('RUT inválido');
    } else {
      setRutError('');
    }
  };

  const handleReasonToggle = (reasonId: string, checked: boolean) => {
    setFormData(prev => {
      if (checked) {
        // Agregar si no está ya incluido
        if (prev.reasons.includes(reasonId)) {
          return prev;
        }
        return {
          ...prev,
          reasons: [...prev.reasons, reasonId]
        };
      } else {
        // Remover si está incluido
        return {
          ...prev,
          reasons: prev.reasons.filter(r => r !== reasonId)
        };
      }
    });
  };

  const leadMutation = useMutation({
    mutationFn: async (data: any) => {
      // Usar UTM parameters capturados
      const queryString = new URLSearchParams(utmParams).toString();
      
      const url = queryString 
        ? `/leads?${queryString}`
        : '/leads';
      
      const { data: response } = await api.post(url, data);
      return response;
    },
    onSuccess: () => {
      router.push('/comparador?lead=success');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rut && rutError) {
      return;
    }
    
    if (formData.reasons.length === 0) {
      return;
    }
    
    leadMutation.mutate({
      ...formData,
      rut: rut || undefined,
    });
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section con Formulario */}
      <section className="container space-y-6 py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center gap-4 text-center">
          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
            Compara Planes de Salud
            <br />
            <span className="text-primary">Encuentra el Mejor Plan</span>
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Compara planes de salud de las principales Isapres de Chile. Encuentra el plan que mejor se adapte a tus necesidades y presupuesto.
          </p>
        </div>

        {/* Formulario Asesoría Gratuita */}
        <div className="mx-auto max-w-3xl mt-8">
          <Card className="border-2">
            <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
              <Button className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 mb-4" type="button">
                Asesoría Gratuita
              </Button>
              <CardTitle className="text-2xl text-center text-primary-foreground">
                ¿Quieres revisar tu Isapre?
              </CardTitle>
              <CardDescription className="text-center text-primary-foreground/90">
                Cuéntanos qué te gustaría mejorar y te ayudaremos a encontrar la mejor opción
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información Personal */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Nombre completo *
                    </Label>
                    <Input
                      id="name"
                      placeholder="Juan Pérez"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="juan@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Teléfono *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+56 9 1234 5678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Motivos */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">
                    ¿Cuáles son los motivos para revisar tu Isapre? * (Selecciona todas las que apliquen)
                  </Label>
                  <div className="space-y-2">
                    {REASONS.map((reason) => {
                      const isChecked = formData.reasons.includes(reason.id);
                      return (
                        <div
                          key={reason.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                            isChecked
                              ? 'bg-primary/10 border-primary'
                              : 'bg-muted/50 hover:bg-muted'
                          }`}
                        >
                          <Checkbox
                            id={reason.id}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              handleReasonToggle(reason.id, checked === true);
                            }}
                          />
                          <Label
                            htmlFor={reason.id}
                            className="flex-1 cursor-pointer font-normal"
                          >
                            {reason.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Comentarios */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Cuéntanos más sobre tu situación
                  </Label>
                  <Textarea
                    placeholder="Describe tu motivo aquí..."
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Botón Enviar */}
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full"
                  disabled={leadMutation.isPending || (rut && !!rutError) || formData.reasons.length === 0}
                >
                  {leadMutation.isPending ? 'Enviando...' : 'Enviar Solicitud'}
                </Button>
                
                {leadMutation.isSuccess && (
                  <div className="flex items-center gap-2 text-green-600 justify-center">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>¡Formulario enviado exitosamente! Te contactaremos pronto.</span>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center gap-4 mt-4">
          <Button variant="outline" size="lg" asChild>
            <Link href="/comparador">Ver Comparador</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container space-y-6 py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center gap-4 text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            ¿Por qué elegir QuePlan?
          </h2>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          <Card>
            <CardHeader>
              <Search className="h-8 w-8 mb-2" />
              <CardTitle>Comparación Fácil</CardTitle>
              <CardDescription>
                Compara múltiples planes de salud en un solo lugar
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 mb-2" />
              <CardTitle>Información Confiable</CardTitle>
              <CardDescription>
                Datos actualizados de las principales Isapres
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 mb-2" />
              <CardTitle>Mejores Precios</CardTitle>
              <CardDescription>
                Encuentra el plan que mejor se adapte a tu presupuesto
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
}


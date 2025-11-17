'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, ArrowLeft, MessageCircle, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { validateRUT, formatRUT } from '@/lib/rut-validator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CHILEAN_REGIONS } from '@/lib/constants';

export default function FormularioPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    region: '',
  });
  const [rut, setRut] = useState('');
  const [rutError, setRutError] = useState('');
  const [utmParams, setUtmParams] = useState<Record<string, string>>({});
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [submittedPhone, setSubmittedPhone] = useState('');

  // Número de WhatsApp
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+56994959513';
  
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(`Hola, acabo de enviar mi solicitud de asesoría. Mi teléfono es: ${submittedPhone}`);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  useEffect(() => {
    // Capturar UTM parameters de la URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const utm: Record<string, string> = {};
      if (params.get('utm_source')) utm.utm_source = params.get('utm_source')!;
      if (params.get('utm_medium')) utm.utm_medium = params.get('utm_medium')!;
      if (params.get('utm_campaign')) utm.utm_campaign = params.get('utm_campaign')!;
      setUtmParams(utm);
    }
  }, []);

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
    onSuccess: (data, variables) => {
      setSubmittedPhone(variables.phone || '');
      setShowSuccessNotification(true);
      // Resetear formulario
      setFormData({
        name: '',
        email: '',
        phone: '',
        region: '',
      });
      setRut('');
      setRutError('');
      // Scroll suave hacia arriba para mostrar la notificación
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  const handleRutChange = (value: string) => {
    const cleanValue = value.replace(/\./g, '').replace(/-/g, '');
    
    if (cleanValue.length >= 8) {
      const formatted = formatRUT(cleanValue);
      if (!validateRUT(formatted)) {
        setRutError('RUT inválido');
        setRut(formatted);
      } else {
        setRutError('');
        setRut(formatted);
      }
    } else {
      setRut(cleanValue);
      setRutError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rut && rutError) {
      alert('Por favor corrige el RUT antes de enviar');
      return;
    }
    
    leadMutation.mutate({
      ...formData,
      rut: rut || undefined,
    });
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
      {/* Notificación de éxito */}
      {showSuccessNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md animate-in slide-in-from-top-4 duration-500">
          <Card className="border-2 border-green-500 shadow-2xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg text-green-900 dark:text-green-100">
                      ¡Solicitud enviada exitosamente!
                    </h3>
                    <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                      Hemos recibido tu información. Nos pondremos en contacto contigo pronto.
                    </p>
                  </div>
                  <Button
                    onClick={handleWhatsAppClick}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                    size="sm"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contactar vía WhatsApp
                  </Button>
                </div>
                <button
                  onClick={() => setShowSuccessNotification(false)}
                  className="flex-shrink-0 text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Solicita tu Cotización</CardTitle>
            <CardDescription>
              Completa el formulario y te contactaremos pronto
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leadMutation.isSuccess ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">¡Gracias por tu interés!</h3>
                  <p className="text-muted-foreground mb-4">
                    Hemos recibido tu información. Nos pondremos en contacto contigo pronto.
                  </p>
                  <div className="space-y-2">
                    <Button
                      onClick={handleWhatsAppClick}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Contactar vía WhatsApp
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/comparador">Comparar Planes</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo *</Label>
                  <Input
                    id="name"
                    placeholder="Juan Pérez"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="juan@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+56 9 1234 5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rut">R.U.T.</Label>
                  <Input
                    id="rut"
                    placeholder="12.345.678-9"
                    value={rut}
                    onChange={(e) => handleRutChange(e.target.value)}
                  />
                  {rutError && (
                    <p className="text-sm text-destructive">{rutError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Región *</Label>
                  <Select 
                    value={formData.region} 
                    onValueChange={(value) => setFormData({ ...formData, region: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar región" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHILEAN_REGIONS.map((region) => (
                        <SelectItem key={region.value} value={region.value}>
                          {region.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={leadMutation.isPending || (rut ? rutError !== '' : false)}
                >
                  {leadMutation.isPending ? 'Enviando...' : 'Enviar Solicitud'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Al enviar este formulario, aceptas que nos pongamos en contacto contigo.
        </p>
      </div>
    </div>
  );
}


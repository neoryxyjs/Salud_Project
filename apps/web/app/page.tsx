'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Shield, TrendingUp, CheckCircle2, User, Mail, Phone, ArrowRight, ExternalLink, FileText, BookOpen, Scale, FileCheck, Users, Heart, Download, Newspaper, Briefcase, FileDown, Calendar, MessageCircle, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { validateRUT, formatRUT } from '@/lib/rut-validator';
import { CHILEAN_REGIONS } from '@/lib/constants';

const REASONS = [
  { id: 'muy_cara', label: 'Muy cara' },
  { id: 'cubre_poco', label: 'La isapre me cubre poco' },
  { id: 'subieron_plan', label: 'Me subieron el plan de salud' },
  { id: 'mejorar_coberturas', label: 'Mejorar coberturas' },
  { id: 'no_gusta', label: 'No me gusta mi Isapre actual' },
  { id: 'otros', label: 'Otros' },
];

function NewsSection() {
  const { data: news, isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const { data } = await api.get('/news?limit=3');
      return data;
    },
    staleTime: 7 * 24 * 60 * 60 * 1000, // Cache por 7 días (semanal)
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!news || news.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No hay noticias disponibles en este momento.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
      {news.map((item: any, index: number) => (
        <Card key={index} className="hover:shadow-lg transition-shadow border-2 h-full flex flex-col">
          {item.image && (
            <div className="w-full h-48 bg-muted overflow-hidden rounded-t-lg relative">
              <Image 
                src={item.image} 
                alt={item.title}
                fill
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <CardHeader className="flex-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Calendar className="h-3 w-3" />
              <span>
                {item.publishedAt 
                  ? new Date(item.publishedAt).toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Fecha no disponible'}
              </span>
            </div>
            <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
            <CardDescription className="text-sm line-clamp-3">
              {item.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{item.source}</span>
              <Button 
                variant="outline" 
                size="sm"
                asChild
              >
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  Leer más
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [utmParams, setUtmParams] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);

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
    currentInsurer: '',
    reasons: [] as string[],
    comments: '',
  });
  const [rut, setRut] = useState('');
  const [rutError, setRutError] = useState('');
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [submittedPhone, setSubmittedPhone] = useState('');

  // Número de WhatsApp
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+56994959513';
  
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(`Hola, acabo de enviar mi solicitud de asesoría. Mi teléfono es: ${submittedPhone}`);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

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
    onSuccess: (data, variables) => {
      setSubmittedPhone(variables.phone || '');
      setShowSuccessNotification(true);
      // Resetear formulario
      setFormData({
        name: '',
        email: '',
        phone: '',
        region: '',
        currentInsurer: '',
        reasons: [],
        comments: '',
      });
      setRut('');
      setRutError('');
      setShowForm(false);
      // Scroll suave hacia arriba para mostrar la notificación
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rut && rutError) {
      return;
    }
    
    if (formData.reasons.length === 0) {
      alert('Por favor selecciona al menos un motivo');
      return;
    }
    
    leadMutation.mutate({
      ...formData,
      rut: rut || undefined,
      reasons: formData.reasons, // Asegurar que se envíen los motivos
    });
  };

  return (
    <div className="flex flex-col">
      {/* Notificación de éxito - Fixed para no interferir con el scroll */}
      {showSuccessNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-md animate-in slide-in-from-top-4 duration-500">
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

      {/* Sección Inicio - Primera sección visible */}
      <section id="inicio" className={`relative w-full overflow-hidden min-h-screen ${showForm ? 'pt-12 sm:pt-16 md:pt-20 lg:pt-28 pb-16 sm:pb-20 md:pb-24 lg:pb-32' : 'py-12 sm:py-16 md:py-20 lg:py-28'}`}>
        {/* Background Image de Isapres - Semi-transparente */}
        <div 
          className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat w-full h-full"
          style={{
            backgroundImage: `url('https://www.ciperchile.cl/wp-content/uploads/isapres--e1658269664927.jpg')`,
          }}
        >
          {/* Overlay semi-transparente para legibilidad y efecto visual */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/70 via-primary/50 to-orange-600/60"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/60 to-background/70"></div>
          <div className="absolute inset-0 bg-background/40"></div>
        </div>
        
        {/* Elementos decorativos vibrantes en el fondo */}
        <div className="absolute inset-0 -z-10 w-full">
          <div className="absolute top-10 left-4 sm:top-20 sm:left-10 w-64 h-64 sm:w-96 sm:h-96 bg-primary rounded-full blur-3xl opacity-25 animate-pulse"></div>
          <div className="absolute bottom-10 right-4 sm:bottom-20 sm:right-10 w-80 h-80 sm:w-[500px] sm:h-[500px] bg-orange-500 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute top-1/2 left-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-blue-400 rounded-full blur-3xl opacity-15"></div>
        </div>
        
        <div className="container mx-auto relative z-10 px-4 sm:px-6 flex items-center justify-center min-h-[calc(100vh-80px)]">
          {/* Hero Section */}
          <div className="flex max-w-[58rem] mx-auto flex-col items-center gap-4 sm:gap-6 text-center w-full">
            <div className="space-y-4 sm:space-y-6 w-full px-2">
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-tight drop-shadow-lg text-foreground">
                Compara Planes de Salud
                <br />
                <span className="bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent drop-shadow-md">
                  Encuentra el Mejor Plan
                </span>
              </h1>
              <p className="max-w-[42rem] mx-auto leading-relaxed text-foreground/95 text-base sm:text-lg md:text-xl sm:leading-8 text-balance px-2 drop-shadow-md font-semibold">
                Compara planes de salud de las principales Isapres de Chile. Encuentra el plan que mejor se adapte a tus necesidades y presupuesto.
              </p>
            </div>
            
            {/* Botones CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-7 rounded-full font-semibold group w-full sm:w-auto min-w-[200px] sm:min-w-[220px]"
                onClick={() => setShowForm(true)}
              >
                Asesoría Gratuita
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto border-2 shadow-lg hover:shadow-xl transition-all duration-300 text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-7 rounded-full font-semibold min-w-[200px] sm:min-w-[220px]" 
                asChild
              >
                <Link href="/comparador">Ver Comparador</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Formulario Asesoría Gratuita - Modal/Overlay encima de la página */}
      {showForm && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowForm(false)}
        >
          <div 
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-500 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-2 shadow-2xl hover:shadow-3xl transition-shadow duration-300 overflow-hidden bg-background">
              {/* Botón cerrar */}
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-4 right-4 z-10 rounded-full bg-background/80 backdrop-blur-sm p-2 hover:bg-muted transition-colors shadow-lg"
                aria-label="Cerrar formulario"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
              <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-t-lg p-4 sm:p-6 md:p-8">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl text-center text-primary-foreground font-bold">
                  ¿Quieres revisar tu Isapre?
                </CardTitle>
                <CardDescription className="text-center text-primary-foreground/95 text-sm sm:text-base mt-2">
                  Cuéntanos qué te gustaría mejorar y te ayudaremos a encontrar la mejor opción
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 md:p-8 bg-gradient-to-b from-background to-muted/30">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Motivos */}
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm sm:text-base font-semibold">
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
                  <Label className="text-sm sm:text-base font-semibold">
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

                {/* Información Personal */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-base sm:text-lg font-semibold">Datos Personales</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
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
                    <div className="space-y-2">
                      <Label htmlFor="rut">R.U.T.</Label>
                      <Input
                        id="rut"
                        placeholder="12.345.678-9"
                        value={rut}
                        onChange={(e) => {
                          const value = e.target.value;
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
                        }}
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
                        <SelectContent className="!z-[110]">
                          {CHILEAN_REGIONS.map((region) => (
                            <SelectItem key={region.value} value={region.value}>
                              {region.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentInsurer">Isapre Actual</Label>
                      <Select 
                        value={formData.currentInsurer} 
                        onValueChange={(value) => setFormData({ ...formData, currentInsurer: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar Isapre actual" />
                        </SelectTrigger>
                        <SelectContent className="!z-[110]">
                          <SelectItem value="none">No tengo Isapre</SelectItem>
                          <SelectItem value="banmedica">Banmédica</SelectItem>
                          <SelectItem value="colmena">Colmena Golden Cross</SelectItem>
                          <SelectItem value="consalud">Consalud</SelectItem>
                          <SelectItem value="cruz-blanca">Cruz Blanca</SelectItem>
                          <SelectItem value="esencial">Esencial Isapre</SelectItem>
                          <SelectItem value="nueva-masvida">Nueva Masvida</SelectItem>
                          <SelectItem value="vida-tres">Vida Tres</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Botón Enviar */}
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 text-base sm:text-lg py-5 sm:py-6 font-semibold"
                  disabled={leadMutation.isPending || (rut ? rutError !== '' : false) || formData.reasons.length === 0 || !formData.region}
                >
                  {leadMutation.isPending ? 'Enviando...' : 'Enviar Solicitud'}
                </Button>
                
              </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Sección Beneficios - Aparece al hacer scroll */}
      <section className="relative w-full py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden scroll-mt-20">
        {/* Background con imagen y gradiente */}
        <div 
          className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat w-full h-full"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-background/70 to-orange-500/30"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background/70"></div>
        </div>
        
        {/* Elementos decorativos */}
        <div className="absolute inset-0 -z-10 w-full opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto space-y-8 sm:space-y-12 px-4 sm:px-6 relative z-10">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center gap-3 sm:gap-4 text-center px-2">
            <p className="text-primary text-xs sm:text-sm font-semibold uppercase tracking-wider">BENEFICIOS</p>
            <h2 className="font-heading text-2xl sm:text-3xl leading-[1.1] md:text-4xl lg:text-5xl xl:text-6xl font-bold drop-shadow-md text-foreground">
              ¿Por qué elegir <span className="text-primary drop-shadow-lg">Solucion De Salud</span>?
            </h2>
          </div>
          <div className="mx-auto grid justify-center gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3 px-2">
            <Card className="border-2 hover:border-primary/50 hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <CardHeader className="space-y-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Search className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">Comparación Fácil</CardTitle>
                <CardDescription className="text-base">
                  Compara múltiples planes de salud en un solo lugar
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-2 hover:border-primary/50 hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <CardHeader className="space-y-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Shield className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">Información Confiable</CardTitle>
                <CardDescription className="text-base">
                  Datos actualizados de las principales Isapres
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-2 hover:border-primary/50 hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <CardHeader className="space-y-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">Mejores Precios</CardTitle>
                <CardDescription className="text-base">
                  Encuentra el plan que mejor se adapte a tu presupuesto
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Sección Quienes Somos - Aparece al hacer scroll */}
      <section id="quienes-somos" className="relative w-full py-12 sm:py-16 md:py-24 overflow-hidden scroll-mt-20">
        {/* Background con imagen */}
        <div 
          className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat w-full"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-background/80 to-primary/20"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background/80"></div>
        </div>
        
        {/* Elementos decorativos */}
        <div className="absolute inset-0 -z-10 w-full opacity-15">
          <div className="absolute top-20 right-20 w-64 h-64 bg-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-primary rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid gap-8 sm:gap-10 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6 sm:space-y-8">
              <div className="space-y-2 sm:space-y-3">
                <p className="text-primary text-xs sm:text-sm font-semibold uppercase tracking-wider">NUESTRA EMPRESA</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary drop-shadow-md">SOLUCION DE SALUD</h2>
                <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent drop-shadow-lg">
                  QUIENES SOMOS
                </h3>
              </div>
              <div className="space-y-4 sm:space-y-6 text-muted-foreground">
                <p className="text-base sm:text-lg leading-relaxed">
                  Solucion De Salud es una plataforma web <strong className="text-foreground font-semibold">100% en línea y gratuita</strong>, para cotizar y comparar planes de salud de todas las Isapres de Chile.
                </p>
                <p className="leading-relaxed text-sm sm:text-base">
                  Nuestra plataforma concentra la información de todos los planes de todas las Isapres. La plataforma es muy fácil de usar, podrás seleccionar, comparar y elegir el plan que más se adapte a tus necesidades de salud y cobertura.
                </p>
                <p className="leading-relaxed text-sm sm:text-base">
                  Sólo debes hacer clic y uno de nuestros ejecutivos se contactará a la brevedad. No tomes decisiones sin informarte, deja que nosotros te ayudemos a elegir el mejor plan. Nuestros ejecutivos te brindarán una asesoría cercana y amigable.
                </p>
              </div>
            </div>
            <div>
              <Card className="md:sticky md:top-24 border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-primary">Lo que necesitas saber</CardTitle>
                  <CardDescription className="text-sm">
                    Información importante sobre Isapres y planes de salud
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                <a 
                  href="https://www.superdesalud.gob.cl/registro/isapres/#:~:text=Las%20Instituciones%20de%20Salud%20Previsional,seis%20abiertas%20y%20tres%20cerradas)" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium text-sm">Qué son las Isapres</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </a>
                <a 
                  href="#que-son-planes" 
                  className="flex items-center justify-between p-4 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium text-sm">Qué son los planes de salud</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </a>
                <a 
                  href="https://www.superdesalud.gob.cl/tax-marco-normativo/leyes-3002/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Scale className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium text-sm">Normativa vigente MINSAL</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </a>
                <a 
                  href="https://www.superdesalud.gob.cl/tax-materias-prestadores/ley-de-derechos-y-deberes-4185/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium text-sm">Derecho de los usuarios</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </a>
                <a 
                  href="https://www.superdesalud.gob.cl/tax-materias-isapres/contrato-de-salud-3464/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <FileCheck className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium text-sm">Contratos de Salud</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </a>
              </CardContent>
            </Card>
          </div>
          </div>
        </div>
      </section>

      {/* Sección Plataforma - Aparece al hacer scroll */}
      <section id="plataforma" className="relative w-full py-12 sm:py-16 md:py-20 lg:py-28 overflow-hidden scroll-mt-20">
        {/* Background con imagen */}
        <div 
          className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat w-full"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 via-background/70 to-primary/30"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/75 to-background/60"></div>
        </div>
        
        {/* Background decorative elements más vibrantes */}
        <div className="absolute inset-0 -z-10 w-full opacity-25">
          <div className="absolute top-0 right-0 w-96 h-96 sm:w-[600px] sm:h-[600px] bg-primary rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 sm:w-[500px] sm:h-[500px] bg-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-400 rounded-full blur-3xl opacity-30"></div>
        </div>
        
        <div className="container mx-auto relative z-10 px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16 md:mb-20 space-y-3 sm:space-y-5 px-2">
            <p className="text-primary text-xs sm:text-sm font-semibold uppercase tracking-wider">SOMOS LA MEJOR PLATAFORMA</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent drop-shadow-lg">
              PARA COTIZAR PLANES DE ISAPRE
            </h2>
            <p className="text-foreground/90 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed drop-shadow-sm font-medium">
              Hacemos que sea simple y fácil la búsqueda de planes de Isapre, tanto para cotizantes y ejecutivos.
            </p>
          </div>
          <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-12 sm:mb-16">
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group bg-background/50 backdrop-blur-sm">
              <CardHeader className="space-y-4 pb-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                  <Users className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-xl text-primary group-hover:text-primary/90 transition-colors">Asesores profesionales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Contamos con ejecutivos altamente calificados y de mucha experiencia en el mercado.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group bg-background/50 backdrop-blur-sm">
              <CardHeader className="space-y-4 pb-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                  <Search className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-xl text-primary group-hover:text-primary/90 transition-colors">Cotizar es fácil</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  De forma rápida y simple podrás elegir uno o más planes y contactar a un ejecutivo en menos de 30 minutos.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group bg-background/50 backdrop-blur-sm">
              <CardHeader className="space-y-4 pb-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                  <Heart className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-xl text-primary group-hover:text-primary/90 transition-colors">Planes a tu medida</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  En Solucion De Salud encontrarás el plan que más se acomode a tu perfil y al de tu familia.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center px-4">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-7 rounded-full font-semibold group w-full sm:w-auto"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('inicio')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Cotiza tu plan de isapre ahora!
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Sección Superintendencia - Aparece al hacer scroll */}
      <section id="superintendencia" className="relative w-full py-12 sm:py-16 md:py-20 lg:py-28 overflow-hidden scroll-mt-20">
        {/* Background con imagen */}
        <div 
          className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat w-full"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1582719471384-894fbb16e074?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/25 via-background/75 to-primary/25"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background/80"></div>
        </div>
        
        {/* Elementos decorativos */}
        <div className="absolute inset-0 -z-10 w-full opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-primary rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground p-6 sm:p-8 md:p-10 lg:p-14 rounded-2xl mb-12 sm:mb-16 text-center shadow-2xl relative overflow-hidden">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 border-2 border-primary-foreground rounded-full -mr-16 sm:-mr-32 -mt-16 sm:-mt-32"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-48 sm:h-48 border-2 border-primary-foreground rounded-full -ml-12 sm:-ml-24 -mb-12 sm:-mb-24"></div>
            </div>
            <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">SUPERINTENDENCIA DE SALUD</h2>
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">TUS DERECHOS, NUESTRA PRIORIDAD</h3>
              <p className="max-w-3xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed opacity-95 px-2">
                La Misión de la Superintendencia de Salud es proteger, promover, y velar por el cumplimiento igualitario de los derechos de las personas en salud, con relación a Fonasa, Isapres y prestadores.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow border-2">
              <CardHeader className="space-y-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Caracterización de los profesionales de la salud en Chile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Esta herramienta permitirá observar periódicamente las magnitudes de un conjunto de características de profesionales, técnicos y auxiliares de salud del país.
                </p>
                <Button variant="outline" className="w-full text-orange-600 border-orange-600 hover:bg-orange-50">
                  Ver Más
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow border-2">
              <CardHeader className="space-y-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Atención gratuita en la red pública</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Desde septiembre de 2022, las personas beneficiarias de Fonasa de los tramos C y D tendrán gratuidad en todas sus atenciones en el sistema público de salud.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full text-orange-600 border-orange-600 hover:bg-orange-50"
                  asChild
                >
                  <a href="https://www.gob.cl/copagocero/" target="_blank" rel="noopener noreferrer">
                    Ver Más
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow border-2">
              <CardHeader className="space-y-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Revisa toda la información sobre el proceso de vacunación COVID-19</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  El nuevo plan se basa en nueva evidencia y fue elaborado en conjunto con especialistas, en un proceso de diálogo dirigido por la ministra María Begoña Yarza.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full text-orange-600 border-orange-600 hover:bg-orange-50"
                  asChild
                >
                  <a href="https://www.gob.cl/pasoapaso/" target="_blank" rel="noopener noreferrer">
                    Ver Más
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sección Isapres Chile - Aparece al hacer scroll */}
      <section id="isapres-chile" className="relative w-full bg-primary text-primary-foreground py-12 sm:py-16 md:py-24 overflow-hidden scroll-mt-20">
        {/* Background con imagen */}
        <div 
          className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat w-full opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/95 to-primary/90"></div>
        </div>
        
        {/* Background decorative icons más vibrantes */}
        <div className="absolute inset-0 opacity-20 pointer-events-none w-full">
          <div className="absolute top-10 left-4 sm:left-10 w-16 h-16 sm:w-32 sm:h-32 border-4 border-primary-foreground/30 rounded-full animate-pulse"></div>
          <div className="absolute top-32 left-1/4 w-12 h-12 sm:w-24 sm:h-24 border-3 border-primary-foreground/30 rounded-full"></div>
          <div className="absolute bottom-20 left-4 sm:left-10 w-10 h-10 sm:w-20 sm:h-20 border-3 border-primary-foreground/30 rounded-full"></div>
          <div className="absolute top-20 right-1/4 w-12 h-12 sm:w-24 sm:h-24 border-3 border-primary-foreground/30 rounded-full animate-pulse"></div>
          <div className="absolute bottom-32 right-10 sm:right-20 w-16 h-16 sm:w-32 sm:h-32 border-4 border-primary-foreground/30 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-40 sm:h-40 border-4 border-primary-foreground/20 rounded-full"></div>
        </div>

        <div className="container mx-auto relative z-10 px-4 sm:px-6">
          <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2">
            {/* Columna Izquierda */}
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">ASOCIACIÓN DE ISAPRES DE CHILE (AICH)</h2>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-500 mb-4 sm:mb-6">ISAPRES DE CHILE</h3>
              </div>
              <div className="space-y-3 sm:space-y-4 text-primary-foreground/90 leading-relaxed text-sm sm:text-base">
                <p>
                  La Asociación de Isapres de Chile (AICH) es una asociación gremial, fundada en 1984, teniendo como asociadas al 100% de las Instituciones de Salud Previsional (Isapres) abiertas del país.
                </p>
                <p>
                  Como organización gremial se rige por las disposiciones del D.L 2.757 de 1979 y D.L 3.173 de 1980, y por las estipulaciones contenidas en los Estatutos.
                </p>
                <p>
                  Su función es representar los principios, valores y opiniones de sus asociados frente a los organismos públicos y no gubernamentales, buscando siempre mejorar el bienestar de sus beneficiarios a través de la promoción del desarrollo y perfeccionamiento del sistema.
                </p>
                <p>
                  En este contexto, desde su creación, la Asociación de Isapres se ha constituido como un organismo de consulta, opinión y difusión, facultada y capacitada para otorgar respuestas a la opinión pública y la autoridad respecto a materias que le competen, participar del debate de las políticas públicas y transmitir las acciones atingentes al sector que representa.
                </p>
              </div>
            </div>

            {/* Columna Derecha - Caja azul más clara */}
            <div className="bg-primary/80 rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
              <h4 className="text-xl sm:text-2xl font-bold">LAS Isapres</h4>
              <div className="space-y-3 sm:space-y-4 text-primary-foreground/90 leading-relaxed text-sm sm:text-base">
                <p>
                  Las Instituciones de Salud Previsional (Isapres) son entidades privadas que funcionan en base a un esquema de seguros, las cuales están facultados para recibir y administrar la cotización obligatoria de salud (7% de su remuneración imponible) de los trabajadores y personas, que libre e individualmente optaron por ellas en lugar del sistema de salud estatal (FONASA). A cargo de estas cotizaciones las Isapres financian prestaciones de salud y el pago de licencias médicas. Estas prestaciones de salud se otorgan mediante la contratación de servicios médicos financiados por las Isapres.
                </p>
                <p>
                  Las Isapres fueron creadas en 1981 en virtud de la dictación del DFL N°3 del Ministerio de Salud y desde el año 2005 son supervisadas por la Superintendencia de Salud. Hoy otorgan servicios de financiamiento de la salud a un 19% de la población de Chile y permitieron en nuestro país la expansión de la actividad médica privada y el auge de la inversión en clínicas, centros médicos, laboratorios, entre otros.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Noticias - Aparece al hacer scroll */}
      <section id="noticias" className="relative w-full py-12 sm:py-16 md:py-24 overflow-hidden scroll-mt-20">
        {/* Background con imagen */}
        <div 
          className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat w-full"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1504711434969-e33886168f5c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-500/20 via-background/80 to-gray-500/20"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background/70"></div>
        </div>
        
        {/* Elementos decorativos */}
        <div className="absolute inset-0 -z-10 w-full opacity-15">
          <div className="absolute top-0 right-0 w-96 h-96 bg-slate-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gray-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-8 sm:mb-12 space-y-3 sm:space-y-4">
            <div className="inline-flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/10 mb-3 sm:mb-4">
              <Newspaper className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold drop-shadow-md text-foreground">Noticias</h2>
          <p className="text-foreground/90 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed px-2 drop-shadow-sm font-medium">
              Mantente informado sobre las últimas noticias del sector de salud en Chile.
            </p>
          </div>
          <NewsSection />
        </div>
      </section>

      {/* Sección Descargas - Aparece al hacer scroll */}
      <section id="descargas" className="relative w-full py-12 sm:py-16 md:py-24 overflow-hidden scroll-mt-20">
        {/* Background con imagen */}
        <div 
          className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat w-full"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/25 via-background/75 to-yellow-500/25"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-background/65 via-background/75 to-background/70"></div>
        </div>
        
        {/* Elementos decorativos */}
        <div className="absolute inset-0 -z-10 w-full opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-amber-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-yellow-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-8 sm:mb-12 space-y-3 sm:space-y-4">
            <p className="text-primary text-xs sm:text-sm font-semibold uppercase tracking-wider">ACCESO DIRECTO</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold drop-shadow-md text-foreground">DESCARGAS</h2>
            <p className="text-foreground/90 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed px-2 drop-shadow-sm font-medium">
              En esta sección podrá descargar los documentos y boletines de interés para los usuarios del sistema de salud que se encuentran disponibles en nuestro sitio web.
            </p>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow border-2">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="text-xs font-bold text-red-600">PDF</div>
                </div>
                <CardTitle className="text-lg text-primary">
                  Normas administrativas de la Superintendencia de Salud
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Compendio de normas administrativas de la Superintendencia de Salud en materia de Procedimientos.
                </p>
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  asChild
                >
                  <a 
                    href="https://www.tu7.cl/assets/common/descargas/articles-6678_recurso_1.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    download
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Descargar
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-2">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="text-xs font-bold text-red-600">PDF</div>
                </div>
                <CardTitle className="text-lg text-primary">
                  Modificaciones legales propuestas por la ley larga de Isapres
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Con la llamada Ley Larga, actualmente en discusión en el Congreso, se pretende introducir cambios legales que permitirían avanzar hacia la solución de los problemas que aún presenta el sistema de isapres.
                </p>
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  asChild
                >
                  <a 
                    href="https://www.tu7.cl/assets/common/descargas/articles-4065_recurso_1.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    download
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Descargar
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-2">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="text-xs font-bold text-red-600">PDF</div>
                </div>
                <CardTitle className="text-lg text-primary">
                  Las Instituciones de Salud Previsional (ISAPRE)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Las Instituciones de Salud Previsional (ISAPRE) son un sistema privado de seguros de salud, actualmente conformado por nueve Aseguradoras (seis abiertas y tres cerradas).
                </p>
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  asChild
                >
                  <a 
                    href="https://www.tu7.cl/assets/common/descargas/Isapres.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    download
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Descargar
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sección Mujeres - Aparece al hacer scroll */}
      <section id="mujeres" className="relative w-full py-12 sm:py-16 md:py-24 overflow-hidden scroll-mt-20">
        {/* Background con imagen */}
        <div 
          className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat w-full"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1559757175-0eb30cd8c063?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 via-background/70 to-rose-500/30"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/75 to-background/70"></div>
        </div>
        
        {/* Elementos decorativos */}
        <div className="absolute inset-0 -z-10 w-full opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-pink-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-400 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-300 rounded-full blur-3xl opacity-30"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          {/* Banner Hero */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-xl p-6 sm:p-8 md:p-12 mb-12 sm:mb-16 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-10 left-4 sm:left-10 w-16 h-16 sm:w-32 sm:h-32 border-2 border-primary rounded-full"></div>
              <div className="absolute top-20 right-10 sm:right-20 w-12 h-12 sm:w-24 sm:h-24 border-2 border-primary rounded-full"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center relative z-10">
              <div className="space-y-3 sm:space-y-4">
                <p className="text-primary text-xs sm:text-sm font-semibold uppercase tracking-wider">NOSOTRAS</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-orange-600 drop-shadow-lg">
                  PLANES DE SALUD PENSADO EN NOSOTRAS
                </h2>
                <p className="text-foreground/90 leading-relaxed text-sm sm:text-base drop-shadow-sm font-medium">
                  Desde abril de 2020, todas las mujeres pueden acceder a planes con mayor cobertura y menor precio.
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground italic">
                  *Para que se haga efectivo sólo debes solicitar el cambio de plan o cambiarte de Isapre.
                </p>
              </div>
              <div className="flex justify-center md:justify-end">
                <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="h-24 w-24 sm:h-32 sm:w-32 text-primary/30" />
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Beneficios */}
          <div className="space-y-8 sm:space-y-12">
            <div className="text-center space-y-3 sm:space-y-4 px-2">
              <p className="text-primary text-xs sm:text-sm font-semibold uppercase tracking-wider">NUESTROS BENEFICIOS</p>
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-orange-600 drop-shadow-lg">
                COMO MUJERES TENEMOS NUESTRAS PROPIAS NECESIDADES DE SALUD
              </h3>
              <p className="text-foreground/90 text-sm sm:text-base md:text-lg max-w-3xl mx-auto leading-relaxed drop-shadow-sm font-medium">
                Porque consideramos que la salud es lo más importante para nosotras y nuestra familia, nos queremos sentir seguras de las coberturas que nos brinda un plan de Isapre.
              </p>
            </div>

            {/* 4 Columnas de Beneficios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Maternidad */}
              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="space-y-3">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <Heart className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl text-primary">Maternidad</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    En la actualidad, por ley, desde diciembre de 2019, todos los nuevos planes de Isapre deben incluir cobertura en maternidad. Las Isapres ya no pueden comercializar planes con maternidad reducida.
                  </p>
                </CardContent>
              </Card>

              {/* Cuidados ginecológicos */}
              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="space-y-3">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl text-primary">Cuidados ginecológicos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    Según la Sociedad Americana Contra El Cáncer, las mamografías deben realizarse anualmente a partir de los 40 años de edad. Esta frecuencia debe mantenerse hasta los 55 años, momento en el que el estudio puede hacerse cada dos años.
                  </p>
                </CardContent>
              </Card>

              {/* Tratamientos estéticos */}
              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="space-y-3">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl text-primary">Tratamientos estéticos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    Cirugía estética a cargo de un staff especializado que brinda asesoramiento para acceder a la práctica más adecuada en cara, mamas o contorno corporal.
                  </p>
                </CardContent>
              </Card>

              {/* Los beneficios */}
              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="space-y-3">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl text-primary">Los beneficios</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    La plataforma de descuentos de las Isapres ofrecen beneficios extra para quienes eligen Plan Mujer en diferentes rubros como tiempo libre, belleza, fitness y gastronomía, entre otros.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Botón CTA */}
            <div className="text-center pt-8">
              <Button 
                size="lg" 
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('inicio')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Contacta un Asesor
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Ley Corta - Aparece al hacer scroll */}
      <section id="ley-corta" className="relative w-full py-12 sm:py-16 md:py-24 overflow-hidden scroll-mt-20">
        {/* Background con imagen */}
        <div 
          className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat w-full"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/25 via-background/75 to-orange-500/25"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-background/65 via-background/75 to-background/70"></div>
        </div>
        
        {/* Elementos decorativos */}
        <div className="absolute inset-0 -z-10 w-full opacity-20">
          <div className="absolute top-20 right-20 w-72 h-72 bg-red-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-orange-400 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 left-1/3 w-56 h-56 bg-red-300 rounded-full blur-3xl opacity-25"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          {/* Título Principal */}
          <div className="text-center mb-8 sm:mb-12 space-y-3 sm:space-y-4 px-2">
            <p className="text-primary text-xs sm:text-sm font-semibold uppercase tracking-wider">
              TE EXPLICAMOS LOS ASPECTOS CLAVE DE LA LEY N° 21.674
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary drop-shadow-lg">
              ¿QUÉ ES LA LEY CORTA?
            </h2>
            <p className="text-foreground/90 text-sm sm:text-base md:text-lg max-w-3xl mx-auto leading-relaxed drop-shadow-sm font-medium">
              Te explicamos en simple todo lo que necesitas saber sobre la Ley Corta, sus implicancias, fechas importantes y más.
            </p>
          </div>

          {/* Fechas Importantes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {/* Fecha 1 */}
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="space-y-3">
                <div className="h-16 w-16 rounded-lg border-2 border-red-500 bg-white flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">24 de mayo 2024</p>
                  <CardDescription className="text-sm mt-2">
                    Publicación Ley 21.674 &quot;Ley Corta&quot;
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            {/* Fecha 2 */}
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="space-y-3">
                <div className="h-16 w-16 rounded-lg border-2 border-red-500 bg-white flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">31 de agosto 2024</p>
                  <CardDescription className="text-sm mt-2">
                    Fecha máxima que tenemos para informar los costos de tu plan de salud
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            {/* Fecha 3 */}
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="space-y-3">
                <div className="h-16 w-16 rounded-lg border-2 border-red-500 bg-white flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">30 septiembre 2024</p>
                  <CardDescription className="text-sm mt-2">
                    Plazo máximo para que nos comuniques tu decisión de ajuste de plan (en caso que aplique)
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            {/* Fecha 4 */}
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="space-y-3">
                <div className="h-16 w-16 rounded-lg border-2 border-red-500 bg-white flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">30 de noviembre 2024</p>
                  <CardDescription className="text-sm mt-2">
                    Plazo máximo para comunicación oficial sobre devoluciones
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Caja Informativa */}
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Información Actualizada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Concluido el plazo estipulado por la Ley N° 21.674 (Ley Corta) para que las Isapre presentaran sus Planes de Pago y Ajuste (PPA), con el objetivo de cumplir con el fallo de la Corte Suprema sobre la tabla de factores de riesgo, la Superintendencia de Salud informa lo siguiente:
              </p>
              <p>
                La Intendencia de Fondos y Seguros Previsionales de la Superintendencia de Salud recibió cuatro propuestas de plan de pago y ajuste de las Isapre Consalud, Cruz Blanca, Fundación y Nueva Masvida. Además, se aceptaron cinco solicitudes de prórroga de las Isapre Isalud, Esencial, Colmena, Banmédica y Vida Tres, quienes tendrán hasta un mes adicional (hasta el 7 de agosto) para presentar sus propuestas.
              </p>
              <p>
                Con la recepción de estas cuatro propuestas, ha comenzado la revisión para verificar el cumplimiento de los contenidos mínimos requeridos en el plan, según lo establecido en la Circular IF N°470. Si se cumplen estos requisitos, las propuestas serán enviadas en los próximos cinco días al Consejo Consultivo sobre Seguros Previsionales, que tendrá un plazo de 30 días para elaborar y emitir recomendaciones fundamentadas para cada plan presentado.
              </p>
              <p>
                Simultáneamente, el equipo técnico de la Superintendencia de Salud iniciará el análisis y verificación de la información contenida en cada propuesta entregada por las aseguradoras.
              </p>
              <p>
                Finalmente, se informa que, mediante la Resolución Exenta N°870, el Superintendente de Salud, Dr. Victor Torres Jeldes, ha convocado a la primera sesión del Consejo Consultivo sobre Seguros Previsionales para el jueves 11 de julio de 2024.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}


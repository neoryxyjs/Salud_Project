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
import { Search, Shield, TrendingUp, CheckCircle2, User, Mail, Phone, ArrowRight, ExternalLink, FileText, BookOpen, Scale, FileCheck, Users, Heart, Download, Newspaper, Briefcase, FileDown, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { validateRUT, formatRUT } from '@/lib/rut-validator';

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
      <div className="grid gap-6 md:grid-cols-3">
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
    <div className="grid gap-6 md:grid-cols-3">
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
      {/* Sección Inicio */}
      <section id="inicio" className="container space-y-6 py-8 md:py-12 lg:py-24">
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
                <div className="grid gap-4 md:grid-cols-2">
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
                    <Input
                      id="region"
                      placeholder="Región Metropolitana"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
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
                  disabled={leadMutation.isPending || (rut ? rutError !== '' : false) || formData.reasons.length === 0 || !formData.region}
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

      {/* Sección Quienes Somos */}
      <section id="quienes-somos" className="container py-12 md:py-24">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-primary">QUEPLAN</h2>
              <h3 className="text-4xl md:text-5xl font-bold text-orange-600">QUIENES SOMOS</h3>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p className="text-lg leading-relaxed">
                QuePlan es una plataforma web <strong className="text-foreground">100% en línea y gratuita</strong>, para cotizar y comparar planes de salud de todas las Isapres de Chile.
              </p>
              <p className="leading-relaxed">
                Nuestra plataforma concentra la información de todos los planes de todas las Isapres. La plataforma es muy fácil de usar, podrás seleccionar, comparar y elegir el plan que más se adapte a tus necesidades de salud y cobertura.
              </p>
              <p className="leading-relaxed">
                Sólo debes hacer clic y uno de nuestros ejecutivos se contactará a la brevedad. No tomes decisiones sin informarte, deja que nosotros te ayudemos a elegir el mejor plan. Nuestros ejecutivos te brindarán una asesoría cercana y amigable.
              </p>
            </div>
          </div>
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Lo que necesitas saber</CardTitle>
                <CardDescription>
                  Información importante sobre Isapres y planes de salud
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <a 
                  href="https://www.superdesalud.gob.cl/registro/isapres/#:~:text=Las%20Instituciones%20de%20Salud%20Previsional,seis%20abiertas%20y%20tres%20cerradas)" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent hover:border-primary transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-medium">Qué son las Isapres</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
                <a 
                  href="#que-son-planes" 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent hover:border-primary transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span className="font-medium">Qué son los planes de salud</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
                <a 
                  href="https://www.superdesalud.gob.cl/tax-marco-normativo/leyes-3002/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent hover:border-primary transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Scale className="h-5 w-5 text-primary" />
                    <span className="font-medium">Normativa vigente MINSAL</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
                <a 
                  href="https://www.superdesalud.gob.cl/tax-materias-prestadores/ley-de-derechos-y-deberes-4185/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent hover:border-primary transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="font-medium">Derecho de los usuarios</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
                <a 
                  href="https://www.superdesalud.gob.cl/tax-materias-isapres/contrato-de-salud-3464/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent hover:border-primary transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <FileCheck className="h-5 w-5 text-primary" />
                    <span className="font-medium">Contratos de Salud</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sección Plataforma */}
      <section id="plataforma" className="bg-gradient-to-b from-muted/50 to-background py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-16 space-y-4">
            <p className="text-primary text-sm font-semibold uppercase tracking-wider">SOMOS LA MEJOR PLATAFORMA</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-orange-600">
              PARA COTIZAR PLANES DE ISAPRE
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Hacemos que sea simple y fácil la búsqueda de planes de Isapre, tanto para cotizantes y ejecutivos.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 mb-12">
            <Card className="border-2 hover:border-primary transition-colors hover:shadow-lg">
              <CardHeader className="space-y-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl text-primary">Asesores profesionales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Contamos con ejecutivos altamente calificados y de mucha experiencia en el mercado.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-primary transition-colors hover:shadow-lg">
              <CardHeader className="space-y-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl text-primary">Cotizar es fácil</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  De forma rápida y simple podrás elegir uno o más planes y contactar a un ejecutivo en menos de 30 minutos.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-primary transition-colors hover:shadow-lg">
              <CardHeader className="space-y-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl text-primary">Planes a tu medida</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  En QuePlan encontrarás el plan que más se acomode a tu perfil y al de tu familia.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6">
              <ArrowRight className="mr-2 h-5 w-5" />
              Cotiza tu plan de isapre ahora!
            </Button>
          </div>
        </div>
      </section>

      {/* Sección Superintendencia */}
      <section id="superintendencia" className="container py-16 md:py-24">
        <div className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground p-8 md:p-12 rounded-xl mb-12 text-center shadow-lg">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">SUPERINTENDENCIA DE SALUD</h2>
          <h3 className="text-3xl md:text-4xl font-bold mb-6">TUS DERECHOS, NUESTRA PRIORIDAD</h3>
          <p className="max-w-3xl mx-auto text-lg leading-relaxed opacity-95">
            La Misión de la Superintendencia de Salud es proteger, promover, y velar por el cumplimiento igualitario de los derechos de las personas en salud, con relación a Fonasa, Isapres y prestadores.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
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
      </section>

      {/* Sección Isapres Chile */}
      <section id="isapres-chile" className="bg-primary text-primary-foreground py-16 md:py-24 relative overflow-hidden">
        {/* Background decorative icons */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 border-2 border-primary-foreground rounded-full"></div>
          <div className="absolute top-32 left-1/4 w-16 h-16 border-2 border-primary-foreground rounded-full"></div>
          <div className="absolute bottom-20 left-10 w-12 h-12 border-2 border-primary-foreground rounded-full"></div>
          <div className="absolute top-20 right-1/4 w-16 h-16 border-2 border-primary-foreground rounded-full"></div>
          <div className="absolute bottom-32 right-20 w-20 h-20 border-2 border-primary-foreground rounded-full"></div>
        </div>

        <div className="container relative z-10">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Columna Izquierda */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">ASOCIACIÓN DE ISAPRES DE CHILE (AICH)</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-orange-500 mb-6">ISAPRES DE CHILE</h3>
              </div>
              <div className="space-y-4 text-primary-foreground/90 leading-relaxed">
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
            <div className="bg-primary/80 rounded-xl p-6 md:p-8 space-y-6">
              <h4 className="text-2xl font-bold">LAS Isapres</h4>
              <div className="space-y-4 text-primary-foreground/90 leading-relaxed">
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

      {/* Sección Noticias */}
      <section id="noticias" className="container py-16 md:py-24">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
            <Newspaper className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">Noticias</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Mantente informado sobre las últimas noticias del sector de salud en Chile.
          </p>
        </div>
        <NewsSection />
      </section>

      {/* Sección Descargas */}
      <section id="descargas" className="bg-gradient-to-b from-muted/50 to-background py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12 space-y-4">
            <p className="text-primary text-sm font-semibold uppercase tracking-wider">ACCESO DIRECTO</p>
            <h2 className="text-3xl md:text-4xl font-bold">DESCARGAS</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              En esta sección podrá descargar los documentos y boletines de interés para los usuarios del sistema de salud que se encuentran disponibles en nuestro sitio web.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
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

      {/* Sección Mujeres */}
      <section id="mujeres" className="container py-16 md:py-24">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">Mujeres</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Información especializada en planes de salud para mujeres.
          </p>
        </div>
      </section>

      {/* Sección Ley Corta */}
      <section id="ley-corta" className="bg-gradient-to-b from-muted/50 to-background py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
              <Scale className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Ley Corta</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Información sobre la Ley Corta de Isapres y sus implicaciones.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}


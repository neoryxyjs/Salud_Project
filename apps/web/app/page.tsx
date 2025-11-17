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
            <div>
              <h2 className="text-2xl font-bold text-primary mb-2">QUEPLAN</h2>
              <h3 className="text-4xl font-bold text-orange-600 mb-4">QUIENES SOMOS</h3>
            </div>
            <p className="text-muted-foreground text-lg">
              QuePlan es una plataforma web 100% en línea y gratuita, para cotizar y comparar planes de salud de todas las Isapres de Chile.
            </p>
            <p className="text-muted-foreground">
              Nuestra plataforma concentra la información de todos los planes de todas las Isapres. La plataforma es muy fácil de usar, podrás seleccionar, comparar y elegir el plan que más se adapte a tus necesidades de salud y cobertura.
            </p>
            <p className="text-muted-foreground">
              Sólo debes hacer clic y uno de nuestros ejecutivos se contactará a la brevedad. No tomes decisiones sin informarte, deja que nosotros te ayudemos a elegir el mejor plan. Nuestros ejecutivos te brindarán una asesoría cercana y amigable.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xl font-bold">Lo que necesitas saber</h4>
            <div className="space-y-2">
              <a href="#que-son-isapres" className="flex items-center gap-2 text-primary hover:underline">
                <span>→</span>
                <span>Qué son las Isapres</span>
              </a>
              <a href="#que-son-planes" className="flex items-center gap-2 text-primary hover:underline">
                <span>→</span>
                <span>Qué son los planes de salud</span>
              </a>
              <a href="#normativa-minsal" className="flex items-center gap-2 text-primary hover:underline">
                <span>→</span>
                <span>Normativa vigente MINSAL</span>
              </a>
              <a href="#derechos-usuarios" className="flex items-center gap-2 text-primary hover:underline">
                <span>→</span>
                <span>Derecho de los usuarios</span>
              </a>
              <a href="#contratos-salud" className="flex items-center gap-2 text-primary hover:underline">
                <span>→</span>
                <span>Contratos de Salud</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Plataforma */}
      <section id="plataforma" className="bg-muted/50 py-12 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-semibold mb-2">SOMOS LA MEJOR PLATAFORMA</p>
            <h2 className="text-4xl md:text-5xl font-bold text-orange-600 mb-4">
              PARA COTIZAR PLANES DE ISAPRE
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Hacemos que sea simple y fácil la búsqueda de planes de Isapre, tanto para cotizantes y ejecutivos.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Asesores profesionales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Contamos con ejecutivos altamente calificados y de mucha experiencia en el mercado.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Cotizar es fácil</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  De forma rápida y simple podrás elegir uno o más planes y contactar a un ejecutivo en menos de 30 minutos.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Planes a tu medida</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  En QuePlan encontrarás el plan que más se acomode a tu perfil y al de tu familia.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-8">
            <Button size="lg" className="bg-primary text-primary-foreground">
              → Cotiza tu plan de isapre ahora!
            </Button>
          </div>
        </div>
      </section>

      {/* Sección Superintendencia */}
      <section id="superintendencia" className="container py-12 md:py-24">
        <div className="bg-primary text-primary-foreground p-8 rounded-lg mb-8 text-center">
          <h2 className="text-2xl font-bold mb-4">SUPERINTENDENCIA DE SALUD</h2>
          <h3 className="text-3xl font-bold mb-4">TUS DERECHOS, NUESTRA PRIORIDAD</h3>
          <p className="max-w-3xl mx-auto">
            La Misión de la Superintendencia de Salud es proteger, promover, y velar por el cumplimiento igualitario de los derechos de las personas en salud, con relación a Fonasa, Isapres y prestadores.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Caracterización de los profesionales de la salud en Chile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Esta herramienta permitirá observar periódicamente las magnitudes de un conjunto de características de profesionales, técnicos y auxiliares de salud del país.
              </p>
              <Button variant="outline" className="text-orange-600 border-orange-600">
                Ver Más
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Atención gratuita en la red pública</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Desde septiembre de 2022, las personas beneficiarias de Fonasa de los tramos C y D tendrán gratuidad en todas sus atenciones en el sistema público de salud.
              </p>
              <Button variant="outline" className="text-orange-600 border-orange-600">
                Ver Más
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Revisa toda la información sobre el proceso de vacunación COVID-19</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                El nuevo plan se basa en nueva evidencia y fue elaborado en conjunto con especialistas, en un proceso de diálogo dirigido por la ministra María Begoña Yarza.
              </p>
              <Button variant="outline" className="text-orange-600 border-orange-600">
                Ver Más
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sección Isapres Chile */}
      <section id="isapres-chile" className="bg-muted/50 py-12 md:py-24">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-8">Isapres Chile</h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            Información sobre las principales Isapres de Chile y sus planes de salud disponibles.
          </p>
        </div>
      </section>

      {/* Sección Noticias */}
      <section id="noticias" className="container py-12 md:py-24">
        <h2 className="text-3xl font-bold text-center mb-8">Noticias</h2>
        <p className="text-center text-muted-foreground">
          Mantente informado sobre las últimas noticias del sector de salud en Chile.
        </p>
      </section>

      {/* Sección Descargas */}
      <section id="descargas" className="bg-muted/50 py-12 md:py-24">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-8">Descargas</h2>
          <p className="text-center text-muted-foreground">
            Descarga documentos, guías y recursos útiles sobre planes de salud.
          </p>
        </div>
      </section>

      {/* Sección Mujeres */}
      <section id="mujeres" className="container py-12 md:py-24">
        <h2 className="text-3xl font-bold text-center mb-8">Mujeres</h2>
        <p className="text-center text-muted-foreground">
          Información especializada en planes de salud para mujeres.
        </p>
      </section>

      {/* Sección Ley Corta */}
      <section id="ley-corta" className="bg-muted/50 py-12 md:py-24">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-8">Ley Corta</h2>
          <p className="text-center text-muted-foreground">
            Información sobre la Ley Corta de Isapres y sus implicaciones.
          </p>
        </div>
      </section>
    </div>
  );
}


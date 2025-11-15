import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Shield, TrendingUp } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
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
          <div className="flex gap-4">
            <Button size="lg" asChild>
              <Link href="/comparador">Comparar Planes</Link>
            </Button>
          </div>
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


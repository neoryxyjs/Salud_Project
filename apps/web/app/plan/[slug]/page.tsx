'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Check, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlanDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans', 'slug', slug],
    queryFn: async () => {
      const { data } = await api.get(`/plans/slug/${slug}`);
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Plan no encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const plan = plans[0];

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{plan.name}</h1>
        <p className="text-muted-foreground">{plan.insurer.name}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Precio Base</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatPrice(plan.basePriceCLP)}
            </div>
            <div className="text-sm text-muted-foreground">mensual</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calificación</CardTitle>
          </CardHeader>
          <CardContent>
            {plan.score ? (
              <div className="flex items-center gap-2">
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold">{plan.score.toFixed(1)}</span>
              </div>
            ) : (
              <p className="text-muted-foreground">No disponible</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cobertura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {plan.coverageHosp && (
              <div className="flex items-center justify-between">
                <span>Hospitalización</span>
                <Badge>{plan.coverageHosp}%</Badge>
              </div>
            )}
            {plan.coverageAmb && (
              <div className="flex items-center justify-between">
                <span>Ambulatorio</span>
                <Badge>{plan.coverageAmb}%</Badge>
              </div>
            )}
            {plan.coverageEr && (
              <div className="flex items-center justify-between">
                <span>Urgencias</span>
                <Badge>{plan.coverageEr}%</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Características</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {plan.features?.dental && (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Cobertura Dental</span>
                </div>
              )}
              {plan.features?.oftalmologia && (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Oftalmología</span>
                </div>
              )}
              {plan.features?.telemedicina && (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Telemedicina</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {plan.tiers && plan.tiers.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Precios por Edad y Cargas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Edad</th>
                    <th className="text-left p-2">Cargas</th>
                    <th className="text-left p-2">Región</th>
                    <th className="text-right p-2">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.tiers.map((tier: any) => (
                    <tr key={tier.id} className="border-b">
                      <td className="p-2">
                        {tier.ageFrom}-{tier.ageTo} años
                      </td>
                      <td className="p-2">{tier.cargas}</td>
                      <td className="p-2">{tier.region}</td>
                      <td className="p-2 text-right font-medium">
                        {formatPrice(tier.priceCLP)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


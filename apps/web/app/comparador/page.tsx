'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlanCard } from '@/components/comparador/PlanCard';
import { RegionFilter } from '@/components/comparador/RegionFilter';
import { AgeFilter } from '@/components/comparador/AgeFilter';
import { PriceFilter } from '@/components/comparador/PriceFilter';
import { CargasFilter } from '@/components/comparador/CargasFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

function PlansSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-1/2 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ComparadorPage() {
  const [region, setRegion] = useState<string>('');
  const [age, setAge] = useState<number[]>([30]);
  const [cargas, setCargas] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number[]>([500000]);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans', region, age[0], cargas, maxPrice[0]],
    queryFn: async () => {
      const params: any = {};
      if (region) params.region = region;
      if (age[0]) params.age = age[0];
      if (cargas) params.cargas = parseInt(cargas);
      if (maxPrice[0]) params.maxPrice = maxPrice[0];

      const { data } = await api.get('/plans', { params });
      return data;
    },
  });

  const maxPriceValue = plans?.length
    ? Math.max(...plans.map((p: any) => p.calculatedPrice || p.basePriceCLP))
    : 500000;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Comparador de Planes</h1>
        <p className="text-muted-foreground">
          Filtra y compara planes de salud según tus necesidades
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <RegionFilter value={region} onChange={setRegion} />
              <AgeFilter value={age} onChange={setAge} />
              <CargasFilter value={cargas} onChange={setCargas} />
              <PriceFilter
                value={maxPrice}
                maxPrice={maxPriceValue}
                onChange={setMaxPrice}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {isLoading ? (
            <PlansSkeleton />
          ) : plans?.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan: any) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No se encontraron planes con los filtros seleccionados.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}


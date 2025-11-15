'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { Star, Check } from 'lucide-react';

interface PlanCardProps {
  plan: {
    id: string;
    name: string;
    insurer: {
      name: string;
      slug: string;
      logoUrl?: string;
    };
    calculatedPrice?: number;
    basePriceCLP: number;
    coverageHosp?: number;
    coverageAmb?: number;
    coverageEr?: number;
    score?: number;
    features?: any;
    networkTags?: string[];
  };
}

export function PlanCard({ plan }: PlanCardProps) {
  const price = plan.calculatedPrice || plan.basePriceCLP;
  const features = plan.features || {};

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            <CardDescription>{plan.insurer.name}</CardDescription>
          </div>
          {plan.score && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{plan.score.toFixed(1)}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-4">
          <div className="text-3xl font-bold">{formatPrice(price)}</div>
          <div className="text-sm text-muted-foreground">mensual</div>
        </div>

        <div className="space-y-2 mb-4">
          {plan.coverageHosp && (
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600" />
              <span>Hospitalización: {plan.coverageHosp}%</span>
            </div>
          )}
          {plan.coverageAmb && (
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600" />
              <span>Ambulatorio: {plan.coverageAmb}%</span>
            </div>
          )}
          {plan.coverageEr && (
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600" />
              <span>Urgencias: {plan.coverageEr}%</span>
            </div>
          )}
        </div>

        {plan.networkTags && plan.networkTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {plan.networkTags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {features.dental && (
          <Badge variant="outline" className="mb-2">
            Dental
          </Badge>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild>
          <Link href={`/plan/${plan.insurer.slug}`}>Ver Detalles</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}


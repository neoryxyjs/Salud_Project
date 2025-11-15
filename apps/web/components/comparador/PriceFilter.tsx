'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { formatPrice } from '@/lib/utils';

interface PriceFilterProps {
  value: number[];
  maxPrice: number;
  onChange: (value: number[]) => void;
}

export function PriceFilter({ value, onChange, maxPrice }: PriceFilterProps) {
  return (
    <div className="space-y-2">
      <Label>Precio máximo: {formatPrice(value[0])}</Label>
      <Slider
        value={value}
        onValueChange={onChange}
        min={0}
        max={maxPrice}
        step={10000}
        className="w-full"
      />
    </div>
  );
}


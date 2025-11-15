'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface AgeFilterProps {
  value: number[];
  onChange: (value: number[]) => void;
}

export function AgeFilter({ value, onChange }: AgeFilterProps) {
  return (
    <div className="space-y-2">
      <Label>Edad: {value[0]} años</Label>
      <Slider
        value={value}
        onValueChange={onChange}
        min={0}
        max={99}
        step={1}
        className="w-full"
      />
    </div>
  );
}


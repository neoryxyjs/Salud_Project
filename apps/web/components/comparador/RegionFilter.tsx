'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CHILEAN_REGIONS } from '@/lib/constants';

interface RegionFilterProps {
  value?: string;
  onChange: (value: string) => void;
}

export function RegionFilter({ value, onChange }: RegionFilterProps) {
  return (
    <div className="space-y-2">
      <Label>Región</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona una región" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todas las regiones</SelectItem>
          {CHILEAN_REGIONS.map((region) => (
            <SelectItem key={region.value} value={region.value}>
              {region.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}


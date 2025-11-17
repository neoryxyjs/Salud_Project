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
  const handleValueChange = (newValue: string) => {
    // Convertir "all" de vuelta a "" para el backend
    onChange(newValue === 'all' ? '' : newValue);
  };

  return (
    <div className="space-y-2">
      <Label>Región</Label>
      <Select value={value || 'all'} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona una región" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las regiones</SelectItem>
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


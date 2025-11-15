'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const regions = [
  { value: 'RM', label: 'Región Metropolitana' },
  { value: 'V', label: 'Valparaíso' },
  { value: 'VIII', label: 'Biobío' },
  { value: 'IX', label: 'Araucanía' },
  { value: 'X', label: 'Los Lagos' },
];

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
          {regions.map((region) => (
            <SelectItem key={region.value} value={region.value}>
              {region.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}


'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CargasFilterProps {
  value?: string;
  onChange: (value: string) => void;
}

export function CargasFilter({ value, onChange }: CargasFilterProps) {
  return (
    <div className="space-y-2">
      <Label>Cargas</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Número de cargas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">1 carga</SelectItem>
          <SelectItem value="2">2 cargas</SelectItem>
          <SelectItem value="3">3 cargas</SelectItem>
          <SelectItem value="4">4+ cargas</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}


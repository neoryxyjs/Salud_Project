'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Mail, Phone, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { validateRUT, formatRUT } from '@/lib/rut-validator';

interface ContactExecutiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactExecutiveModal({ open, onOpenChange }: ContactExecutiveModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    rut: '',
    currentInsurer: '',
    email: '',
    phone: '',
    comments: '',
  });
  const [rutError, setRutError] = useState('');

  // Obtener lista de Isapres
  const { data: insurers } = useQuery({
    queryKey: ['insurers'],
    queryFn: async () => {
      const { data } = await api.get('/insurers');
      return data;
    },
  });

  const handleRutChange = (value: string) => {
    const cleanValue = value.replace(/\./g, '').replace(/-/g, '');
    setFormData({ ...formData, rut: cleanValue });
    
    if (cleanValue && cleanValue.length >= 8) {
      const formatted = formatRUT(cleanValue);
      if (!validateRUT(formatted)) {
        setRutError('RUT inválido');
      } else {
        setRutError('');
        setFormData({ ...formData, rut: formatted });
      }
    } else {
      setRutError('');
    }
  };

  const leadMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: response } = await api.post('/leads', data);
      return response;
    },
    onSuccess: () => {
      // Limpiar formulario
      setFormData({
        name: '',
        rut: '',
        currentInsurer: '',
        email: '',
        phone: '',
        comments: '',
      });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent, method: 'email' | 'whatsapp') => {
    e.preventDefault();
    
    if (formData.rut && rutError) {
      return;
    }

    leadMutation.mutate({
      ...formData,
      comments: method === 'whatsapp' 
        ? `[Contacto por WhatsApp] ${formData.comments || ''}`
        : `[Contacto por Email] ${formData.comments || ''}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Solicitar Contacto de Ejecutivo
          </DialogTitle>
          <DialogDescription>
            Completa el formulario y un ejecutivo se pondrá en contacto contigo
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              placeholder="Ingrese nombre y apellido"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rut">R.U.T. *</Label>
            <Input
              id="rut"
              placeholder="Ingrese R.U.T."
              value={formData.rut}
              onChange={(e) => handleRutChange(e.target.value)}
              required
            />
            {rutError && (
              <p className="text-sm text-destructive">{rutError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentInsurer">Isapre Actual *</Label>
            <Select
              value={formData.currentInsurer}
              onValueChange={(value) => setFormData({ ...formData, currentInsurer: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {insurers?.map((insurer: any) => (
                  <SelectItem key={insurer.id} value={insurer.name}>
                    {insurer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              placeholder="Ingrese correo electrónico"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono (+56) *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Ej: 912345678"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Comentarios</Label>
            <Textarea
              id="comments"
              placeholder="Ingrese comentarios"
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={(e) => handleSubmit(e, 'email')}
              disabled={leadMutation.isPending}
            >
              <Mail className="h-4 w-4 mr-2" />
              Por Correo
            </Button>
            <Button
              type="button"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={(e) => handleSubmit(e, 'whatsapp')}
              disabled={leadMutation.isPending}
            >
              <Phone className="h-4 w-4 mr-2" />
              Por WhatsApp
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


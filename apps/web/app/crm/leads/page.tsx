'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { MoreHorizontal, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const statusOptions = [
  { value: 'new', label: 'Nuevo', color: 'default' },
  { value: 'contacted', label: 'Contactado', color: 'secondary' },
  { value: 'qualified', label: 'Calificado', color: 'default' },
  { value: 'converted', label: 'Convertido', color: 'default' },
  { value: 'lost', label: 'Perdido', color: 'destructive' },
];

export default function LeadsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['leads', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      const { data } = await api.get(`/leads?${params.toString()}`);
      return data;
    },
    retry: false,
  });

  // Redirigir al login si hay error 401
  useEffect(() => {
    if (error && (error as any).response?.status === 401) {
      router.push('/auth/login');
    }
  }, [error, router]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data } = await api.patch(`/leads/${id}`, updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsDialogOpen(false);
      setSelectedLead(null);
    },
  });

  const handleStatusChange = (leadId: string, newStatus: string) => {
    updateMutation.mutate({ id: leadId, status: newStatus });
  };

  const handleEdit = (lead: any) => {
    setSelectedLead(lead);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (selectedLead) {
      updateMutation.mutate({
        id: selectedLead.id,
        status: selectedLead.status,
        notes: selectedLead.notes,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">
            Administra y gestiona tus leads
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar leads..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Región</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : data?.data?.length > 0 ? (
              data.data.map((lead: any) => {
                const statusOption = statusOptions.find(
                  (s) => s.value === lead.status
                );
                return (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.email || '-'}</TableCell>
                    <TableCell>{lead.phone || '-'}</TableCell>
                    <TableCell>
                      {lead.plan?.name || '-'}
                    </TableCell>
                    <TableCell>{lead.region || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={statusOption?.color as any}>
                        {statusOption?.label || lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(lead.createdAt).toLocaleDateString('es-CL')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(lead)}>
                            Editar
                          </DropdownMenuItem>
                          {statusOptions.map((status) => (
                            <DropdownMenuItem
                              key={status.value}
                              onClick={() =>
                                handleStatusChange(lead.id, status.value)
                              }
                            >
                              Marcar como {status.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No se encontraron leads
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data?.pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {((page - 1) * 10) + 1} -{' '}
            {Math.min(page * 10, data.pagination.total)} de{' '}
            {data.pagination.total} leads
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.pagination.totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Lead</DialogTitle>
            <DialogDescription>
              Actualiza el estado y notas del lead
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={selectedLead.status}
                  onValueChange={(value) =>
                    setSelectedLead({ ...selectedLead, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={selectedLead.notes || ''}
                  onChange={(e) =>
                    setSelectedLead({ ...selectedLead, notes: e.target.value })
                  }
                  placeholder="Agrega notas sobre este lead..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


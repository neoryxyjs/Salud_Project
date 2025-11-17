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
import { MoreHorizontal, Search, Phone, Mail, FileText, Clock, Plus, User } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { validateRUT, formatRUT } from '@/lib/rut-validator';
import { CHILEAN_REGIONS } from '@/lib/constants';

const statusOptions = [
  { value: 'new', label: 'Nuevo', color: 'default' },
  { value: 'contacted', label: 'Contactado', color: 'secondary' },
  { value: 'qualified', label: 'Calificado', color: 'default' },
  { value: 'converted', label: 'Convertido', color: 'default' },
  { value: 'lost', label: 'Perdido', color: 'destructive' },
];

const REASONS = [
  { id: 'muy_cara', label: 'Muy cara' },
  { id: 'cubre_poco', label: 'La isapre me cubre poco' },
  { id: 'subieron_plan', label: 'Me subieron el plan de salud' },
  { id: 'mejorar_coberturas', label: 'Mejorar coberturas' },
  { id: 'no_gusta', label: 'No me gusta mi Isapre actual' },
  { id: 'otros', label: 'Otros' },
];

export default function LeadsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newActivityType, setNewActivityType] = useState('note');
  const [newActivityDescription, setNewActivityDescription] = useState('');
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    rut: '',
    region: '',
    currentInsurer: '',
    reasons: [] as string[],
    comments: '',
    status: 'new',
    notes: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['leads', page, search, statusFilter, regionFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (regionFilter) params.append('region', regionFilter);
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
      // Recargar el lead actualizado
      if (selectedLead) {
        api.get(`/leads/${selectedLead.id}`).then(({ data }) => {
          setSelectedLead(data);
        });
      }
    },
  });

  const addActivityMutation = useMutation({
    mutationFn: async ({ leadId, type, description, metadata }: any) => {
      const { data } = await api.post(`/leads/${leadId}/activities`, {
        type,
        description,
        metadata,
      });
      return data;
    },
    onSuccess: () => {
      // Recargar el lead con el nuevo historial
      if (selectedLead) {
        api.get(`/leads/${selectedLead.id}`).then(({ data }) => {
          setSelectedLead(data);
        });
      }
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (leadData: any) => {
      const { data } = await api.post('/leads', leadData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsCreateDialogOpen(false);
      setNewLead({
        name: '',
        email: '',
        phone: '',
        rut: '',
        region: '',
        currentInsurer: '',
        reasons: [],
        comments: '',
        status: 'new',
        notes: '',
      });
    },
  });

  const handleStatusChange = (leadId: string, newStatus: string) => {
    updateMutation.mutate({ id: leadId, status: newStatus });
  };

  const handleDelete = (leadId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este lead? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate(leadId);
    }
  };

  const handleEdit = async (lead: any) => {
    // Cargar el lead completo con historial
    try {
      const { data } = await api.get(`/leads/${lead.id}`);
      setSelectedLead(data);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error al cargar lead:', error);
      setSelectedLead(lead);
      setIsDialogOpen(true);
    }
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
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Crear Lead
        </Button>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
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
        <Select value={statusFilter || 'all'} onValueChange={(value) => { setStatusFilter(value === 'all' ? '' : value); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={regionFilter || 'all'} onValueChange={(value) => { setRegionFilter(value === 'all' ? '' : value); setPage(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por región" />
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Isapre Actual</TableHead>
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
                  <TableRow 
                    key={lead.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={(e) => {
                      // Evitar que se active cuando se hace clic en el menú de acciones
                      const target = e.target as HTMLElement;
                      if (target.closest('button') || target.closest('[role="menuitem"]')) {
                        return;
                      }
                      handleEdit(lead);
                    }}
                  >
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.email || '-'}</TableCell>
                    <TableCell>{lead.phone || '-'}</TableCell>
                    <TableCell>
                      {lead.currentInsurer || '-'}
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
                    <TableCell 
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(lead)}>
                            Ver Detalles
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
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(lead.id)}
                          >
                            Eliminar
                          </DropdownMenuItem>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Lead</DialogTitle>
            <DialogDescription>
              Información completa y historial de acciones
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6">
              {/* Información del Lead */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <p className="text-sm font-medium">{selectedLead.name}</p>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <p className="text-sm">{selectedLead.email || '-'}</p>
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <p className="text-sm">{selectedLead.phone || '-'}</p>
                </div>
                <div className="space-y-2">
                  <Label>R.U.T.</Label>
                  <p className="text-sm">{selectedLead.rut || '-'}</p>
                </div>
                <div className="space-y-2">
                  <Label>Región</Label>
                  <p className="text-sm">{selectedLead.region || '-'}</p>
                </div>
                <div className="space-y-2">
                  <Label>Isapre Actual</Label>
                  <p className="text-sm">{selectedLead.currentInsurer || '-'}</p>
                </div>
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
              </div>

              {/* Motivos seleccionados */}
              {selectedLead.reasons && selectedLead.reasons.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Motivos para revisar Isapre</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedLead.reasons.map((reason: string) => {
                      const reasonLabel = REASONS.find(r => r.id === reason)?.label || reason;
                      return (
                        <Badge key={reason} variant="secondary">
                          {reasonLabel}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Comentarios */}
              {selectedLead.comments && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Comentarios del Cliente</Label>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedLead.comments}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={selectedLead.notes || ''}
                  onChange={(e) =>
                    setSelectedLead({ ...selectedLead, notes: e.target.value })
                  }
                  placeholder="Agrega notas sobre este lead..."
                  rows={3}
                />
              </div>

              <Separator />

              {/* Historial de Actividades */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Historial de Actividades</Label>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedLead.activities && selectedLead.activities.length > 0 ? (
                    selectedLead.activities.map((activity: any) => {
                      const getActivityIcon = (type: string) => {
                        switch (type) {
                          case 'call':
                            return <Phone className="h-4 w-4" />;
                          case 'email':
                            return <Mail className="h-4 w-4" />;
                          case 'note':
                            return <FileText className="h-4 w-4" />;
                          default:
                            return <Clock className="h-4 w-4" />;
                        }
                      };

                      return (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 border rounded-lg bg-muted/50"
                        >
                          <div className="mt-0.5">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{activity.description}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {new Date(activity.createdAt).toLocaleString('es-CL', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })}
                              </span>
                              {activity.user && (
                                <>
                                  <span>•</span>
                                  <span>{activity.user.email}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay actividades registradas
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Agregar Nueva Actividad */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Agregar Nueva Actividad</Label>
                <div className="space-y-2">
                  <Label>Tipo de Actividad</Label>
                  <Select value={newActivityType} onValueChange={setNewActivityType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Llamada</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="note">Nota</SelectItem>
                      <SelectItem value="update">Actualización</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={newActivityDescription}
                    onChange={(e) => setNewActivityDescription(e.target.value)}
                    placeholder="Describe la actividad..."
                    rows={3}
                  />
                </div>
                <Button
                  onClick={() => {
                    if (newActivityDescription.trim()) {
                      addActivityMutation.mutate({
                        leadId: selectedLead.id,
                        type: newActivityType,
                        description: newActivityDescription,
                      });
                      setNewActivityDescription('');
                    }
                  }}
                  disabled={!newActivityDescription.trim() || addActivityMutation.isPending}
                  className="w-full"
                >
                  {addActivityMutation.isPending ? 'Agregando...' : 'Agregar Actividad'}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cerrar
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Crear Lead */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Lead</DialogTitle>
            <DialogDescription>
              Completa la información del nuevo lead
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Información Personal */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nombre completo *
                </Label>
                <Input
                  id="new-name"
                  placeholder="Juan Pérez"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="juan@email.com"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Teléfono
                </Label>
                <Input
                  id="new-phone"
                  type="tel"
                  placeholder="+56 9 1234 5678"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-rut">R.U.T.</Label>
                <Input
                  id="new-rut"
                  placeholder="12.345.678-9"
                  value={newLead.rut}
                  onChange={(e) => {
                    const value = e.target.value;
                    const cleanValue = value.replace(/\./g, '').replace(/-/g, '');
                    if (cleanValue.length >= 8) {
                      const formatted = formatRUT(cleanValue);
                      setNewLead({ ...newLead, rut: formatted });
                    } else {
                      setNewLead({ ...newLead, rut: cleanValue });
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-region">Región</Label>
                <Select value={newLead.region} onValueChange={(value) => setNewLead({ ...newLead, region: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar región" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHILEAN_REGIONS.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-current-insurer">Isapre Actual</Label>
                <Input
                  id="new-current-insurer"
                  placeholder="Ej: Banmédica, Colmena, etc."
                  value={newLead.currentInsurer}
                  onChange={(e) => setNewLead({ ...newLead, currentInsurer: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-status">Estado</Label>
                <Select value={newLead.status} onValueChange={(value) => setNewLead({ ...newLead, status: value })}>
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
            </div>

            {/* Motivos */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Motivos para revisar Isapre (opcional)
              </Label>
              <div className="space-y-2">
                {REASONS.map((reason) => {
                  const isChecked = newLead.reasons.includes(reason.id);
                  return (
                    <div
                      key={reason.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                        isChecked
                          ? 'bg-primary/10 border-primary'
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <Checkbox
                        id={`new-reason-${reason.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewLead({
                              ...newLead,
                              reasons: [...newLead.reasons, reason.id],
                            });
                          } else {
                            setNewLead({
                              ...newLead,
                              reasons: newLead.reasons.filter((r) => r !== reason.id),
                            });
                          }
                        }}
                      />
                      <Label
                        htmlFor={`new-reason-${reason.id}`}
                        className="flex-1 cursor-pointer font-normal"
                      >
                        {reason.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comentarios y Notas */}
            <div className="space-y-2">
              <Label htmlFor="new-comments">Comentarios del Cliente</Label>
              <Textarea
                id="new-comments"
                placeholder="Comentarios adicionales..."
                value={newLead.comments}
                onChange={(e) => setNewLead({ ...newLead, comments: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-notes">Notas Internas</Label>
              <Textarea
                id="new-notes"
                placeholder="Notas internas sobre el lead..."
                value={newLead.notes}
                onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (!newLead.name) {
                  alert('El nombre es obligatorio');
                  return;
                }
                createMutation.mutate({
                  name: newLead.name,
                  email: newLead.email || undefined,
                  phone: newLead.phone || undefined,
                  rut: newLead.rut || undefined,
                  region: newLead.region || undefined,
                  currentInsurer: newLead.currentInsurer || undefined,
                  reasons: newLead.reasons.length > 0 ? newLead.reasons : undefined,
                  comments: newLead.comments || undefined,
                  status: newLead.status,
                  notes: newLead.notes || undefined,
                });
              }}
              disabled={createMutation.isPending || !newLead.name}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createMutation.isPending ? 'Creando...' : 'Crear Lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


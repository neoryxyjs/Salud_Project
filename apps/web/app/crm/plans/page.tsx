'use client';

import { useState } from 'react';
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
import { MoreHorizontal, Search, Plus, Edit, Trash2, FileText } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { CHILEAN_REGIONS } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';

const INSURERS = [
  { value: 'banmedica', label: 'Banmédica' },
  { value: 'colmena', label: 'Colmena Golden Cross' },
  { value: 'consalud', label: 'Consalud' },
  { value: 'cruz-blanca', label: 'Cruz Blanca' },
  { value: 'nueva-masvida', label: 'Nueva Masvida' },
  { value: 'vida-tres', label: 'Vida Tres' },
  { value: 'esencial', label: 'Esencial Isapre' },
];

const REGION_CODES = [
  { value: 'RM', label: 'Región Metropolitana' },
  { value: 'I', label: 'Tarapacá' },
  { value: 'II', label: 'Antofagasta' },
  { value: 'III', label: 'Atacama' },
  { value: 'IV', label: 'Coquimbo' },
  { value: 'V', label: 'Valparaíso' },
  { value: 'VI', label: "O'Higgins" },
  { value: 'VII', label: 'Maule' },
  { value: 'VIII', label: 'Biobío' },
  { value: 'IX', label: 'Araucanía' },
  { value: 'X', label: 'Los Lagos' },
  { value: 'XI', label: 'Aysén' },
  { value: 'XII', label: 'Magallanes' },
  { value: 'XIV', label: 'Los Ríos' },
  { value: 'XV', label: 'Arica y Parinacota' },
  { value: 'XVI', label: 'Ñuble' },
];

export default function PlansPage() {
  const [search, setSearch] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<any>(null);
  const [newPlan, setNewPlan] = useState({
    insurerSlug: '',
    name: '',
    code: '',
    regionCodes: [] as string[],
    basePriceCLP: 0,
    coverageHosp: 0,
    coverageAmb: 0,
    coverageEr: 0,
    annualCapUF: 0,
    networkTags: [] as string[],
    features: {
      dental: false,
      oftalmologia: false,
      medicinaPreventiva: false,
      urgencias24h: false,
    },
    score: 0,
    isActive: true,
  });
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans', search],
    queryFn: async () => {
      const { data } = await api.get('/plans');
      return data;
    },
  });

  const { data: insurers } = useQuery({
    queryKey: ['insurers'],
    queryFn: async () => {
      const { data } = await api.get('/insurers');
      return data;
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (plansData: any[]) => {
      const { data } = await api.post('/plans/sync', { plans: plansData });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setIsCreateDialogOpen(false);
      setIsDialogOpen(false);
      setNewPlan({
        insurerSlug: '',
        name: '',
        code: '',
        regionCodes: [],
        basePriceCLP: 0,
        coverageHosp: 0,
        coverageAmb: 0,
        coverageEr: 0,
        annualCapUF: 0,
        networkTags: [],
        features: {
          dental: false,
          oftalmologia: false,
          medicinaPreventiva: false,
          urgencias24h: false,
        },
        score: 0,
        isActive: true,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/plans/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setIsDeleteDialogOpen(false);
      setPlanToDelete(null);
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete('/plans/cleanup/all');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setIsDeleteAllDialogOpen(false);
    },
  });

  const handleDelete = (plan: any) => {
    setPlanToDelete(plan);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (planToDelete) {
      deleteMutation.mutate(planToDelete.id);
    }
  };

  const confirmDeleteAll = () => {
    deleteAllMutation.mutate();
  };

  const handleCreate = () => {
    const planData = {
      ...newPlan,
      regionCodes: newPlan.regionCodes,
      networkTags: newPlan.networkTags,
    };
    syncMutation.mutate([planData]);
  };

  const handleEdit = (plan: any) => {
    setSelectedPlan(plan);
    setNewPlan({
      insurerSlug: plan.insurer.slug,
      name: plan.name,
      code: plan.code || '',
      regionCodes: plan.regionCodes || [],
      basePriceCLP: plan.basePriceCLP,
      coverageHosp: plan.coverageHosp || 0,
      coverageAmb: plan.coverageAmb || 0,
      coverageEr: plan.coverageEr || 0,
      annualCapUF: plan.annualCapUF || 0,
      networkTags: plan.networkTags || [],
      features: plan.features || {
        dental: false,
        oftalmologia: false,
        medicinaPreventiva: false,
        urgencias24h: false,
      },
      score: plan.score || 0,
      isActive: plan.isActive !== undefined ? plan.isActive : true,
    });
    setIsDialogOpen(true);
  };

  const handleUpdate = () => {
    const planData = {
      ...newPlan,
      insurerSlug: selectedPlan.insurer.slug,
      code: selectedPlan.code || newPlan.code,
      regionCodes: newPlan.regionCodes,
      networkTags: newPlan.networkTags,
    };
    syncMutation.mutate([planData]);
  };

  const filteredPlans = plans?.filter((plan: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      plan.name.toLowerCase().includes(searchLower) ||
      plan.insurer.name.toLowerCase().includes(searchLower) ||
      (plan.code && plan.code.toLowerCase().includes(searchLower))
    );
  });

  const toggleRegionCode = (code: string) => {
    setNewPlan((prev) => ({
      ...prev,
      regionCodes: prev.regionCodes.includes(code)
        ? prev.regionCodes.filter((c) => c !== code)
        : [...prev.regionCodes, code],
    }));
  };

  const toggleNetworkTag = (tag: string) => {
    setNewPlan((prev) => ({
      ...prev,
      networkTags: prev.networkTags.includes(tag)
        ? prev.networkTags.filter((t) => t !== tag)
        : [...prev.networkTags, tag],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planes de Salud</h1>
          <p className="text-muted-foreground">
            Gestiona los planes de salud de las Isapres
          </p>
        </div>
        <div className="flex gap-2">
          {plans && plans.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setIsDeleteAllDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar Todos
            </Button>
          )}
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Crear Plan
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar planes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Cargando planes...</div>
      ) : filteredPlans?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No se encontraron planes
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Isapre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Precio Base</TableHead>
                <TableHead>Cobertura</TableHead>
                <TableHead>Regiones</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans?.map((plan: any) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{plan.insurer.name}</TableCell>
                  <TableCell>{plan.code || '-'}</TableCell>
                  <TableCell>{formatPrice(plan.basePriceCLP)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {plan.coverageHosp && (
                        <div>Hosp: {plan.coverageHosp}%</div>
                      )}
                      {plan.coverageAmb && (
                        <div>Amb: {plan.coverageAmb}%</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {plan.regionCodes?.slice(0, 3).map((code: string) => (
                        <Badge key={code} variant="outline" className="text-xs">
                          {code}
                        </Badge>
                      ))}
                      {plan.regionCodes?.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{plan.regionCodes.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                      {plan.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(plan)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(plan)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog Crear Plan */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Plan</DialogTitle>
            <DialogDescription>
              Completa los datos del plan de salud
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Isapre *</Label>
                <Select
                  value={newPlan.insurerSlug}
                  onValueChange={(value) =>
                    setNewPlan({ ...newPlan, insurerSlug: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar Isapre" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSURERS.map((insurer) => (
                      <SelectItem key={insurer.value} value={insurer.value}>
                        {insurer.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nombre del Plan *</Label>
                <Input
                  value={newPlan.name}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, name: e.target.value })
                  }
                  placeholder="Ej: Plan Premium 2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  value={newPlan.code}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, code: e.target.value })
                  }
                  placeholder="Ej: BAN-PREM-2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Precio Base (CLP) *</Label>
                <Input
                  type="number"
                  value={newPlan.basePriceCLP || ''}
                  onChange={(e) =>
                    setNewPlan({
                      ...newPlan,
                      basePriceCLP: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="95000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Coberturas (%)</Label>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm">Hospitalización</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newPlan.coverageHosp || ''}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        coverageHosp: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="90"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Ambulatorio</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newPlan.coverageAmb || ''}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        coverageAmb: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="80"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Urgencias</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newPlan.coverageEr || ''}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        coverageEr: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="95"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tope Anual (UF)</Label>
                <Input
                  type="number"
                  value={newPlan.annualCapUF || ''}
                  onChange={(e) =>
                    setNewPlan({
                      ...newPlan,
                      annualCapUF: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="150"
                />
              </div>
              <div className="space-y-2">
                <Label>Puntuación (0-5)</Label>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={newPlan.score || ''}
                  onChange={(e) =>
                    setNewPlan({
                      ...newPlan,
                      score: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="4.5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Regiones Disponibles *</Label>
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {REGION_CODES.map((region) => (
                  <div key={region.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`region-${region.value}`}
                      checked={newPlan.regionCodes.includes(region.value)}
                      onCheckedChange={() => toggleRegionCode(region.value)}
                    />
                    <Label
                      htmlFor={`region-${region.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {region.value}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags de Red</Label>
              <div className="flex gap-2">
                {['Nacional', 'Internacional', 'Premium'].map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag}`}
                      checked={newPlan.networkTags.includes(tag)}
                      onCheckedChange={() => toggleNetworkTag(tag)}
                    />
                    <Label
                      htmlFor={`tag-${tag}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {tag}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Características</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(newPlan.features).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`feature-${key}`}
                      checked={value as boolean}
                      onCheckedChange={(checked) =>
                        setNewPlan({
                          ...newPlan,
                          features: {
                            ...newPlan.features,
                            [key]: checked === true,
                          },
                        })
                      }
                    />
                    <Label
                      htmlFor={`feature-${key}`}
                      className="text-sm font-normal cursor-pointer capitalize"
                    >
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={newPlan.isActive}
                onCheckedChange={(checked) =>
                  setNewPlan({ ...newPlan, isActive: checked === true })
                }
              />
              <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
                Plan activo
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                syncMutation.isPending ||
                !newPlan.insurerSlug ||
                !newPlan.name ||
                newPlan.regionCodes.length === 0
              }
            >
              {syncMutation.isPending ? 'Creando...' : 'Crear Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Plan */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Plan</DialogTitle>
            <DialogDescription>
              Modifica los datos del plan de salud
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Isapre</Label>
                <Input value={selectedPlan?.insurer.name} disabled />
              </div>
              <div className="space-y-2">
                <Label>Nombre del Plan *</Label>
                <Input
                  value={newPlan.name}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  value={newPlan.code}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, code: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Precio Base (CLP) *</Label>
                <Input
                  type="number"
                  value={newPlan.basePriceCLP || ''}
                  onChange={(e) =>
                    setNewPlan({
                      ...newPlan,
                      basePriceCLP: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Coberturas (%)</Label>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm">Hospitalización</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newPlan.coverageHosp || ''}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        coverageHosp: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Ambulatorio</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newPlan.coverageAmb || ''}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        coverageAmb: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Urgencias</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newPlan.coverageEr || ''}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        coverageEr: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tope Anual (UF)</Label>
                <Input
                  type="number"
                  value={newPlan.annualCapUF || ''}
                  onChange={(e) =>
                    setNewPlan({
                      ...newPlan,
                      annualCapUF: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Puntuación (0-5)</Label>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={newPlan.score || ''}
                  onChange={(e) =>
                    setNewPlan({
                      ...newPlan,
                      score: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Regiones Disponibles *</Label>
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {REGION_CODES.map((region) => (
                  <div key={region.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-region-${region.value}`}
                      checked={newPlan.regionCodes.includes(region.value)}
                      onCheckedChange={() => toggleRegionCode(region.value)}
                    />
                    <Label
                      htmlFor={`edit-region-${region.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {region.value}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags de Red</Label>
              <div className="flex gap-2">
                {['Nacional', 'Internacional', 'Premium'].map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-tag-${tag}`}
                      checked={newPlan.networkTags.includes(tag)}
                      onCheckedChange={() => toggleNetworkTag(tag)}
                    />
                    <Label
                      htmlFor={`edit-tag-${tag}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {tag}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Características</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(newPlan.features).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-feature-${key}`}
                      checked={value as boolean}
                      onCheckedChange={(checked) =>
                        setNewPlan({
                          ...newPlan,
                          features: {
                            ...newPlan.features,
                            [key]: checked === true,
                          },
                        })
                      }
                    />
                    <Label
                      htmlFor={`edit-feature-${key}`}
                      className="text-sm font-normal cursor-pointer capitalize"
                    >
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isActive"
                checked={newPlan.isActive}
                onCheckedChange={(checked) =>
                  setNewPlan({ ...newPlan, isActive: checked === true })
                }
              />
              <Label htmlFor="edit-isActive" className="text-sm font-normal cursor-pointer">
                Plan activo
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={
                syncMutation.isPending ||
                !newPlan.name ||
                newPlan.regionCodes.length === 0
              }
            >
              {syncMutation.isPending ? 'Actualizando...' : 'Actualizar Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar Plan */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Plan</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el plan &quot;{planToDelete?.name}&quot;? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar Todos los Planes */}
      <Dialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Todos los Planes</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar todos los planes? Esta acción eliminará {plans?.length || 0} planes y no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteAllDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteAll}
              disabled={deleteAllMutation.isPending}
            >
              {deleteAllMutation.isPending ? 'Eliminando...' : 'Eliminar Todos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


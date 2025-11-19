import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import * as XLSX from 'xlsx';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async create(createLeadDto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: createLeadDto,
      include: {
        plan: {
          include: {
            insurer: true,
          },
        },
      },
    });
  }

  async findAll(page = 1, limit = 10, search?: string, status?: string, region?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (region) {
      where.region = region;
    }

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        include: {
          plan: {
            include: {
              insurer: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.lead.findUnique({
      where: { id },
      include: {
        plan: {
          include: {
            insurer: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        activities: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async update(id: string, updateLeadDto: UpdateLeadDto, userId?: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    
    // Crear actividad si cambió el status
    if (updateLeadDto.status && lead?.status !== updateLeadDto.status) {
      await this.prisma.leadActivity.create({
        data: {
          leadId: id,
          type: 'status_change',
          description: `Estado cambiado de "${lead?.status}" a "${updateLeadDto.status}"`,
          userId: userId,
        },
      });
    }

    // Crear actividad si se actualizaron las notas
    if (updateLeadDto.notes !== undefined && lead?.notes !== updateLeadDto.notes) {
      await this.prisma.leadActivity.create({
        data: {
          leadId: id,
          type: 'update',
          description: 'Notas actualizadas',
          userId: userId,
        },
      });
    }

    return this.prisma.lead.update({
      where: { id },
      data: updateLeadDto,
      include: {
        plan: {
          include: {
            insurer: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        activities: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async createActivity(leadId: string, createActivityDto: CreateActivityDto, userId?: string) {
    return this.prisma.leadActivity.create({
      data: {
        leadId,
        type: createActivityDto.type,
        description: createActivityDto.description,
        metadata: createActivityDto.metadata,
        userId: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, newThisMonth, contactedThisMonth, qualifiedThisMonth] = await Promise.all([
      this.prisma.lead.count(),
      this.prisma.lead.count({
        where: {
          createdAt: { gte: startOfMonth },
        },
      }),
      this.prisma.lead.count({
        where: {
          status: 'contacted',
          updatedAt: { gte: startOfMonth },
        },
      }),
      this.prisma.lead.count({
        where: {
          status: 'qualified',
          updatedAt: { gte: startOfMonth },
        },
      }),
    ]);

    return {
      total,
      newThisMonth,
      contactedThisMonth,
      qualifiedThisMonth,
    };
  }

  async remove(id: string) {
    // Eliminar actividades primero (cascade debería hacerlo, pero por si acaso)
    await this.prisma.leadActivity.deleteMany({
      where: { leadId: id },
    });
    
    return this.prisma.lead.delete({
      where: { id },
    });
  }

  async removeSampleLeads() {
    // Eliminar todos los leads que tengan email de ejemplo
    const result = await this.prisma.lead.deleteMany({
      where: {
        email: {
          contains: '@example.com',
        },
      },
    });
    return { deleted: result.count };
  }

  async findAllForExport() {
    try {
      // Primero verificar cuántos leads hay en total
      const totalCount = await this.prisma.lead.count();
      console.log(`[findAllForExport] Total de leads en la base de datos: ${totalCount}`);
      
      if (totalCount === 0) {
        console.warn('[findAllForExport] No hay leads en la base de datos');
        return [];
      }
      
      // Obtener todos los leads sin filtros - SIMPLIFICADO para evitar problemas
      const leads = await this.prisma.lead.findMany({
        include: {
          plan: {
            include: {
              insurer: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          activities: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      console.log(`[findAllForExport] Leads obtenidos: ${leads.length}`);
      
      if (leads.length > 0) {
        console.log(`[findAllForExport] Primer lead ejemplo:`, {
          id: leads[0].id,
          name: leads[0].name,
          email: leads[0].email || 'sin email',
          phone: leads[0].phone || 'sin teléfono',
          status: leads[0].status,
          region: leads[0].region || 'sin región',
          reasons: leads[0].reasons || [],
        });
      } else {
        console.warn('[findAllForExport] La consulta no devolvió ningún lead');
      }
      
      return leads;
    } catch (error) {
      console.error('[findAllForExport] ERROR al obtener leads:', error);
      throw error;
    }
  }

  async exportToExcel(): Promise<Buffer> {
    // 1. OBTENER LEADS DE LA TABLA
    const leads = await this.prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    if (leads.length === 0) {
      throw new Error('No hay leads para exportar');
    }

    // 2. MAPEAR A EXCEL
    const mapLead = (lead: any) => {
      const reasons = Array.isArray(lead.reasons) ? lead.reasons.join(', ') : '';
      const utm = lead.utm && typeof lead.utm === 'object' ? lead.utm : {};
      
      return {
        'ID': lead.id,
        'Nombre': lead.name || '',
        'Email': lead.email || '',
        'Teléfono': lead.phone || '',
        'RUT': lead.rut || '',
        'Región': lead.region || '',
        'Isapre Actual': lead.currentInsurer || '',
        'Motivos': reasons,
        'Comentarios': lead.comments || '',
        'Estado': lead.status || 'new',
        'Notas': lead.notes || '',
        'Fecha Creación': lead.createdAt ? new Date(lead.createdAt).toLocaleString('es-CL') : '',
      };
    };

    // 3. CREAR WORKBOOK
    const workbook = XLSX.utils.book_new();
    
    // Hoja 1: TODOS LOS LEADS
    const allData = leads.map(mapLead);
    const allSheet = XLSX.utils.json_to_sheet(allData);
    XLSX.utils.book_append_sheet(workbook, allSheet, 'Todos los Leads');
    
    // Hojas por ESTADO
    const byStatus: { [key: string]: any[] } = {};
    leads.forEach(lead => {
      const status = lead.status || 'new';
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(lead);
    });
    
    Object.keys(byStatus).forEach(status => {
      const data = byStatus[status].map(mapLead);
      const sheet = XLSX.utils.json_to_sheet(data);
      const names: { [key: string]: string } = {
        new: 'Nuevos',
        contacted: 'Contactados',
        qualified: 'Calificados',
        converted: 'Convertidos',
        lost: 'Perdidos',
      };
      XLSX.utils.book_append_sheet(workbook, sheet, names[status] || status);
    });
    
    // Hojas por REGIÓN (máximo 10)
    const byRegion: { [key: string]: any[] } = {};
    leads.forEach(lead => {
      const region = lead.region || 'Sin Región';
      if (!byRegion[region]) byRegion[region] = [];
      byRegion[region].push(lead);
    });
    
    Object.keys(byRegion).slice(0, 10).forEach(region => {
      const data = byRegion[region].map(mapLead);
      const sheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, sheet, `Región ${region.substring(0, 31)}`);
    });

    // 4. GENERAR BUFFER
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    if (!buffer || buffer.length === 0) {
      throw new Error('Error al generar el archivo Excel');
    }
    
    return Buffer.from(buffer);
  }

  private calculateStats(leads: any[]) {
    const stats = {
      total: leads.length,
      byStatus: {
        new: 0,
        contacted: 0,
        qualified: 0,
        converted: 0,
        lost: 0,
      },
      byRegion: {} as { [key: string]: number },
      byInsurer: {} as { [key: string]: number },
    };

    leads.forEach((lead) => {
      // Por estado
      const status = lead.status || 'new';
      if (stats.byStatus[status as keyof typeof stats.byStatus] !== undefined) {
        stats.byStatus[status as keyof typeof stats.byStatus]++;
      }

      // Por región
      const region = lead.region || 'Sin Región';
      stats.byRegion[region] = (stats.byRegion[region] || 0) + 1;

      // Por Isapre
      const insurer = lead.currentInsurer || 'Sin Isapre';
      stats.byInsurer[insurer] = (stats.byInsurer[insurer] || 0) + 1;
    });

    return stats;
  }
}



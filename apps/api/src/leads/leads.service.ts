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
    console.log('=== INICIANDO exportToExcel() ===');
    
    // Obtener todos los leads directamente
    const leads = await this.prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(`Leads obtenidos: ${leads.length}`);
    
    if (!leads || leads.length === 0) {
      throw new Error('No hay leads para exportar');
    }
    
    console.log(`✓ ${leads.length} leads para exportar`);

    // Mapear los datos para Excel - VERSIÓN SIMPLIFICADA
    const mapLeadToRow = (lead: any) => {
      const reasons = Array.isArray(lead.reasons) ? lead.reasons : [];
      const reasonsText = reasons.map((r: string) => {
        const reasonMap: { [key: string]: string } = {
          muy_cara: 'Muy cara',
          cubre_poco: 'La isapre me cubre poco',
          subieron_plan: 'Me subieron el plan de salud',
          mejorar_coberturas: 'Mejorar coberturas',
          no_gusta: 'No me gusta mi Isapre actual',
          otros: 'Otros',
        };
        return reasonMap[r] || r;
      }).join(', ');

      const utm = lead.utm && typeof lead.utm === 'object' ? lead.utm : {};
      const statusMap: { [key: string]: string } = {
        new: 'Nuevo',
        contacted: 'Contactado',
        qualified: 'Calificado',
        converted: 'Convertido',
        lost: 'Perdido',
      };

      return {
        'ID': lead.id || '',
        'Nombre': lead.name || '',
        'Email': lead.email || '',
        'Teléfono': lead.phone || '',
        'RUT': lead.rut || '',
        'Región': lead.region || '',
        'Isapre Actual': lead.currentInsurer || '',
        'Motivos': reasonsText,
        'Comentarios': lead.comments || '',
        'Estado': statusMap[lead.status] || lead.status || '',
        'Notas': lead.notes || '',
        'UTM Source': utm.source || '',
        'UTM Medium': utm.medium || '',
        'UTM Campaign': utm.campaign || '',
        'Fecha Creación': lead.createdAt ? new Date(lead.createdAt).toLocaleString('es-CL') : '',
        'Fecha Actualización': lead.updatedAt ? new Date(lead.updatedAt).toLocaleString('es-CL') : '',
      };
    };

    // Mapear todos los leads
    console.log('Mapeando', leads.length, 'leads...');
    const generalData = leads.map(mapLeadToRow);
    
    console.log('Datos mapeados:', generalData.length, 'filas');
    console.log('Primer registro:', generalData[0] ? {
      ID: generalData[0]['ID'],
      Nombre: generalData[0]['Nombre'],
      Email: generalData[0]['Email'],
    } : 'No hay datos');
    
    // Crear la hoja principal
    const generalSheet = XLSX.utils.json_to_sheet(generalData);
    console.log('✓ Hoja principal creada');

    // Agrupar por estado
    const statusGroups: { [key: string]: any[] } = {};
    leads.forEach((lead) => {
      const status = lead.status || 'new';
      if (!statusGroups[status]) statusGroups[status] = [];
      statusGroups[status].push(lead);
    });

    // Agrupar por región
    const regionGroups: { [key: string]: any[] } = {};
    leads.forEach((lead) => {
      const region = lead.region || 'Sin Región';
      if (!regionGroups[region]) regionGroups[region] = [];
      regionGroups[region].push(lead);
    });

    // Crear el workbook
    const workbook = XLSX.utils.book_new();
    
    // Hoja 1: Todos los leads
    XLSX.utils.book_append_sheet(workbook, generalSheet, 'Todos los Leads');
    
    // Hojas por estado
    const statusMap: { [key: string]: string } = {
      new: 'Nuevos',
      contacted: 'Contactados',
      qualified: 'Calificados',
      converted: 'Convertidos',
      lost: 'Perdidos',
    };
    
    Object.keys(statusGroups).forEach((status) => {
      if (statusGroups[status].length > 0) {
        const statusData = statusGroups[status].map(mapLeadToRow);
        const sheetName = statusMap[status] || status;
        const statusSheet = XLSX.utils.json_to_sheet(statusData);
        XLSX.utils.book_append_sheet(workbook, statusSheet, sheetName);
      }
    });

    // Hojas por región (máximo 10)
    const regionKeys = Object.keys(regionGroups).slice(0, 10);
    regionKeys.forEach((region) => {
      if (regionGroups[region].length > 0) {
        const regionData = regionGroups[region].map(mapLeadToRow);
        const regionSheet = XLSX.utils.json_to_sheet(regionData);
        const sheetName = region.length > 31 ? region.substring(0, 31) : region;
        XLSX.utils.book_append_sheet(workbook, regionSheet, `Región ${sheetName}`);
      }
    });

    // Generar buffer
    console.log('Generando Excel con', workbook.SheetNames.length, 'hojas...');
    console.log('Hojas:', workbook.SheetNames);
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('El workbook no tiene hojas');
    }
    
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
    });
    
    console.log('Buffer generado:', {
      existe: !!buffer,
      esBuffer: Buffer.isBuffer(buffer),
      longitud: buffer?.length || 0,
    });
    
    if (!buffer || buffer.length === 0) {
      throw new Error('El buffer generado está vacío');
    }
    
    const finalBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    
    if (finalBuffer.length === 0) {
      throw new Error('El buffer final está vacío después de la conversión');
    }
    
    console.log('✓ Excel generado correctamente:', finalBuffer.length, 'bytes');
    
    return finalBuffer;
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



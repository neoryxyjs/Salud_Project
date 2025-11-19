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
    const leads = await this.findAllForExport();
    
    console.log('Leads obtenidos en exportToExcel:', {
      cantidad: leads?.length || 0,
      esArray: Array.isArray(leads),
      tipo: typeof leads,
    });
    
    // Validar que haya leads
    if (!leads || leads.length === 0) {
      console.error('ERROR: No hay leads para exportar');
      throw new Error('No hay leads para exportar');
    }
    
    if (!Array.isArray(leads)) {
      console.error('ERROR: Los leads no están en el formato esperado');
      throw new Error('Los leads no están en el formato esperado');
    }
    
    console.log(`✓ Validación pasada. ${leads.length} leads para exportar`);

    // Mapear los datos para Excel
    const mapLeadToRow = (lead: any) => {
      try {
        // Procesar reasons
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

        // Procesar UTM - puede ser JSON o objeto
        let utmSource = '';
        let utmMedium = '';
        let utmCampaign = '';
        
        if (lead.utm) {
          try {
            const utm = typeof lead.utm === 'string' ? JSON.parse(lead.utm) : lead.utm;
            utmSource = utm?.source || '';
            utmMedium = utm?.medium || '';
            utmCampaign = utm?.campaign || '';
          } catch {
            // Si no se puede parsear, dejar vacío
          }
        }

        const statusMap: { [key: string]: string } = {
          new: 'Nuevo',
          contacted: 'Contactado',
          qualified: 'Calificado',
          converted: 'Convertido',
          lost: 'Perdido',
        };

        return {
          'ID': String(lead.id || ''),
          'Nombre': String(lead.name || ''),
          'Email': String(lead.email || ''),
          'Teléfono': String(lead.phone || ''),
          'RUT': String(lead.rut || ''),
          'Región': String(lead.region || ''),
          'Isapre Actual': String(lead.currentInsurer || ''),
          'Motivos': String(reasonsText),
          'Comentarios': String(lead.comments || ''),
          'Estado': String(statusMap[lead.status] || lead.status || ''),
          'Notas': String(lead.notes || ''),
          'Plan': String(lead.plan?.name || ''),
          'Isapre Plan': String(lead.plan?.insurer?.name || ''),
          'UTM Source': String(utmSource),
          'UTM Medium': String(utmMedium),
          'UTM Campaign': String(utmCampaign),
          'Fecha Creación': lead.createdAt ? new Date(lead.createdAt).toLocaleString('es-CL') : '',
          'Fecha Actualización': lead.updatedAt ? new Date(lead.updatedAt).toLocaleString('es-CL') : '',
          'Asignado a': String(lead.user?.email || ''),
          'Total Actividades': Number(lead.activities?.length || 0),
        };
      } catch (error) {
        console.error('[mapLeadToRow] ERROR al mapear lead:', error, lead);
        // Retornar un objeto con valores por defecto si hay error
        return {
          'ID': String(lead?.id || 'ERROR'),
          'Nombre': String(lead?.name || 'ERROR'),
          'Email': '',
          'Teléfono': '',
          'RUT': '',
          'Región': '',
          'Isapre Actual': '',
          'Motivos': '',
          'Comentarios': '',
          'Estado': '',
          'Notas': '',
          'Plan': '',
          'Isapre Plan': '',
          'UTM Source': '',
          'UTM Medium': '',
          'UTM Campaign': '',
          'Fecha Creación': '',
          'Fecha Actualización': '',
          'Asignado a': '',
          'Total Actividades': 0,
        };
      }
    };

    // Hoja 1: Resumen General - ESTA ES LA HOJA PRINCIPAL CON TODOS LOS LEADS
    console.log('Mapeando leads a formato Excel...');
    const generalData = leads.map(mapLeadToRow);
    
    console.log('Datos mapeados:', {
      cantidad: generalData.length,
      primerRegistro: generalData[0] ? Object.keys(generalData[0]) : null,
    });
    
    if (generalData.length === 0) {
      console.error('ERROR: No se pudieron mapear los leads para el Excel');
      throw new Error('No se pudieron mapear los leads para el Excel');
    }
    
    // Crear la hoja principal con TODOS los leads
    console.log('Creando hoja de Excel...');
    const generalSheet = XLSX.utils.json_to_sheet(generalData);
    
    console.log('Hoja creada:', {
      existe: !!generalSheet,
      keys: generalSheet ? Object.keys(generalSheet).length : 0,
    });
    
    if (!generalSheet || Object.keys(generalSheet).length === 0) {
      console.error('ERROR: Error al crear la hoja de Excel con los leads');
      throw new Error('Error al crear la hoja de Excel con los leads');
    }
    
    console.log('✓ Hoja principal creada correctamente');

    // Hoja 2: Por Estado
    const statusGroups: { [key: string]: any[] } = {};
    leads.forEach((lead) => {
      const status = lead.status || 'new';
      if (!statusGroups[status]) {
        statusGroups[status] = [];
      }
      statusGroups[status].push(lead);
    });

    const statusSheets: { [key: string]: XLSX.WorkSheet } = {};
    Object.keys(statusGroups).forEach((status) => {
      if (statusGroups[status].length > 0) {
        const statusData = statusGroups[status].map(mapLeadToRow);
        const statusMap: { [key: string]: string } = {
          new: 'Nuevos',
          contacted: 'Contactados',
          qualified: 'Calificados',
          converted: 'Convertidos',
          lost: 'Perdidos',
        };
        const sheetName = statusMap[status] || status;
        statusSheets[sheetName] = XLSX.utils.json_to_sheet(statusData);
      }
    });

    // Hoja 3: Por Región
    const regionGroups: { [key: string]: any[] } = {};
    leads.forEach((lead) => {
      const region = lead.region || 'Sin Región';
      if (!regionGroups[region]) {
        regionGroups[region] = [];
      }
      regionGroups[region].push(lead);
    });

    const regionSheets: { [key: string]: XLSX.WorkSheet } = {};
    Object.keys(regionGroups).forEach((region) => {
      if (regionGroups[region].length > 0) {
        const regionData = regionGroups[region].map(mapLeadToRow);
        const sheetName = region.length > 31 ? region.substring(0, 31) : region;
        regionSheets[sheetName] = XLSX.utils.json_to_sheet(regionData);
      }
    });

    // Hoja 4: Estadísticas
    const stats = this.calculateStats(leads);
    const statsData = [
      { 'Métrica': 'Total de Leads', 'Valor': stats.total },
      { 'Métrica': 'Nuevos', 'Valor': stats.byStatus.new },
      { 'Métrica': 'Contactados', 'Valor': stats.byStatus.contacted },
      { 'Métrica': 'Calificados', 'Valor': stats.byStatus.qualified },
      { 'Métrica': 'Convertidos', 'Valor': stats.byStatus.converted },
      { 'Métrica': 'Perdidos', 'Valor': stats.byStatus.lost },
      { 'Métrica': '', 'Valor': '' },
      { 'Métrica': 'Por Región', 'Valor': '' },
      ...Object.keys(stats.byRegion).map((region) => ({
        'Métrica': region || 'Sin Región',
        'Valor': stats.byRegion[region],
      })),
      { 'Métrica': '', 'Valor': '' },
      { 'Métrica': 'Por Isapre Actual', 'Valor': '' },
      ...Object.keys(stats.byInsurer).map((insurer) => ({
        'Métrica': insurer || 'Sin Isapre',
        'Valor': stats.byInsurer[insurer],
      })),
    ];
    const statsSheet = XLSX.utils.json_to_sheet(statsData);

    // Crear el workbook
    const workbook = XLSX.utils.book_new();

    // Agregar la hoja principal con TODOS los leads
    XLSX.utils.book_append_sheet(workbook, generalSheet, 'Resumen General');
    
    // Agregar hojas por estado
    Object.keys(statusSheets).forEach((sheetName) => {
      XLSX.utils.book_append_sheet(workbook, statusSheets[sheetName], sheetName);
    });

    // Agregar hojas por región (solo si hay menos de 10 regiones)
    const regionKeys = Object.keys(regionSheets);
    if (regionKeys.length <= 10) {
      regionKeys.forEach((sheetName) => {
        XLSX.utils.book_append_sheet(workbook, regionSheets[sheetName], `Región ${sheetName}`);
      });
    }

    // Agregar hoja de estadísticas
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Estadísticas');

    // Generar buffer
    console.log('Generando buffer del Excel...');
    console.log('Workbook info:', {
      sheetNames: workbook.SheetNames,
      cantidadHojas: workbook.SheetNames?.length || 0,
    });
    
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
    });
    
    console.log('Buffer generado por XLSX.write:', {
      existe: !!buffer,
      esBuffer: Buffer.isBuffer(buffer),
      longitud: buffer?.length || 0,
      tipo: typeof buffer,
    });
    
    if (!buffer || buffer.length === 0) {
      console.error('ERROR: Error al generar el buffer del archivo Excel');
      throw new Error('Error al generar el buffer del archivo Excel');
    }
    
    const finalBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    
    console.log('Buffer final:', {
      esBuffer: Buffer.isBuffer(finalBuffer),
      longitud: finalBuffer.length,
    });
    
    console.log('=== FINALIZANDO exportToExcel() ===');
    
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


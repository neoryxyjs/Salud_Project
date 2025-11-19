import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';

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
    console.log('📊 SERVICIO exportToExcel() INICIADO');
    
    // 1. OBTENER LEADS DE LA TABLA
    const leads = await this.prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(`📊 Leads obtenidos de la BD: ${leads.length}`);
    
    if (leads.length === 0) {
      throw new Error('No hay leads para exportar');
    }

    // Mapeo de IDs de motivos a etiquetas en español
    const reasonLabels: { [key: string]: string } = {
      'muy_cara': 'Muy cara',
      'cubre_poco': 'La isapre me cubre poco',
      'subieron_plan': 'Me subieron el plan de salud',
      'mejorar_coberturas': 'Mejorar coberturas',
      'no_gusta': 'No me gusta mi Isapre actual',
      'otros': 'Otros',
    };

    // Mapeo de estados en inglés a español
    const statusLabels: { [key: string]: string } = {
      'new': 'Nuevo',
      'contacted': 'Contactado',
      'qualified': 'Calificado',
      'converted': 'Convertido',
      'lost': 'Perdido',
      'contesta': 'Contesta',
      'no_contesta': 'No contesta',
      'buzon': 'Buzón',
      'volver_llamar': 'Volver a llamar',
      'en_proceso': 'En proceso',
      'cursado': 'Cursado (Contrato generado)',
      'no_interesa': 'No le interesa',
    };

    // 2. MAPEAR A EXCEL
    const mapLead = (lead: any) => {
      // Convertir IDs de motivos a etiquetas en español
      const reasonsArray = Array.isArray(lead.reasons) ? lead.reasons : [];
      const reasonsLabelsText = reasonsArray
        .map((reasonId: string) => reasonLabels[reasonId] || reasonId)
        .join(', ');
      
      // Traducir estado al español
      const status = lead.status || 'new';
      const statusInSpanish = statusLabels[status] || status;
      
      // Asegurar que los comentarios se muestren como texto plano
      const comments = lead.comments || '';
      
      return {
        'ID': lead.id,
        'Nombre': lead.name || '',
        'Email': lead.email || '',
        'Teléfono': lead.phone || '',
        'RUT': lead.rut || '',
        'Región': lead.region || '',
        'Isapre Actual': lead.currentInsurer || '',
        'Motivos': reasonsLabelsText,
        'Comentarios': comments,
        'Estado': statusInSpanish,
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
        contesta: 'Contesta',
        no_contesta: 'No contesta',
        buzon: 'Buzón',
        volver_llamar: 'Volver a llamar',
        en_proceso: 'En proceso',
        cursado: 'Cursado',
        no_interesa: 'No le interesa',
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
    
    console.log('Buffer generado:', {
      existe: !!buffer,
      longitud: buffer?.length || 0,
      tipo: typeof buffer,
      esBuffer: Buffer.isBuffer(buffer),
    });
    
    if (!buffer || buffer.length === 0) {
      throw new Error('Error al generar el archivo Excel');
    }
    
    const finalBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    
    console.log('Buffer final:', {
      longitud: finalBuffer.length,
      esBuffer: Buffer.isBuffer(finalBuffer),
    });
    
    return finalBuffer;
  }

  async generateTemplateExcel(): Promise<Buffer> {
    console.log('📋 GENERANDO TEMPLATE EXCEL CON VALIDACIÓN DE DATOS');
    
    const workbook = new ExcelJS.Workbook();
    
    // Valores permitidos
    const estados = [
      'Nuevo',
      'Contactado',
      'Calificado',
      'Convertido',
      'Perdido',
      'Contesta',
      'No contesta',
      'Buzón',
      'Volver a llamar',
      'En proceso',
      'Cursado (Contrato generado)',
      'No le interesa',
    ];
    const motivos = [
      'Muy cara',
      'La isapre me cubre poco',
      'Me subieron el plan de salud',
      'Mejorar coberturas',
      'No me gusta mi Isapre actual',
      'Otros',
    ];
    const isapres = [
      'Banmédica',
      'Colmena Golden Cross',
      'Consalud',
      'Cruz Blanca',
      'Esencial Isapre',
      'Nueva Masvida',
      'Vida Tres',
    ];
    const regiones = [
      'Región Metropolitana',
      'Región de Valparaíso',
      'Región del Biobío',
      'Región de La Araucanía',
      'Región de Los Lagos',
      'Región de Tarapacá',
      'Región de Antofagasta',
      'Región de Atacama',
      'Región de Coquimbo',
      'Región de O\'Higgins',
      'Región del Maule',
      'Región de Ñuble',
      'Región de Los Ríos',
      'Región de Aysén',
      'Región de Magallanes',
      'Región de Arica y Parinacota',
    ];

    // Crear hojas de referencia (ocultas)
    const estadosSheet = workbook.addWorksheet('_Estados');
    estados.forEach((estado, index) => {
      estadosSheet.getCell(`A${index + 1}`).value = estado;
    });

    const motivosSheet = workbook.addWorksheet('_Motivos');
    motivos.forEach((motivo, index) => {
      motivosSheet.getCell(`A${index + 1}`).value = motivo;
    });

    const isapresSheet = workbook.addWorksheet('_Isapres');
    isapres.forEach((isapre, index) => {
      isapresSheet.getCell(`A${index + 1}`).value = isapre;
    });

    const regionesSheet = workbook.addWorksheet('_Regiones');
    regiones.forEach((region, index) => {
      regionesSheet.getCell(`A${index + 1}`).value = region;
    });

    // Ocultar hojas de referencia
    estadosSheet.state = 'hidden';
    motivosSheet.state = 'hidden';
    isapresSheet.state = 'hidden';
    regionesSheet.state = 'hidden';

    // Hoja principal: Template
    const templateSheet = workbook.addWorksheet('Template');
    
    // Encabezados
    templateSheet.getRow(1).values = [
      'ID',
      'Nombre',
      'Email',
      'Teléfono',
      'RUT',
      'Región',
      'Isapre Actual',
      'Motivos',
      'Comentarios',
      'Estado',
      'Notas',
    ];

    // Estilo de encabezados
    templateSheet.getRow(1).font = { bold: true };
    templateSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Fila de ejemplo
    templateSheet.getRow(2).values = [
      '',
      'Juan Pérez',
      'juan@email.com',
      '+56912345678',
      '12.345.678-9',
      'Región Metropolitana',
      'Banmédica',
      'Muy cara, Mejorar coberturas',
      'Cliente interesado en mejorar su plan',
      'Nuevo',
      'Contactar esta semana',
    ];

    // Ajustar ancho de columnas
    templateSheet.columns = [
      { width: 40 }, // ID
      { width: 20 }, // Nombre
      { width: 25 }, // Email
      { width: 15 }, // Teléfono
      { width: 15 }, // RUT
      { width: 25 }, // Región
      { width: 20 }, // Isapre Actual
      { width: 40 }, // Motivos
      { width: 40 }, // Comentarios
      { width: 20 }, // Estado
      { width: 30 }, // Notas
    ];

    // Agregar validación de datos (dropdowns) a partir de la fila 2
    // Aplicar a las primeras 1000 filas para que funcione en todas las filas nuevas
    
    // Columna F (6): Región
    for (let row = 2; row <= 1000; row++) {
      const cell = templateSheet.getCell(row, 6);
      cell.dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`'_Regiones'!$A$1:$A$${regiones.length}`],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'Valor inválido',
        error: 'Por favor, selecciona un valor de la lista.',
      };
    }

    // Columna G (7): Isapre Actual
    for (let row = 2; row <= 1000; row++) {
      const cell = templateSheet.getCell(row, 7);
      cell.dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`'_Isapres'!$A$1:$A$${isapres.length}`],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'Valor inválido',
        error: 'Por favor, selecciona un valor de la lista.',
      };
    }

    // Columna J (10): Estado
    for (let row = 2; row <= 1000; row++) {
      const cell = templateSheet.getCell(row, 10);
      cell.dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`'_Estados'!$A$1:$A$${estados.length}`],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'Valor inválido',
        error: 'Por favor, selecciona un valor de la lista.',
      };
    }

    // Hoja de valores permitidos (visible)
    const valoresSheet = workbook.addWorksheet('Valores Permitidos');
    valoresSheet.getRow(1).values = ['Campo', 'Valores Permitidos'];
    valoresSheet.getRow(1).font = { bold: true };
    valoresSheet.getRow(2).values = ['Estado', estados.join(', ')];
    valoresSheet.getRow(3).values = ['Motivos', motivos.join(', ')];
    valoresSheet.getRow(4).values = ['Isapre Actual', isapres.join(', ')];
    valoresSheet.getRow(5).values = ['Región', regiones.join(', ')];
    valoresSheet.columns = [{ width: 20 }, { width: 80 }];

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    console.log('✅ Template Excel con validación generado');
    
    return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  }

  async importFromExcel(buffer: Buffer, userId?: string) {
    console.log('📥 IMPORTAR EXCEL INICIADO');
    
    try {
      // 1. LEER EL WORKBOOK
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('El archivo Excel no contiene hojas');
      }

      console.log(`📊 Hojas encontradas: ${workbook.SheetNames.join(', ')}`);

      // Mapeo inverso: de español a inglés
      const statusMap: { [key: string]: string } = {
        'Nuevo': 'new',
        'Contactado': 'contacted',
        'Calificado': 'qualified',
        'Convertido': 'converted',
        'Perdido': 'lost',
        'Contesta': 'contesta',
        'No contesta': 'no_contesta',
        'Buzón': 'buzon',
        'Volver a llamar': 'volver_llamar',
        'En proceso': 'en_proceso',
        'Cursado (Contrato generado)': 'cursado',
        'Cursado': 'cursado', // También aceptar sin el paréntesis
        'No le interesa': 'no_interesa',
      };

      const reasonMap: { [key: string]: string } = {
        'Muy cara': 'muy_cara',
        'La isapre me cubre poco': 'cubre_poco',
        'Me subieron el plan de salud': 'subieron_plan',
        'Mejorar coberturas': 'mejorar_coberturas',
        'No me gusta mi Isapre actual': 'no_gusta',
        'Otros': 'otros',
      };

      // 2. PROCESAR TODAS LAS HOJAS
      const allLeads: any[] = [];
      const processedIds = new Set<string>();

      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        console.log(`📄 Procesando hoja "${sheetName}": ${data.length} filas`);

        data.forEach((row: any, index: number) => {
          try {
            // Mapear columnas del Excel a campos del Lead
            const leadId = row['ID'] || row['id'];
            const name = row['Nombre'] || row['nombre'] || '';
            const email = row['Email'] || row['email'] || '';
            
            // Convertir teléfono a string (puede venir como número desde Excel)
            let phone = row['Teléfono'] || row['telefono'] || '';
            if (phone && typeof phone === 'number') {
              phone = phone.toString();
            }
            phone = phone || null;
            
            const rut = row['RUT'] || row['rut'] || '';
            const region = row['Región'] || row['region'] || '';
            
            // Mapear Isapre Actual (puede venir con diferentes nombres de columna)
            let currentInsurer = row['Isapre Actual'] || row['isapre_actual'] || row['Isapre'] || row['isapre'] || '';
            // Convertir a string si viene como número u otro tipo
            if (currentInsurer && typeof currentInsurer !== 'string') {
              currentInsurer = String(currentInsurer);
            }
            // Limpiar espacios y convertir a null si está vacío
            currentInsurer = currentInsurer && currentInsurer.trim() ? currentInsurer.trim() : null;
            
            // Convertir comentarios y notas a string (pueden venir como números)
            let comments = row['Comentarios'] || row['comentarios'] || '';
            if (comments && typeof comments !== 'string') {
              comments = String(comments);
            }
            comments = comments || null;
            
            let notes = row['Notas'] || row['notas'] || '';
            if (notes && typeof notes !== 'string') {
              notes = String(notes);
            }
            notes = notes || null;
            
            // Traducir estado de español a inglés
            const statusSpanish = row['Estado'] || row['estado'] || 'Nuevo';
            const status = statusMap[statusSpanish] || statusSpanish.toLowerCase() || 'new';
            
            // Traducir motivos de español a inglés
            const reasonsText = row['Motivos'] || row['motivos'] || '';
            const reasonsArray: string[] = [];
            if (reasonsText) {
              // Convertir a string si viene como número
              const reasonsTextStr = typeof reasonsText === 'string' ? reasonsText : String(reasonsText);
              const reasonsList = reasonsTextStr.split(',').map((r: string) => r.trim()).filter(r => r);
              reasonsList.forEach((reasonText: string) => {
                const reasonId = reasonMap[reasonText] || reasonText;
                if (reasonId && !reasonsArray.includes(reasonId)) {
                  reasonsArray.push(reasonId);
                }
              });
            }

            // Validar datos mínimos
            if (!name || !email) {
              console.warn(`⚠️ Fila ${index + 1} en "${sheetName}" omitida: falta nombre o email`);
              return;
            }

            // Evitar duplicados si ya procesamos este ID
            if (leadId && processedIds.has(leadId)) {
              console.log(`⏭️ Lead con ID ${leadId} ya procesado, omitiendo`);
              return;
            }

            const leadData = {
              name: String(name),
              email: String(email),
              phone: phone,
              rut: rut ? String(rut).trim() : null,
              region: region ? String(region).trim() : null,
              currentInsurer: currentInsurer,
              reasons: reasonsArray,
              comments: comments,
              notes: notes,
              status: String(status),
              userId: userId || null,
            };

            // Log para debugging
            if (currentInsurer) {
              console.log(`📝 Lead "${name}" - Isapre Actual: "${currentInsurer}"`);
            }

            allLeads.push({
              id: leadId,
              data: leadData,
            });

            if (leadId) {
              processedIds.add(leadId);
            }
          } catch (error) {
            console.error(`❌ Error procesando fila ${index + 1} en "${sheetName}":`, error);
          }
        });
      });

      console.log(`📊 Total de leads a procesar: ${allLeads.length}`);

      // 3. CREAR O ACTUALIZAR LEADS
      const results = {
        created: 0,
        updated: 0,
        errors: 0,
        errorsList: [] as string[],
      };

      for (const { id, data } of allLeads) {
        try {
          if (id) {
            // Intentar actualizar si existe
            const existing = await this.prisma.lead.findUnique({
              where: { id },
            });

            if (existing) {
              console.log(`🔄 Actualizando lead ${id} con datos:`, JSON.stringify(data, null, 2));
              await this.prisma.lead.update({
                where: { id },
                data,
              });
              results.updated++;
              console.log(`✅ Lead ${id} actualizado - Isapre Actual: "${data.currentInsurer || 'null'}"`);
            } else {
              // Crear con el ID especificado
              console.log(`➕ Creando lead ${id} con datos:`, JSON.stringify({ ...data, id }, null, 2));
              await this.prisma.lead.create({
                data: {
                  ...data,
                  id,
                },
              });
              results.created++;
              console.log(`✅ Lead ${id} creado - Isapre Actual: "${data.currentInsurer || 'null'}"`);
            }
          } else {
            // Crear nuevo lead sin ID
            console.log(`➕ Creando nuevo lead con datos:`, JSON.stringify(data, null, 2));
            const created = await this.prisma.lead.create({
              data,
            });
            results.created++;
            console.log(`✅ Nuevo lead creado (ID: ${created.id}) - Isapre Actual: "${data.currentInsurer || 'null'}"`);
          }
        } catch (error: any) {
          results.errors++;
          const errorMsg = `Error procesando lead ${id || 'nuevo'}: ${error.message}`;
          results.errorsList.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      console.log('📊 RESUMEN DE IMPORTACIÓN:', results);

      return {
        success: true,
        message: `Importación completada: ${results.created} creados, ${results.updated} actualizados, ${results.errors} errores`,
        ...results,
      };
    } catch (error: any) {
      console.error('❌ ERROR AL IMPORTAR EXCEL:', error);
      throw new Error(`Error al importar el archivo Excel: ${error.message}`);
    }
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



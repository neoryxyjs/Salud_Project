import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  Delete,
  Res,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { validateRUT } from '../utils/rut-validator';

@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Post()
  create(@Body() createLeadDto: CreateLeadDto, @Request() req) {
    // Validar RUT si se proporciona
    if (createLeadDto.rut && !validateRUT(createLeadDto.rut)) {
      throw new BadRequestException('El RUT proporcionado no es válido');
    }
    
    // Capturar UTM parameters si vienen en el query
    const utmParams: any = {};
    if (req.query?.utm_source) utmParams.source = req.query.utm_source;
    if (req.query?.utm_medium) utmParams.medium = req.query.utm_medium;
    if (req.query?.utm_campaign) utmParams.campaign = req.query.utm_campaign;
    if (req.headers?.referer) utmParams.referrer = req.headers.referer;
    if (req.headers?.['user-agent']) utmParams.userAgent = req.headers['user-agent'];
    
    return this.leadsService.create({
      ...createLeadDto,
      utm: Object.keys(utmParams).length > 0 ? utmParams : createLeadDto.utm,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('region') region?: string,
  ) {
    return this.leadsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
      status,
      region,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @Request() req,
  ) {
    return this.leadsService.update(id, updateLeadDto, req.user?.id);
  }

  @Post(':id/activities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  createActivity(
    @Param('id') id: string,
    @Body() createActivityDto: CreateActivityDto,
    @Request() req,
  ) {
    return this.leadsService.createActivity(id, createActivityDto, req.user?.id);
  }

  @Get('stats/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  getStats() {
    return this.leadsService.getStats();
  }


  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  remove(@Param('id') id: string) {
    return this.leadsService.remove(id);
  }

  @Delete('cleanup/sample')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  removeSampleLeads() {
    return this.leadsService.removeSampleLeads();
  }

  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async exportToExcel(@Res({ passthrough: false }) res: Response) {
    try {
      console.log('=== INICIANDO EXPORTACIÓN DE EXCEL ===');
      const buffer = await this.leadsService.exportToExcel();
      
      console.log('Buffer recibido del servicio:', {
        existe: !!buffer,
        esBuffer: Buffer.isBuffer(buffer),
        longitud: buffer?.length || 0,
        primerosBytes: buffer?.slice(0, 10)?.toString('hex'),
      });
      
      if (!buffer || buffer.length === 0) {
        console.error('ERROR: Buffer vacío o null');
        return res.status(500).json({ 
          error: 'Error al generar el archivo Excel',
          message: 'El buffer generado está vacío. Verifica que haya leads para exportar.'
        });
      }
      
      const filename = `leads_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Asegurar que el buffer sea un Buffer válido
      const bufferToSend = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
      
      console.log('Buffer a enviar:', {
        longitud: bufferToSend.length,
        esBuffer: Buffer.isBuffer(bufferToSend),
        primerosBytes: bufferToSend.slice(0, 10).toString('hex'),
      });
      
      // Configurar headers ANTES de escribir
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Length', bufferToSend.length.toString());
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      console.log('Headers configurados, enviando buffer...');
      
      // Escribir el buffer directamente
      res.write(bufferToSend);
      res.end();
      
      console.log('✓ Excel enviado correctamente');
    } catch (error) {
      console.error('ERROR al exportar Excel:', error);
      console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
      
      if (!res.headersSent) {
        return res.status(500).json({ 
          error: 'Error al generar el archivo Excel',
          message: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }
  }
}


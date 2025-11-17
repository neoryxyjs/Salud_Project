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
} from '@nestjs/common';
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
}


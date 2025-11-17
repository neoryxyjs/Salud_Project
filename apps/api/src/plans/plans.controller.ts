import { Controller, Get, Param, Query, Post, Body, UseGuards } from '@nestjs/common';
import { PlansService } from './plans.service';
import { GetPlansDto } from './dto/get-plans.dto';
import { SyncPlansDto } from './dto/sync-plans.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('plans')
export class PlansController {
  constructor(private plansService: PlansService) {}

  @Get()
  findAll(@Query() query: GetPlansDto) {
    return this.plansService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.plansService.findBySlug(slug);
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  async syncPlans(@Body() syncPlansDto: SyncPlansDto) {
    return this.plansService.syncPlans(syncPlansDto.plans);
  }
}


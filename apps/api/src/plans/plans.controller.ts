import { Controller, Get, Param, Query } from '@nestjs/common';
import { PlansService } from './plans.service';
import { GetPlansDto } from './dto/get-plans.dto';

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
}


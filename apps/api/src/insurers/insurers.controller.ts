import { Controller, Get, Param } from '@nestjs/common';
import { InsurersService } from './insurers.service';

@Controller('insurers')
export class InsurersController {
  constructor(private insurersService: InsurersService) {}

  @Get()
  findAll() {
    return this.insurersService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.insurersService.findOne(slug);
  }
}


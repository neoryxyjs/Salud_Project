import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InsurersController } from './insurers.controller';
import { InsurersService } from './insurers.service';

@Module({
  imports: [PrismaModule],
  controllers: [InsurersController],
  providers: [InsurersService],
})
export class InsurersModule {}


import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InsurersModule } from './insurers/insurers.module';
import { PlansModule } from './plans/plans.module';
import { LeadsModule } from './leads/leads.module';
import { NewsModule } from './news/news.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    InsurersModule,
    PlansModule,
    LeadsModule,
    NewsModule,
  ],
})
export class AppModule {}


import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InsurersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.insurer.findMany({
      include: {
        plans: {
          where: { isActive: true },
          take: 1,
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(slug: string) {
    return this.prisma.insurer.findUnique({
      where: { slug },
      include: {
        plans: {
          where: { isActive: true },
        },
      },
    });
  }
}


import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetPlansDto } from './dto/get-plans.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: GetPlansDto) {
    const where: any = {
      isActive: true,
    };

    if (filters.insurerId) {
      where.insurerId = filters.insurerId;
    }

    const plans = await this.prisma.plan.findMany({
      where,
      include: {
        insurer: true,
        tiers: true,
      },
    });

    // Filter and calculate prices based on filters
    let filteredPlans = plans.map((plan) => {
      // Try to find matching tier
      const matchingTier = plan.tiers.find(
        (tier) =>
          (!filters.region || tier.region === filters.region) &&
          (!filters.age ||
            (filters.age >= tier.ageFrom && filters.age <= tier.ageTo)) &&
          (!filters.cargas || tier.cargas === filters.cargas),
      );

      const price = matchingTier
        ? matchingTier.priceCLP
        : plan.basePriceCLP;

      return {
        ...plan,
        calculatedPrice: price,
      };
    });

    // Apply filters
    filteredPlans = filteredPlans.filter((plan) => {
      // Filter by maxPrice
      if (filters.maxPrice && plan.calculatedPrice > filters.maxPrice) {
        return false;
      }
      // Filter by region (check regionCodes)
      if (filters.region && !plan.regionCodes.includes(filters.region)) {
        return false;
      }
      return true;
    });

    // Sort by price
    filteredPlans.sort((a, b) => a.calculatedPrice - b.calculatedPrice);

    return filteredPlans;
  }

  async findOne(id: string) {
    return this.prisma.plan.findUnique({
      where: { id },
      include: {
        insurer: true,
        tiers: true,
      },
    });
  }

  async findBySlug(slug: string) {
    const insurer = await this.prisma.insurer.findUnique({
      where: { slug },
    });

    if (!insurer) {
      return null;
    }

    return this.prisma.plan.findMany({
      where: {
        insurerId: insurer.id,
        isActive: true,
      },
      include: {
        insurer: true,
        tiers: true,
      },
    });
  }
}


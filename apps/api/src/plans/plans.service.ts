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

  async syncPlans(plansData: any[]) {
    const results = [];

    for (const planData of plansData) {
      // Buscar o crear el insurer
      const insurer = await this.prisma.insurer.findUnique({
        where: { slug: planData.insurerSlug },
      });

      if (!insurer) {
        results.push({
          success: false,
          plan: planData.name,
          error: `Insurer with slug ${planData.insurerSlug} not found`,
        });
        continue;
      }

      // Buscar plan existente por código o nombre
      const existingPlan = planData.code
        ? await this.prisma.plan.findFirst({
            where: {
              insurerId: insurer.id,
              code: planData.code,
            },
          })
        : await this.prisma.plan.findFirst({
            where: {
              insurerId: insurer.id,
              name: planData.name,
            },
          });

      const planDataToSave = {
        insurerId: insurer.id,
        name: planData.name,
        code: planData.code,
        regionCodes: planData.regionCodes,
        basePriceCLP: planData.basePriceCLP,
        coverageHosp: planData.coverageHosp,
        coverageAmb: planData.coverageAmb,
        coverageEr: planData.coverageEr,
        annualCapUF: planData.annualCapUF,
        networkTags: planData.networkTags || [],
        features: planData.features || {},
        score: planData.score,
        isActive: planData.isActive !== undefined ? planData.isActive : true,
      };

      let plan;
      if (existingPlan) {
        // Actualizar plan existente
        plan = await this.prisma.plan.update({
          where: { id: existingPlan.id },
          data: planDataToSave,
        });

        // Eliminar tiers existentes y crear nuevos
        await this.prisma.priceTier.deleteMany({
          where: { planId: plan.id },
        });
      } else {
        // Crear nuevo plan
        plan = await this.prisma.plan.create({
          data: planDataToSave,
        });
      }

      // Crear tiers si existen
      if (planData.tiers && planData.tiers.length > 0) {
        await this.prisma.priceTier.createMany({
          data: planData.tiers.map((tier: any) => ({
            planId: plan.id,
            ageFrom: tier.ageFrom,
            ageTo: tier.ageTo,
            cargas: tier.cargas,
            region: tier.region,
            priceCLP: tier.priceCLP,
          })),
        });
      }

      results.push({
        success: true,
        plan: plan.name,
        action: existingPlan ? 'updated' : 'created',
      });
    }

    return results;
  }
}


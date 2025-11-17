import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create users
  const adminPassword = await bcrypt.hash('028956310as', 10);
  const managerPassword = await bcrypt.hash('028956310as', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@solucionsalud.com' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
    },
    create: {
      email: 'admin@solucionsalud.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@solucionsalud.com' },
    update: {
      password: managerPassword,
      role: 'MANAGER',
    },
    create: {
      email: 'manager@solucionsalud.com',
      password: managerPassword,
      role: 'MANAGER',
    },
  });

  console.log('Users created:', { admin, manager });

  // Create insurers
  const isapres = [
    {
      name: 'Banmédica',
      slug: 'banmedica',
      logoUrl: 'https://via.placeholder.com/150?text=Banmedica',
    },
    {
      name: 'Colmena Golden Cross',
      slug: 'colmena',
      logoUrl: 'https://via.placeholder.com/150?text=Colmena',
    },
    {
      name: 'Consalud',
      slug: 'consalud',
      logoUrl: 'https://via.placeholder.com/150?text=Consalud',
    },
    {
      name: 'Cruz Blanca',
      slug: 'cruz-blanca',
      logoUrl: 'https://via.placeholder.com/150?text=CruzBlanca',
    },
    {
      name: 'Nueva Masvida',
      slug: 'nueva-masvida',
      logoUrl: 'https://via.placeholder.com/150?text=Masvida',
    },
    {
      name: 'Vida Tres',
      slug: 'vida-tres',
      logoUrl: 'https://via.placeholder.com/150?text=VidaTres',
    },
  ];

  const createdInsurers = [];
  for (const isapre of isapres) {
    const insurer = await prisma.insurer.upsert({
      where: { slug: isapre.slug },
      update: {},
      create: isapre,
    });
    createdInsurers.push(insurer);
  }

  console.log('Insurers created:', createdInsurers.length);

  // Create plans for each insurer
  const regions = ['RM', 'V', 'VIII', 'IX', 'X'];
  const planNames = ['Plan Básico', 'Plan Intermedio', 'Plan Premium', 'Plan Ejecutivo'];

  for (const insurer of createdInsurers) {
    for (let i = 0; i < planNames.length; i++) {
      const planName = planNames[i];
      const basePrice = 50000 + i * 20000;
      const score = 3.5 + i * 0.4;

      const plan = await prisma.plan.create({
        data: {
          insurerId: insurer.id,
          name: `${insurer.name} - ${planName}`,
          code: `${insurer.slug}-${i + 1}`,
          regionCodes: regions,
          basePriceCLP: basePrice,
          coverageHosp: 80 + i * 5,
          coverageAmb: 70 + i * 5,
          coverageEr: 90 + i * 3,
          annualCapUF: 100 + i * 50,
          networkTags: ['Nacional', i > 1 ? 'Internacional' : null].filter((tag): tag is string => tag !== null),
          features: {
            dental: i > 0,
            oftalmologia: i > 1,
            medicinaPreventiva: true,
            urgencias24h: true,
            telemedicina: i > 2,
          },
          score: score,
          isActive: true,
          tiers: {
            create: [
              // Age 0-29
              {
                ageFrom: 0,
                ageTo: 29,
                cargas: 1,
                region: 'RM',
                priceCLP: basePrice,
              },
              {
                ageFrom: 0,
                ageTo: 29,
                cargas: 2,
                region: 'RM',
                priceCLP: basePrice * 1.8,
              },
              {
                ageFrom: 0,
                ageTo: 29,
                cargas: 3,
                region: 'RM',
                priceCLP: basePrice * 2.5,
              },
              // Age 30-44
              {
                ageFrom: 30,
                ageTo: 44,
                cargas: 1,
                region: 'RM',
                priceCLP: basePrice * 1.2,
              },
              {
                ageFrom: 30,
                ageTo: 44,
                cargas: 2,
                region: 'RM',
                priceCLP: basePrice * 2.0,
              },
              // Age 45-59
              {
                ageFrom: 45,
                ageTo: 59,
                cargas: 1,
                region: 'RM',
                priceCLP: basePrice * 1.5,
              },
              {
                ageFrom: 45,
                ageTo: 59,
                cargas: 2,
                region: 'RM',
                priceCLP: basePrice * 2.3,
              },
              // Age 60+
              {
                ageFrom: 60,
                ageTo: 99,
                cargas: 1,
                region: 'RM',
                priceCLP: basePrice * 2.0,
              },
            ],
          },
        },
      });

      // Leads are now created manually through the CRM interface
    }
  }

  console.log('Plans and leads created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


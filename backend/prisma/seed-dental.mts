/**
 * Seed d'un établissement démo « clinique dentaire » pour tester le tunnel
 * public /book/[slug] avec des actes dentaires.
 *
 *   cd backend
 *   DATABASE_URL="postgresql://..." npx tsx prisma/seed-dental.mts
 *
 * Idempotent : supprime et recrée l'établissement de slug `clinique-dentaire-demo`
 * (cascade sur employés / services / horaires / réservations de démo).
 */
import { readFileSync } from 'node:fs';
import { randomBytes, scryptSync } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

// L'URL est lue depuis l'environnement, ou à défaut depuis un fichier .env local
// (lecture interne au process : le secret ne transite par aucune ligne de commande).
function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  for (const file of ['.env.prod.local', '.env.local', '.env']) {
    try {
      const match = readFileSync(file, 'utf8').match(/^DATABASE_URL=(.*)$/m);
      if (match) return match[1].trim().replace(/^"|"$/g, '');
    } catch {
      /* fichier absent : on continue */
    }
  }
  throw new Error('DATABASE_URL introuvable (env ou .env.prod.local)');
}

const connectionString = resolveDatabaseUrl();

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Même format que auth.service : scrypt$16384$8$1$<salt>$<hash> (base64url).
function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

const SLUG = 'clinique-dentaire-demo';
const OWNER_EMAIL = 'demo-dentaire@booking.tn';
const OWNER_PASSWORD = 'DemoDentaire2026!';
const SECOND_EMAIL = 'youssef.dentaire@booking.tn';

const SERVICES = [
  {
    name: 'Contrôle dentaire',
    description: 'Examen de routine des dents et des gencives.',
    durationMinutes: 30,
    price: '40',
  },
  {
    name: 'Détartrage (nettoyage)',
    description: 'Nettoyage profond, élimination du tartre.',
    durationMinutes: 45,
    price: '60',
  },
  {
    name: 'Soin de carie (plombage)',
    description: 'Traitement des caries et dents abîmées.',
    durationMinutes: 45,
    price: '80',
  },
  {
    name: 'Traitement de canal',
    description: 'Thérapie pour dents infectées ou douloureuses.',
    durationMinutes: 90,
    price: '220',
  },
  {
    name: 'Implants / Prothèses',
    description: 'Remplacer les dents manquantes par un implant ou une prothèse.',
    durationMinutes: 60,
    price: '600',
  },
];

// Horaires encodés en heure UTC (le calcul de dispo lit getUTCHours()).
const timeUtc = (hour: number): Date => new Date(Date.UTC(1970, 0, 1, hour, 0, 0));
const WINDOWS: Array<[number, number]> = [
  [9, 13],
  [14, 18],
];

async function main(): Promise<void> {
  const existing = await prisma.establishment.findUnique({
    where: { slug: SLUG },
    select: { id: true },
  });
  if (existing) {
    await prisma.establishment.delete({ where: { id: existing.id } });
    console.log('• ancien établissement démo supprimé');
  }

  const owner = await prisma.user.upsert({
    where: { email: OWNER_EMAIL },
    update: { passwordHash: hashPassword(OWNER_PASSWORD) },
    create: {
      email: OWNER_EMAIL,
      passwordHash: hashPassword(OWNER_PASSWORD),
      preferredLocale: 'fr',
    },
    select: { id: true },
  });
  const second = await prisma.user.upsert({
    where: { email: SECOND_EMAIL },
    update: { passwordHash: hashPassword(OWNER_PASSWORD) },
    create: {
      email: SECOND_EMAIL,
      passwordHash: hashPassword(OWNER_PASSWORD),
      preferredLocale: 'fr',
    },
    select: { id: true },
  });

  const est = await prisma.establishment.create({
    data: {
      slug: SLUG,
      name: 'Smile Studio',
      description: 'Clinique dentaire — démo Booking+',
      address: 'Avenue Habib Bourguiba, Tunis',
      timezone: 'Africa/Tunis',
      currency: 'TND',
      locale: 'fr',
    },
    select: { id: true, slug: true },
  });

  const ownerMember = await prisma.establishmentMember.create({
    data: { establishmentId: est.id, userId: owner.id, role: 'OWNER' },
    select: { id: true },
  });
  const drSana = await prisma.employee.create({
    data: {
      establishmentId: est.id,
      memberId: ownerMember.id,
      displayName: 'Dr. Sana Khelil',
    },
    select: { id: true },
  });

  const secondMember = await prisma.establishmentMember.create({
    data: { establishmentId: est.id, userId: second.id, role: 'EMPLOYEE' },
    select: { id: true },
  });
  const drYoussef = await prisma.employee.create({
    data: {
      establishmentId: est.id,
      memberId: secondMember.id,
      displayName: 'Dr. Youssef Mbarek',
    },
    select: { id: true },
  });

  const employeeIds = [drSana.id, drYoussef.id];

  for (const service of SERVICES) {
    const created = await prisma.service.create({
      data: { establishmentId: est.id, ...service },
      select: { id: true },
    });
    await prisma.employeeService.createMany({
      data: employeeIds.map((employeeId) => ({
        employeeId,
        serviceId: created.id,
      })),
    });
  }

  const businessHours = [] as Array<{
    establishmentId: string;
    employeeId: null;
    dayOfWeek: number;
    opensAt: Date;
    closesAt: Date;
  }>;
  for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek += 1) {
    for (const [opens, closes] of WINDOWS) {
      businessHours.push({
        establishmentId: est.id,
        employeeId: null,
        dayOfWeek,
        opensAt: timeUtc(opens),
        closesAt: timeUtc(closes),
      });
    }
  }
  await prisma.businessHour.createMany({ data: businessHours });

  console.log('✓ établissement démo créé :', est.slug);
  console.log('  services :', SERVICES.length, '· praticiens : 2');
  console.log('  horaires : 7j/7, 09:00–13:00 & 14:00–18:00');
  console.log('  owner    :', OWNER_EMAIL, '/', OWNER_PASSWORD);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

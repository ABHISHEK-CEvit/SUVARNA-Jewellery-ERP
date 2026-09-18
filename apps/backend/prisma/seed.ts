import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial database state...');

  // 1. Create Default Users
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const staffPasswordHash = await bcrypt.hash('staff123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@jewellery.com' },
    update: {},
    create: {
      email: 'admin@jewellery.com',
      name: 'Shop Owner (Admin)',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@jewellery.com' },
    update: {},
    create: {
      email: 'staff@jewellery.com',
      name: 'Counter Cashier (Staff)',
      passwordHash: staffPasswordHash,
      role: 'STAFF',
      isActive: true,
    },
  });

  console.log(`Created users: Admin (${adminUser.email}), Staff (${staffUser.email})`);

  // 2. Create Default Business Settings
  await prisma.businessSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      shopName: 'Shree Gold & Silver Jewellers',
      tagline: 'Trusted Quality & Hallmark Jewellery',
      address: 'Main Bazaar Road, Shop No. 12',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      phone: '+91 98765 43210',
      email: 'contact@shreejewellers.com',
      gstin: '27AAAAA0000A1Z5',
      invoicePrefix: 'INV',
      defaultGstRate: 3.00,
      todayGold22kRate: 7250.00,
      todayGold24kRate: 7850.00,
      todaySilverRate: 92.00,
      termsConditions: '1. Goods once sold will be exchanged as per store policy. 2. Hallmark gold purity certified.',
    },
  });

  console.log('Created default business settings');

  // 3. Create Default Categories
  const categories = [
    { name: 'Ring', metalType: 'GOLD', defaultPurity: '916', defaultHsnCode: '7113', gstRate: 3.00 },
    { name: 'Earrings', metalType: 'GOLD', defaultPurity: '916', defaultHsnCode: '7113', gstRate: 3.00 },
    { name: 'Necklace', metalType: 'GOLD', defaultPurity: '916', defaultHsnCode: '7113', gstRate: 3.00 },
    { name: 'Chain', metalType: 'GOLD', defaultPurity: '916', defaultHsnCode: '7113', gstRate: 3.00 },
    { name: 'Bangle', metalType: 'GOLD', defaultPurity: '916', defaultHsnCode: '7113', gstRate: 3.00 },
    { name: 'Bracelet', metalType: 'GOLD', defaultPurity: '916', defaultHsnCode: '7113', gstRate: 3.00 },
    { name: 'Pendant', metalType: 'GOLD', defaultPurity: '916', defaultHsnCode: '7113', gstRate: 3.00 },
    { name: 'Nose Pin', metalType: 'GOLD', defaultPurity: '916', defaultHsnCode: '7113', gstRate: 3.00 },
    { name: 'Silver Payal / Anklet', metalType: 'SILVER', defaultPurity: '925', defaultHsnCode: '7113', gstRate: 3.00 },
    { name: 'Silver Coin / Bar', metalType: 'SILVER', defaultPurity: '999', defaultHsnCode: '7114', gstRate: 3.00 },
    { name: 'Other Jewellery', metalType: 'OTHER', defaultPurity: '916', defaultHsnCode: '7113', gstRate: 3.00 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log(`Seeded ${categories.length} jewellery categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

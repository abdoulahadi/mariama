// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Créer des utilisateurs de test
  const users = [
    {
      email: 'intern@company.com',
      password: await bcrypt.hash('password123', 10),
      role: 'INTERN',
      department: 'cybersecurity'
    },
    {
      email: 'analyst@company.com',
      password: await bcrypt.hash('password123', 10),
      role: 'SECURITY_ANALYST',
      department: 'cybersecurity'
    },
    {
      email: 'manager@company.com',
      password: await bcrypt.hash('password123', 10),
      role: 'SECURITY_MANAGER',
      department: 'cybersecurity'
    },
    {
      email: 'admin@company.com',
      password: await bcrypt.hash('password123', 10),
      role: 'DEPARTMENT_HEAD',
      department: 'cybersecurity'
    }
  ];

  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData
    });
    console.log(`✅ Created user: ${user.email}`);
  }

  // Créer des ressources de test
  const analyst = await prisma.user.findUnique({
    where: { email: 'analyst@company.com' }
  });

  const resources = [
    {
      name: 'Security Policy Document',
      ownerId: analyst.id,
      sensitivityLevel: 'CONFIDENTIAL',
      dataType: 'DOCUMENT'
    },
    {
      name: 'API Keys Configuration',
      ownerId: analyst.id,
      sensitivityLevel: 'SECRET',
      dataType: 'CREDENTIALS'
    },
    {
      name: 'Firewall Rules',
      ownerId: analyst.id,
      sensitivityLevel: 'INTERNAL',
      dataType: 'CONFIGURATION'
    }
  ];

  for (const resourceData of resources) {
    const resource = await prisma.resource.create({
      data: resourceData
    });
    console.log(`✅ Created resource: ${resource.name}`);
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

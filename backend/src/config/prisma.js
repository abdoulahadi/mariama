// src/config/prisma.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Logs SQL (optionnel)
});

// Gestion propre de la déconnexion
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;

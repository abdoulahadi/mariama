// scripts/syncUsersToPermit.js
// Script pour synchroniser tous les utilisateurs SQLite vers Permit.io

require('dotenv').config();
const permitService = require('../src/services/permitService');

async function main() {
  console.log('========================================');
  console.log('🔄 Synchronisation des utilisateurs vers Permit.io');
  console.log('========================================\n');

  await permitService.syncAllUsers();

  console.log('\n========================================');
  console.log('✅ Terminé ! Vérifie sur https://app.permit.io');
  console.log('   → Directory → Users');
  console.log('========================================');

  process.exit(0);
}

main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});

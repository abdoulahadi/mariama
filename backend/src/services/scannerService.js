// src/services/scannerService.js
const prisma = require('../config/prisma');

class ScannerService {

  constructor(io) {
    this.io = io;
  }

  // Simuler un scan de vulnérabilités
  async runScan() {
    try {
      // Simuler des résultats aléatoires
      const scanResult = {
        targetSystem: 'Production Server',
        critical: Math.floor(Math.random() * 5),
        high: Math.floor(Math.random() * 10),
        medium: Math.floor(Math.random() * 20),
        low: Math.floor(Math.random() * 30),
      };

      // Enregistrer dans SQLite
      const scan = await prisma.vulnerabilityScan.create({
        data: scanResult
      });

      // Émettre via WebSocket pour le dashboard
      if (this.io) {
        this.io.to('dashboard-room').emit('vulnerability-update', {
          ...scan,
          timestamp: scan.scanDate.toISOString()
        });
      }

      console.log('✅ Scan de vulnérabilités effectué:', scan.id);
      return scan;

    } catch (error) {
      console.error('❌ Erreur scan:', error);
    }
  }

  // Lancer des scans périodiques
  startPeriodicScans(intervalMinutes = 5) {
    console.log(`🔄 Scans périodiques démarrés (toutes les ${intervalMinutes} min)`);

    // Premier scan immédiat
    this.runScan();

    // Puis scans périodiques
    setInterval(() => {
      this.runScan();
    }, intervalMinutes * 60 * 1000);
  }

  // Récupérer les derniers scans
  async getRecentScans(limit = 20) {
    return await prisma.vulnerabilityScan.findMany({
      take: limit,
      orderBy: { scanDate: 'desc' }
    });
  }

}

module.exports = ScannerService;

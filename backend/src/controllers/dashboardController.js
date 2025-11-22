// src/controllers/dashboardController.js
const prisma = require('../config/prisma');
const auditService = require('../services/auditService');

exports.getStats = async (req, res) => {
  try {
    // Vérifier que user peut accéder au dashboard
    if (!['SECURITY_MANAGER', 'DEPARTMENT_HEAD'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé au dashboard' });
    }

    // Stats utilisateurs
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { isActive: true }
    });

    // Stats ressources
    const totalResources = await prisma.resource.count();
    const resourcesByType = await prisma.resource.groupBy({
      by: ['dataType'],
      _count: true
    });

    // Stats accès (dernières 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const accessLogs = await prisma.auditLog.count({
      where: {
        timestamp: { gte: yesterday }
      }
    });

    const deniedAccess = await prisma.auditLog.count({
      where: {
        timestamp: { gte: yesterday },
        allowed: false
      }
    });

    // Derniers scans de vulnérabilités
    const recentScans = await prisma.vulnerabilityScan.findMany({
      take: 20,
      orderBy: { scanDate: 'desc' }
    });

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers
      },
      resources: {
        total: totalResources,
        byType: resourcesByType
      },
      access: {
        last24h: accessLogs,
        denied: deniedAccess
      },
      vulnerabilities: recentScans
    });

  } catch (error) {
    console.error('Erreur stats dashboard:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const result = await auditService.getAuditLogs({ page, limit });

    res.json(result);

  } catch (error) {
    console.error('Erreur audit logs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// src/services/auditService.js
const prisma = require('../config/prisma');

class AuditService {

  // Récupérer les logs d'audit avec pagination
  async getAuditLogs(options = {}) {
    const {
      page = 1,
      limit = 50,
      userId = null,
      resourceId = null,
      action = null,
      allowed = null
    } = options;

    const where = {};
    if (userId) where.userId = userId;
    if (resourceId) where.resourceId = resourceId;
    if (action) where.action = action;
    if (allowed !== null) where.allowed = allowed;

    const logs = await prisma.auditLog.findMany({
      where,
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        },
        resource: {
          select: {
            name: true,
            sensitivityLevel: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    const total = await prisma.auditLog.count({ where });

    return {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  // Récupérer les statistiques d'accès
  async getAccessStats(days = 7) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const totalAccess = await prisma.auditLog.count({
      where: {
        timestamp: { gte: startDate }
      }
    });

    const deniedAccess = await prisma.auditLog.count({
      where: {
        timestamp: { gte: startDate },
        allowed: false
      }
    });

    const accessByAction = await prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        timestamp: { gte: startDate }
      },
      _count: true
    });

    return {
      total: totalAccess,
      denied: deniedAccess,
      allowed: totalAccess - deniedAccess,
      byAction: accessByAction
    };
  }

}

module.exports = new AuditService();

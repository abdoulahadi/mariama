// src/middleware/permitCheck.js
const permitService = require('../services/permitService');
const prisma = require('../config/prisma');

const checkPermission = (action) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;

      // Récupérer la ressource depuis SQLite
      const resource = await prisma.resource.findUnique({
        where: { id: resourceId },
        include: {
          owner: true
        }
      });

      if (!resource) {
        return res.status(404).json({ error: 'Ressource introuvable' });
      }

      // Cas spécial: suppression requiert propriétaire OU department_head
      if (action === 'delete') {
        const isOwner = resource.ownerId === req.user.id;
        const isDeptHead = req.user.role === 'DEPARTMENT_HEAD';

        if (!isOwner && !isDeptHead) {
          await permitService.logAccess(
            req.user.id,
            action,
            resource.id,
            false,
            req.ip,
            req.headers['x-device-id']
          );

          return res.status(403).json({
            error: 'Seul le propriétaire ou le Department Head peut supprimer'
          });
        }
      }

      // Vérifier via Permit.io
      const context = {
        ip_address: req.ip || req.socket.remoteAddress
      };

      const allowed = await permitService.checkPermission(
        req.user.id,
        action,
        resource,
        context
      );

      if (!allowed) {
        return res.status(403).json({ error: 'Permission refusée par la politique ABAC' });
      }

      // Attacher la ressource à la requête pour utilisation dans le controller
      req.resource = resource;
      next();

    } catch (error) {
      console.error('Erreur vérification permission:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  };
};

module.exports = checkPermission;

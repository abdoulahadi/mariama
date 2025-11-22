// src/services/permitService.js
const permit = require('../config/permit.config');
const prisma = require('../config/prisma');

class PermitService {

  constructor() {
    this.io = null;
    this.permissionCache = new Map();
    this.cacheTimeout = 2000; // 2 secondes
  }

  // Initialiser avec Socket.io pour notifications temps réel
  setSocketIo(io) {
    this.io = io;
  }

  // Synchroniser un user avec Permit Cloud ET assigner son rôle
  async syncUser(user) {
    try {
      await permit.api.users.sync({
        key: user.email,
        email: user.email,
        first_name: user.email.split('@')[0],
        attributes: {
          department: user.department
        }
      });
      console.log(`✅ User ${user.email} créé/mis à jour dans Permit`);

      try {
        await permit.api.users.assignRole({
          user: user.email,
          role: user.role,
          tenant: 'default'
        });
        console.log(`✅ Rôle ${user.role} assigné à ${user.email}`);
      } catch (roleError) {
        if (!roleError.message.includes('already assigned')) {
          console.error('⚠️ Erreur assignation rôle:', roleError.message);
        }
      }

      // Invalider le cache et notifier
      this.invalidateUserCache(user.id);

    } catch (error) {
      console.error('❌ Erreur sync Permit:', error.message);
      if (error.response) {
        console.error('Détails:', error.response.data);
      }
    }
  }

  // Vérifier une permission avec cache
  async checkPermission(userId, action, resource, context = {}) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        console.error('❌ Utilisateur non trouvé pour permission check');
        return false;
      }

      // Vérifier le cache (seulement si pas de contexte dynamique critique comme l'heure/IP)
      // Si on utilise des conditions contextuelles, le cache simple peut être problématique
      // Pour l'instant on garde le cache mais on pourrait l'améliorer avec le contexte
      const cacheKey = `${userId}-${action}`;
      const cached = this.permissionCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        // return cached.allowed; // Désactivé pour garantir la vérification contextuelle
      }

      // Préparer le contexte pour Permit
      // On fusionne le contexte passé (IP, heure) avec d'autres infos si besoin
      const checkContext = {
        ...context,
        // Assurer que les attributs de temps sont présents s'ils ne sont pas passés
        current_hour: context.current_hour ?? new Date().getHours(),
        current_day: context.current_day ?? new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      };

      // Vérification via Permit
      const allowed = await permit.check(
        user.email,
        action,
        'resource',
        checkContext
      );

      // Mettre en cache
      this.permissionCache.set(cacheKey, {
        allowed,
        timestamp: Date.now()
      });

      // Log audit
      if (resource?.id) {
        await this.logAccess(userId, action, resource.id, allowed);
      }

      console.log(`🔐 Permission check: ${user.email} -> ${action} -> ${allowed ? '✅ ALLOWED' : '❌ DENIED'}`);

      return allowed;

    } catch (error) {
      console.error('❌ Erreur check Permit:', error.message);
      return await this.fallbackPermissionCheck(userId, action);
    }
  }

  // Récupérer toutes les permissions d'un utilisateur depuis Permit.io
  // Accepte soit un userId (string) soit un objet user complet
  async getUserPermissions(userOrId) {
    try {
      let user = userOrId;

      // Si c'est un ID, récupérer le user
      if (typeof userOrId === 'string') {
        user = await prisma.user.findUnique({
          where: { id: userOrId }
        });
      }

      if (!user || !user.email) {
        console.log('getUserPermissions: user invalide');
        return { read: false, write: false, delete: false };
      }

      // Vérifier chaque permission directement via Permit.io (sans cache)
      const [canRead, canWrite, canDelete] = await Promise.all([
        this.checkPermitDirect(user.email, 'read'),
        this.checkPermitDirect(user.email, 'write'),
        this.checkPermitDirect(user.email, 'delete')
      ]);

      console.log(`Permit.io permissions for ${user.email}: read=${canRead}, write=${canWrite}, delete=${canDelete}`);
      return { read: canRead, write: canWrite, delete: canDelete };
    } catch (error) {
      console.error('Erreur getUserPermissions:', error.message);
      return { read: false, write: false, delete: false };
    }
  }

  // Check direct Permit.io sans cache ni fallback
  async checkPermitDirect(email, action) {
    try {
      console.log(`[Permit.io] Checking: user=${email}, action=${action}, resource=resource`);
      const result = await permit.check(email, action, 'resource');
      console.log(`[Permit.io] Result for ${email}/${action}: ${result}`);
      return result === true;
    } catch (error) {
      console.error(`[Permit.io] Error for ${email}/${action}:`, error.message);
      console.error(`[Permit.io] Full error:`, error);
      return false;
    }
  }

  // Obtenir les permissions basées sur le rôle (fallback fiable)
  getPermissionsByRole(role) {
    const rolePermissions = {
      'INTERN': { read: true, write: false, delete: false },
      'SECURITY_ANALYST': { read: true, write: true, delete: false },
      'SECURITY_MANAGER': { read: true, write: true, delete: false },
      'DEPARTMENT_HEAD': { read: true, write: true, delete: true }
    };
    return rolePermissions[role] || { read: true, write: false, delete: false };
  }

  // Check direct via Permit.io
  async checkPermissionDirect(email, action) {
    try {
      const result = await permit.check(email, action, 'resource');
      console.log(`🔐 Permit.io check: ${email} -> ${action} -> ${result}`);
      return result;
    } catch (error) {
      console.error(`⚠️ Permit.io check failed for ${email}/${action}:`, error.message);
      return null; // null = erreur, utiliser fallback
    }
  }

  // Fallback pour récupérer les permissions basées sur le rôle
  async fallbackGetPermissions(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) return { read: false, write: false, delete: false };

      const rolePermissions = {
        'INTERN': { read: true, write: false, delete: false },
        'SECURITY_ANALYST': { read: true, write: true, delete: false },
        'SECURITY_MANAGER': { read: true, write: true, delete: false },
        'DEPARTMENT_HEAD': { read: true, write: true, delete: true }
      };

      return rolePermissions[user.role] || { read: false, write: false, delete: false };
    } catch (error) {
      return { read: false, write: false, delete: false };
    }
  }

  // Fallback: vérification basée sur le rôle local
  async fallbackPermissionCheck(userId, action) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) return false;

      const permissions = {
        'INTERN': ['read'],
        'SECURITY_ANALYST': ['read', 'write'],
        'SECURITY_MANAGER': ['read', 'write'],
        'DEPARTMENT_HEAD': ['read', 'write', 'delete']
      };

      const userPermissions = permissions[user.role] || [];
      const allowed = userPermissions.includes(action);

      console.log(`🔐 Fallback permission: ${user.email} (${user.role}) -> ${action} -> ${allowed ? '✅' : '❌'}`);

      return allowed;
    } catch (error) {
      console.error('❌ Erreur fallback permission:', error.message);
      return false;
    }
  }

  // Invalider le cache d'un utilisateur
  invalidateUserCache(userId) {
    for (const key of this.permissionCache.keys()) {
      if (key.startsWith(`${userId}-`)) {
        this.permissionCache.delete(key);
      }
    }
  }

  // Notifier un changement de permission via WebSocket
  notifyPermissionChange(userId, newPermissions) {
    if (this.io) {
      this.io.to(`user-${userId}`).emit('permission-update', {
        permissions: newPermissions,
        timestamp: new Date().toISOString()
      });
      console.log(`📢 Notification permission envoyée à user-${userId}`);
    }
  }

  // Rafraîchir et notifier les permissions d'un utilisateur
  async refreshAndNotifyPermissions(userId) {
    this.invalidateUserCache(userId);
    const newPermissions = await this.getUserPermissions(userId);
    this.notifyPermissionChange(userId, newPermissions);
    return newPermissions;
  }

  // Logger l'accès dans SQLite
  async logAccess(userId, action, resourceId, allowed, ipAddress = null, deviceId = null) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          resourceId,
          allowed,
          ipAddress,
          deviceId,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('❌ Erreur log audit:', error.message);
    }
  }

  // Synchroniser TOUS les utilisateurs existants vers Permit
  async syncAllUsers() {
    try {
      const users = await prisma.user.findMany();
      console.log(`🔄 Synchronisation de ${users.length} utilisateurs vers Permit...`);

      for (const user of users) {
        await this.syncUser(user);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`✅ Synchronisation terminée !`);
    } catch (error) {
      console.error('❌ Erreur sync all users:', error.message);
    }
  }

}

module.exports = new PermitService();

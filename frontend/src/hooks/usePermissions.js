// src/hooks/usePermissions.js
import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const canAccessDashboard = () => {
    return hasRole(['SECURITY_MANAGER', 'DEPARTMENT_HEAD']);
  };

  const canManageUsers = () => {
    return hasRole('DEPARTMENT_HEAD');
  };

  const canDeleteResource = (resource) => {
    if (!user || !resource) return false;
    return resource.ownerId === user.id || hasRole('DEPARTMENT_HEAD');
  };

  const canEditResource = (resource) => {
    if (!user || !resource) return false;
    return resource.ownerId === user.id || hasRole(['SECURITY_MANAGER', 'DEPARTMENT_HEAD']);
  };

  return {
    hasRole,
    canAccessDashboard,
    canManageUsers,
    canDeleteResource,
    canEditResource
  };
};

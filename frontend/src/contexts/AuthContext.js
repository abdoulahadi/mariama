// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../services/api';
import { connectSocket, getSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [permissions, setPermissions] = useState({ read: false, write: false, delete: false });
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  // Récupérer les permissions depuis Permit.io via le backend
  const fetchPermissions = useCallback(async () => {
    if (!token) return;
    try {
      const response = await authAPI.getPermissions();
      if (response.data.permissions) {
        setPermissions(response.data.permissions);
      }
    } catch (error) {
      console.error('Erreur récupération permissions:', error);
    }
  }, [token]);

  // Polling 2s + WebSocket pour les mises à jour
  useEffect(() => {
    if (token && user) {
      // Connecter au WebSocket
      connectSocket(token);
      const socket = getSocket();

      if (socket) {
        // Rejoindre la room personnelle
        socket.emit('join-user-room', { id: user.id, email: user.email });

        // Écouter les mises à jour de permissions (depuis webhook Permit.io en prod)
        socket.on('permission-update', (data) => {
          console.log('Permissions mises à jour via WebSocket:', data);
          setPermissions(data.permissions);
        });
      }

      // Récupérer immédiatement
      fetchPermissions();

      // Polling toutes les 2 secondes (pour localhost sans webhook)
      intervalRef.current = setInterval(fetchPermissions, 2000);

      return () => {
        if (socket) {
          socket.off('permission-update');
        }
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [token, user, fetchPermissions]);

  useEffect(() => {
    // Récupérer le token et user du localStorage au démarrage
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setToken(savedToken);
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token: newToken, user: newUser, permissions: newPermissions } = response.data;

      setToken(newToken);
      setUser(newUser);
      if (newPermissions) {
        setPermissions(newPermissions);
      }
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur de connexion'
      };
    }
  };

  // Register est maintenant admin-only, appelé depuis la page Users
  const createUser = async (email, password, role, department) => {
    try {
      const response = await authAPI.register({ email, password, role, department });
      return { success: true, user: response.data.user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur de création'
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setPermissions({ read: false, write: false, delete: false });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
  };

  // Rafraîchir les permissions manuellement
  const refreshPermissions = async () => {
    try {
      const response = await authAPI.refreshPermissions();
      setPermissions(response.data.permissions);
      return response.data.permissions;
    } catch (error) {
      console.error('Erreur refresh permissions:', error);
      return permissions;
    }
  };

  const value = {
    user,
    token,
    permissions,
    login,
    createUser,
    logout,
    refreshPermissions,
    fetchPermissions,
    isAuthenticated: !!token,
    loading,
    // Helpers pour vérifier les permissions
    canRead: permissions?.read || false,
    canWrite: permissions?.write || false,
    canDelete: permissions?.delete || false
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

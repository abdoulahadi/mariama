// src/components/Layout/Sidebar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';

const Sidebar = () => {
  const { user } = useAuth();
  const { canAccessDashboard, canManageUsers } = usePermissions();
  const location = useLocation();

  const menuItems = [
    {
      path: '/dashboard',
      icon: '📊',
      label: 'Dashboard',
      show: true
    },
    {
      path: '/resources',
      icon: '📁',
      label: 'Ressources',
      show: true
    },
    {
      path: '/users',
      icon: '👥',
      label: 'Utilisateurs',
      show: canManageUsers()
    }
  ];

  return (
    <aside style={{
      width: '250px',
      background: '#2c3e50',
      color: 'white',
      minHeight: 'calc(100vh - 60px)',
      padding: '20px 0',
      position: 'fixed',
      left: 0,
      top: '60px'
    }}>
      <div style={{ padding: '0 20px', marginBottom: '30px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '15px',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '5px' }}>
            Connecté en tant que
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
            {user?.email}
          </div>
          <div style={{
            marginTop: '8px',
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '4px',
            fontSize: '12px',
            display: 'inline-block'
          }}>
            {user?.role}
          </div>
        </div>
      </div>

      <nav>
        {menuItems.map((item) => item.show && (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '15px 20px',
              color: 'white',
              textDecoration: 'none',
              background: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
              borderLeft: location.pathname === item.path ? '4px solid #3498db' : '4px solid transparent',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== item.path) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== item.path) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '24px', marginRight: '15px' }}>
              {item.icon}
            </span>
            <span style={{ fontSize: '16px' }}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        right: '20px',
        padding: '15px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '8px',
        fontSize: '12px',
        opacity: 0.7
      }}>
        <div>Security System v1.0</div>
        <div style={{ marginTop: '5px' }}>
          Powered by Permit.io
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

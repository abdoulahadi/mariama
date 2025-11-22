// src/components/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 style={{ marginRight: '30px' }}>Security System</h2>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/resources">Ressources</Link>
        {['SECURITY_MANAGER', 'DEPARTMENT_HEAD'].includes(user?.role) && (
          <Link to="/users">Utilisateurs</Link>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span>
          {user?.email} ({user?.role})
        </span>
        <button className="btn btn-danger" onClick={handleLogout}>
          Déconnexion
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

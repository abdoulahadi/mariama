// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { connectSocket, disconnectSocket } from '../services/socket';
import { usePermissions } from '../hooks/usePermissions';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import MetricsCards from '../components/Dashboard/MetricsCards';
import VulnerabilityChart from '../components/Dashboard/VulnerabilityChart';
import AccessLogsTable from '../components/Dashboard/AccessLogsTable';
import RealTimeStats from '../components/Dashboard/RealTimeStats';

const Dashboard = () => {
  const { user } = useAuth();
  const { canAccessDashboard } = usePermissions();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();

    // WebSocket pour mises à jour temps réel (seulement pour managers et admins)
    if (canAccessDashboard()) {
      connectSocket({ email: user.email, role: user.role });

      return () => disconnectSocket();
    }
  }, [user, canAccessDashboard]);

  const loadStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de chargement');
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Chargement du dashboard..." />;

  if (error) {
    return (
      <div className="container">
        <div className="card" style={{ background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' }}>
          <h3>❌ Erreur</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadStats}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!canAccessDashboard()) {
    return (
      <div className="container">
        <div className="card">
          <h2>👋 Bienvenue {user?.email}</h2>
          <div style={{ margin: '20px 0' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>Rôle:</span>
            <span className={`badge ${
              user?.role === 'DEPARTMENT_HEAD' ? 'badge-danger' :
              user?.role === 'SECURITY_MANAGER' ? 'badge-warning' :
              user?.role === 'SECURITY_ANALYST' ? 'badge-info' :
              'badge-secondary'
            }`} style={{ marginLeft: '10px' }}>
              {user?.role}
            </span>
          </div>
          <p><strong>Département:</strong> {user?.department}</p>

          <div style={{
            marginTop: '30px',
            padding: '20px',
            background: '#fff3cd',
            borderRadius: '8px',
            borderLeft: '4px solid #ffc107'
          }}>
            <h3 style={{ marginTop: 0 }}>ℹ️ Accès limité</h3>
            <p>Vous n'avez pas accès au dashboard complet.</p>
            <p>Le dashboard est réservé aux Security Managers et Department Heads.</p>
            <p style={{ marginBottom: 0 }}>
              Vous pouvez consulter vos ressources via le menu <strong>"Ressources"</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1400px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0' }}>🛡️ Dashboard Sécurité</h1>
        <p style={{ color: '#666', margin: 0 }}>
          Monitoring en temps réel du système de sécurité
        </p>
      </div>

      {/* Statistiques temps réel */}
      <RealTimeStats />

      {/* Cartes métriques */}
      <MetricsCards stats={stats} />

      {/* Graphique des vulnérabilités */}
      <VulnerabilityChart initialData={stats?.vulnerabilities || []} />

      {/* Tableau des ressources par type */}
      <div className="card">
        <h3>📦 Ressources par Type</h3>
        {stats?.resources?.byType && stats.resources.byType.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
            {stats.resources.byType.map((item) => (
              <div key={item.dataType} style={{
                padding: '20px',
                background: '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #e0e0e0'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>
                  {item.dataType === 'DOCUMENT' ? '📄' :
                   item.dataType === 'CODE' ? '💻' :
                   item.dataType === 'CONFIGURATION' ? '⚙️' :
                   item.dataType === 'CREDENTIALS' ? '🔑' : '📁'}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff', marginBottom: '5px' }}>
                  {item._count}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {item.dataType}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Aucune ressource disponible
          </div>
        )}
      </div>

      {/* Tableau des logs d'audit */}
      <AccessLogsTable />
    </div>
  );
};

export default Dashboard;

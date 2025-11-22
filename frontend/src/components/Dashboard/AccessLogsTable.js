// src/components/Dashboard/AccessLogsTable.js
import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';

const AccessLogsTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getAuditLogs({ page, limit: 10 });
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erreur chargement logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h3>📝 Logs d'Audit Récents</h3>
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>📝 Logs d'Audit Récents</h3>

      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Horodatage</th>
              <th>Utilisateur</th>
              <th>Action</th>
              <th>Ressource</th>
              <th>Résultat</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td style={{ fontSize: '13px' }}>
                  {new Date(log.timestamp).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td>
                  <div>{log.user?.email}</div>
                  <div>
                    <span className={`badge ${
                      log.user?.role === 'DEPARTMENT_HEAD' ? 'badge-danger' :
                      log.user?.role === 'SECURITY_MANAGER' ? 'badge-warning' :
                      log.user?.role === 'SECURITY_ANALYST' ? 'badge-info' :
                      'badge-secondary'
                    }`} style={{ fontSize: '10px' }}>
                      {log.user?.role}
                    </span>
                  </div>
                </td>
                <td>
                  <span className="badge badge-info">{log.action}</span>
                </td>
                <td>
                  {log.resource ? (
                    <div>
                      <div style={{ fontSize: '13px' }}>{log.resource.name}</div>
                      <span className={`badge ${
                        log.resource.sensitivityLevel === 'SECRET' ? 'badge-danger' :
                        log.resource.sensitivityLevel === 'CONFIDENTIAL' ? 'badge-warning' :
                        'badge-secondary'
                      }`} style={{ fontSize: '10px' }}>
                        {log.resource.sensitivityLevel}
                      </span>
                    </div>
                  ) : (
                    <span style={{ color: '#999', fontSize: '13px' }}>N/A</span>
                  )}
                </td>
                <td>
                  <span className={`badge ${log.allowed ? 'badge-success' : 'badge-danger'}`}>
                    {log.allowed ? '✓ Autorisé' : '✗ Refusé'}
                  </span>
                </td>
                <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                  {log.ipAddress || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Aucun log disponible
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          marginTop: '20px'
        }}>
          <button
            className="btn btn-primary"
            style={{ padding: '5px 15px' }}
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            ← Précédent
          </button>

          <span style={{ color: '#666' }}>
            Page {pagination.page} sur {pagination.pages}
          </span>

          <button
            className="btn btn-primary"
            style={{ padding: '5px 15px' }}
            disabled={page === pagination.pages}
            onClick={() => setPage(page + 1)}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
};

export default AccessLogsTable;

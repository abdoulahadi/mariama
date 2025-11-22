// src/components/Dashboard/RealTimeStats.js
import React, { useState, useEffect } from 'react';
import { useRealtime } from '../../hooks/useRealtime';

const RealTimeStats = () => {
  const { data: vulnUpdate } = useRealtime('vulnerability-update');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [totalVulnerabilities, setTotalVulnerabilities] = useState(0);

  useEffect(() => {
    if (vulnUpdate) {
      setLastUpdate(new Date());
      const total = (vulnUpdate.critical || 0) +
                   (vulnUpdate.high || 0) +
                   (vulnUpdate.medium || 0) +
                   (vulnUpdate.low || 0);
      setTotalVulnerabilities(total);
    }
  }, [vulnUpdate]);

  if (!vulnUpdate) {
    return null;
  }

  return (
    <div className="card" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 10px 0', color: 'white' }}>
            🔴 Mise à jour en temps réel
          </h3>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
            Dernier scan: {lastUpdate?.toLocaleTimeString('fr-FR')}
          </p>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.2)',
          padding: '15px 25px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {totalVulnerabilities}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            Vulnérabilités totales
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '15px',
        marginTop: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          padding: '10px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {vulnUpdate.critical}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>Critique</div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          padding: '10px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {vulnUpdate.high}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>Élevé</div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          padding: '10px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {vulnUpdate.medium}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>Moyen</div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          padding: '10px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {vulnUpdate.low}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>Faible</div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeStats;

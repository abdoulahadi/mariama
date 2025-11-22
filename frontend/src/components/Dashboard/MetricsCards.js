// src/components/Dashboard/MetricsCards.js
import React from 'react';

const MetricsCards = ({ stats }) => {
  if (!stats) return null;

  const cards = [
    {
      title: 'Utilisateurs',
      value: stats.users?.total || 0,
      subtitle: `${stats.users?.active || 0} actifs`,
      color: '#007bff',
      icon: '👥'
    },
    {
      title: 'Ressources',
      value: stats.resources?.total || 0,
      subtitle: 'Total',
      color: '#28a745',
      icon: '📁'
    },
    {
      title: 'Accès (24h)',
      value: stats.access?.last24h || 0,
      subtitle: `${stats.access?.denied || 0} refusés`,
      color: '#17a2b8',
      icon: '🔐'
    },
    {
      title: 'Vulnérabilités',
      value: stats.vulnerabilities?.length || 0,
      subtitle: 'Scans effectués',
      color: '#ffc107',
      icon: '🔍'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    }}>
      {cards.map((card, index) => (
        <div key={index} className="card" style={{
          textAlign: 'center',
          background: 'white',
          borderLeft: `4px solid ${card.color}`,
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>{card.icon}</div>
          <h3 style={{ margin: '10px 0', color: '#333', fontSize: '16px' }}>{card.title}</h3>
          <div style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: card.color,
            margin: '10px 0'
          }}>
            {card.value}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>{card.subtitle}</div>
        </div>
      ))}
    </div>
  );
};

export default MetricsCards;

// src/components/Common/ConfirmDialog.js
import React from 'react';
import Modal from './Modal';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmer',
  message = 'Êtes-vous sûr ?',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'danger' // 'danger', 'warning', 'info'
}) => {
  const colors = {
    danger: { bg: '#dc3545', hover: '#c82333' },
    warning: { bg: '#ffc107', hover: '#e0a800' },
    info: { bg: '#007bff', hover: '#0056b3' }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '20px',
          color: colors[type].bg
        }}>
          {type === 'danger' ? '🗑️' : type === 'warning' ? '⚠️' : 'ℹ️'}
        </div>

        <p style={{
          fontSize: '16px',
          color: '#555',
          marginBottom: '30px',
          lineHeight: '1.5'
        }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 30px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              background: 'white',
              color: '#555',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
            }}
          >
            {cancelText}
          </button>

          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              padding: '12px 30px',
              border: 'none',
              borderRadius: '8px',
              background: colors[type].bg,
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = colors[type].hover;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = colors[type].bg;
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;

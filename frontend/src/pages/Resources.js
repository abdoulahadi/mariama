// src/pages/Resources.js
import React, { useState, useEffect } from 'react';
import { resourcesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Common/Toast';
import Modal from '../components/Common/Modal';
import ConfirmDialog from '../components/Common/ConfirmDialog';

const Resources = () => {
  const { user, canRead, canWrite, canDelete } = useAuth();
  const toast = useToast();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sensitivityLevel: 'INTERNAL',
    dataType: 'DOCUMENT'
  });

  // Construire la liste des permissions pour l'affichage
  const userPermissions = [];
  if (canRead) userPermissions.push('read');
  if (canWrite) userPermissions.push('write');
  if (canDelete) userPermissions.push('delete');

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const response = await resourcesAPI.list();
      setResources(response.data.resources);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur de chargement des ressources');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      toast.error('Vous n\'avez pas la permission de créer des ressources');
      return;
    }

    try {
      await resourcesAPI.create(formData);
      toast.success('Ressource créée avec succès');
      setShowCreateModal(false);
      setFormData({ name: '', sensitivityLevel: 'INTERNAL', dataType: 'DOCUMENT' });
      loadResources();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la création');
    }
  };

  const handleEditResource = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      toast.error('Vous n\'avez pas la permission de modifier des ressources');
      return;
    }

    try {
      await resourcesAPI.update(selectedResource.id, formData);
      toast.success('Ressource modifiée avec succès');
      setShowEditModal(false);
      setSelectedResource(null);
      loadResources();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la modification');
    }
  };

  const handleDeleteResource = async () => {
    if (!canDelete && selectedResource?.ownerId !== user.id) {
      toast.error('Vous n\'avez pas la permission de supprimer cette ressource');
      return;
    }

    try {
      await resourcesAPI.delete(selectedResource.id);
      toast.success('Ressource supprimée avec succès');
      setShowDeleteDialog(false);
      setSelectedResource(null);
      loadResources();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const openEditModal = (resource) => {
    setSelectedResource(resource);
    setFormData({
      name: resource.name,
      sensitivityLevel: resource.sensitivityLevel,
      dataType: resource.dataType
    });
    setShowEditModal(true);
  };

  const openDeleteDialog = (resource) => {
    setSelectedResource(resource);
    setShowDeleteDialog(true);
  };

  const getSensitivityColor = (level) => {
    const colors = {
      'PUBLIC': { bg: '#d4edda', text: '#155724', border: '#c3e6cb' },
      'INTERNAL': { bg: '#cce5ff', text: '#004085', border: '#b8daff' },
      'CONFIDENTIAL': { bg: '#fff3cd', text: '#856404', border: '#ffeeba' },
      'SECRET': { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' }
    };
    return colors[level] || colors['INTERNAL'];
  };

  const getDataTypeIcon = (type) => {
    const icons = {
      'DOCUMENT': '📄',
      'CODE': '💻',
      'CONFIGURATION': '⚙️',
      'CREDENTIALS': '🔐'
    };
    return icons[type] || '📁';
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '60vh'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', color: '#1a1a2e', fontSize: '28px' }}>
            Ressources
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            Gérez vos ressources et documents sécurisés
          </p>
        </div>

        {/* Permissions Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 15px',
            background: '#f8f9fa',
            borderRadius: '8px',
            fontSize: '12px'
          }}>
            <span style={{ color: '#666' }}>Vos permissions:</span>
            {userPermissions.length > 0 ? userPermissions.map(perm => (
              <span key={perm} style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: '600',
                background: perm === 'read' ? '#e3f2fd' :
                           perm === 'write' ? '#e8f5e9' : '#ffebee',
                color: perm === 'read' ? '#1565c0' :
                       perm === 'write' ? '#2e7d32' : '#c62828'
              }}>
                {perm}
              </span>
            )) : <span style={{ color: '#999' }}>Lecture seule</span>}
          </div>

          {canWrite && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '18px' }}>+</span>
              Nouvelle ressource
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'SECRET'].map(level => {
          const count = resources.filter(r => r.sensitivityLevel === level).length;
          const colors = getSensitivityColor(level);
          return (
            <div key={level} style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderLeft: `4px solid ${colors.text}`
            }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                {level}
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: colors.text }}>
                {count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resources Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {resources.map(resource => {
          const colors = getSensitivityColor(resource.sensitivityLevel);
          const isOwner = resource.ownerId === user.id;
          const canEditThis = canWrite && (isOwner || user.role === 'DEPARTMENT_HEAD');
          const canDeleteThis = canDelete || isOwner;

          return (
            <div key={resource.id} style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            }}>
              {/* Card Header */}
              <div style={{
                padding: '15px 20px',
                background: colors.bg,
                borderBottom: `2px solid ${colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: colors.text,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {resource.sensitivityLevel}
                </span>
                <span style={{ fontSize: '24px' }}>
                  {getDataTypeIcon(resource.dataType)}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '20px' }}>
                <h3 style={{
                  margin: '0 0 10px 0',
                  fontSize: '18px',
                  color: '#1a1a2e'
                }}>
                  {resource.name}
                </h3>

                <div style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Type:</strong> {resource.dataType}
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Propriétaire:</strong> {resource.owner?.email || 'N/A'}
                  </div>
                  <div>
                    <strong>Créée:</strong> {new Date(resource.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                {/* Owner Badge */}
                {isOwner && (
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    background: '#e8f5e9',
                    color: '#2e7d32',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    marginBottom: '15px'
                  }}>
                    ✓ Vous êtes le propriétaire
                  </div>
                )}

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  paddingTop: '15px',
                  borderTop: '1px solid #eee'
                }}>
                  <button
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      background: 'white',
                      color: '#555',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'white';
                    }}
                    onClick={() => toast.info(`Lecture de "${resource.name}"`)}
                  >
                    👁️ Voir
                  </button>

                  {canEditThis && (
                    <button
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: 'none',
                        borderRadius: '6px',
                        background: '#e3f2fd',
                        color: '#1565c0',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#bbdefb';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#e3f2fd';
                      }}
                      onClick={() => openEditModal(resource)}
                    >
                      ✏️ Modifier
                    </button>
                  )}

                  {canDeleteThis && (
                    <button
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: 'none',
                        borderRadius: '6px',
                        background: '#ffebee',
                        color: '#c62828',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#ffcdd2';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#ffebee';
                      }}
                      onClick={() => openDeleteDialog(resource)}
                    >
                      🗑️ Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {resources.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📂</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#1a1a2e' }}>
            Aucune ressource
          </h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Commencez par créer votre première ressource
          </p>
          {canWrite && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              + Créer une ressource
            </button>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouvelle ressource"
      >
        <form onSubmit={handleCreateResource}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#333'
            }}>
              Nom de la ressource
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Ex: Rapport de sécurité Q4"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#333'
            }}>
              Niveau de sensibilité
            </label>
            <select
              value={formData.sensitivityLevel}
              onChange={(e) => setFormData({ ...formData, sensitivityLevel: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="PUBLIC">🌐 Public</option>
              <option value="INTERNAL">🔵 Interne</option>
              <option value="CONFIDENTIAL">🟡 Confidentiel</option>
              <option value="SECRET">🔴 Secret</option>
            </select>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#333'
            }}>
              Type de données
            </label>
            <select
              value={formData.dataType}
              onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="DOCUMENT">📄 Document</option>
              <option value="CODE">💻 Code</option>
              <option value="CONFIGURATION">⚙️ Configuration</option>
              <option value="CREDENTIALS">🔐 Credentials</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px'
            }}
          >
            Créer la ressource
          </button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedResource(null);
        }}
        title="Modifier la ressource"
      >
        <form onSubmit={handleEditResource}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#333'
            }}>
              Nom de la ressource
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#333'
            }}>
              Niveau de sensibilité
            </label>
            <select
              value={formData.sensitivityLevel}
              onChange={(e) => setFormData({ ...formData, sensitivityLevel: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="PUBLIC">🌐 Public</option>
              <option value="INTERNAL">🔵 Interne</option>
              <option value="CONFIDENTIAL">🟡 Confidentiel</option>
              <option value="SECRET">🔴 Secret</option>
            </select>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#333'
            }}>
              Type de données
            </label>
            <select
              value={formData.dataType}
              onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="DOCUMENT">📄 Document</option>
              <option value="CODE">💻 Code</option>
              <option value="CONFIGURATION">⚙️ Configuration</option>
              <option value="CREDENTIALS">🔐 Credentials</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px'
            }}
          >
            Enregistrer les modifications
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedResource(null);
        }}
        onConfirm={handleDeleteResource}
        title="Supprimer la ressource"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedResource?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
};

export default Resources;

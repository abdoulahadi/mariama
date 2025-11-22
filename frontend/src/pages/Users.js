// src/pages/Users.js
import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Common/Toast';
import Modal from '../components/Common/Modal';
import ConfirmDialog from '../components/Common/ConfirmDialog';

const Users = () => {
  const { user: currentUser, createUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'INTERN',
    department: 'cybersecurity'
  });
  const [creating, setCreating] = useState(false);

  const isDepartmentHead = currentUser?.role === 'DEPARTMENT_HEAD';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.listUsers();
      setUsers(response.data.users);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur de chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!isDepartmentHead) {
      toast.error('Seul le Chef de Département peut créer des utilisateurs');
      return;
    }

    setCreating(true);
    const result = await createUser(formData.email, formData.password, formData.role, formData.department);

    if (result.success) {
      toast.success('Utilisateur créé avec succès');
      setShowCreateModal(false);
      setFormData({ email: '', password: '', role: 'INTERN', department: 'cybersecurity' });
      loadUsers();
    } else {
      toast.error(result.error);
    }
    setCreating(false);
  };

  const handleToggleActive = (user) => {
    if (!isDepartmentHead) {
      toast.warning('Seul le Chef de Département peut modifier les utilisateurs');
      return;
    }
    setSelectedUser(user);
    setShowConfirmDialog(true);
  };

  const confirmToggleActive = async () => {
    try {
      await usersAPI.updateUser(selectedUser.id, { isActive: !selectedUser.isActive });
      toast.success(`Utilisateur ${selectedUser.isActive ? 'désactivé' : 'activé'} avec succès`);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur de modification');
    }
    setShowConfirmDialog(false);
    setSelectedUser(null);
  };

  const getRoleInfo = (role) => {
    const roles = {
      'DEPARTMENT_HEAD': { label: 'Chef de Département', color: '#dc3545', icon: '👑', bg: '#f8d7da' },
      'SECURITY_MANAGER': { label: 'Manager Sécurité', color: '#856404', icon: '👔', bg: '#fff3cd' },
      'SECURITY_ANALYST': { label: 'Analyste Sécurité', color: '#0c5460', icon: '🔍', bg: '#d1ecf1' },
      'INTERN': { label: 'Stagiaire', color: '#383d41', icon: '👨‍🎓', bg: '#e2e3e5' }
    };
    return roles[role] || roles['INTERN'];
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length
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
            Gestion des Utilisateurs
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            Gérez les accès et les rôles des utilisateurs
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {!isDepartmentHead && (
            <div style={{
              padding: '10px 20px',
              background: '#fff3cd',
              borderRadius: '8px',
              color: '#856404',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              Mode lecture seule
            </div>
          )}

          {isDepartmentHead && (
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
              Nouvel utilisateur
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #667eea'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', textTransform: 'uppercase' }}>
            Total Utilisateurs
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#667eea' }}>
            {stats.total}
          </div>
        </div>
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #28a745'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', textTransform: 'uppercase' }}>
            Actifs
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#28a745' }}>
            {stats.active}
          </div>
        </div>
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #dc3545'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', textTransform: 'uppercase' }}>
            Inactifs
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#dc3545' }}>
            {stats.inactive}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '25px'
      }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Rechercher par email ou département..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              fontSize: '14px',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={{
            padding: '12px 20px',
            border: '2px solid #e0e0e0',
            borderRadius: '10px',
            fontSize: '14px',
            background: 'white',
            cursor: 'pointer',
            minWidth: '200px'
          }}
        >
          <option value="">Tous les rôles</option>
          <option value="DEPARTMENT_HEAD">Chef de Département</option>
          <option value="SECURITY_MANAGER">Manager Sécurité</option>
          <option value="SECURITY_ANALYST">Analyste Sécurité</option>
          <option value="INTERN">Stagiaire</option>
        </select>
      </div>

      {/* Users Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px'
      }}>
        {filteredUsers.map(user => {
          const roleInfo = getRoleInfo(user.role);
          const isCurrentUser = user.id === currentUser?.id;

          return (
            <div key={user.id} style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              opacity: user.isActive ? 1 : 0.7
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            }}>
              <div style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '15px'
              }}>
                {/* Avatar */}
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: roleInfo.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  flexShrink: 0
                }}>
                  {roleInfo.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '15px',
                      color: '#1a1a2e',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {user.email}
                    </h3>
                    {isCurrentUser && (
                      <span style={{
                        padding: '2px 6px',
                        background: '#667eea',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600'
                      }}>
                        VOUS
                      </span>
                    )}
                  </div>

                  <div style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    background: roleInfo.bg,
                    color: roleInfo.color,
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '10px'
                  }}>
                    {roleInfo.label}
                  </div>

                  <div style={{ fontSize: '13px', color: '#666' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>Département:</strong> {user.department}
                    </div>
                    <div>
                      <strong>Créé:</strong> {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '10px'
                }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: user.isActive ? '#d4edda' : '#f8d7da',
                    color: user.isActive ? '#155724' : '#721c24'
                  }}>
                    {user.isActive ? '● Actif' : '○ Inactif'}
                  </span>

                  {isDepartmentHead && !isCurrentUser && (
                    <button
                      onClick={() => handleToggleActive(user)}
                      style={{
                        padding: '8px 14px',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        background: user.isActive ? '#ffebee' : '#e8f5e9',
                        color: user.isActive ? '#c62828' : '#2e7d32',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = user.isActive ? '#ffcdd2' : '#c8e6c9';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = user.isActive ? '#ffebee' : '#e8f5e9';
                      }}
                    >
                      {user.isActive ? 'Désactiver' : 'Activer'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>👥</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#1a1a2e' }}>
            Aucun utilisateur trouvé
          </h3>
          <p style={{ color: '#666' }}>
            Modifiez vos critères de recherche
          </p>
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer un utilisateur"
      >
        <form onSubmit={handleCreateUser}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#333'
            }}>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="utilisateur@company.com"
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
              Mot de passe
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              placeholder="Minimum 6 caractères"
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
              Rôle
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="INTERN">👨‍🎓 Stagiaire (lecture seule)</option>
              <option value="SECURITY_ANALYST">🔍 Analyste Sécurité (lecture + écriture)</option>
              <option value="SECURITY_MANAGER">👔 Manager Sécurité (lecture + écriture)</option>
              <option value="DEPARTMENT_HEAD">👑 Chef de Département (accès complet)</option>
            </select>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#333'
            }}>
              Département
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="cybersecurity">Cybersécurité</option>
              <option value="it">IT</option>
              <option value="operations">Opérations</option>
              <option value="management">Management</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={creating}
            style={{
              width: '100%',
              padding: '14px',
              background: creating ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: creating ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '15px'
            }}
          >
            {creating ? 'Création...' : 'Créer l\'utilisateur'}
          </button>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setSelectedUser(null);
        }}
        onConfirm={confirmToggleActive}
        title={selectedUser?.isActive ? 'Désactiver l\'utilisateur' : 'Activer l\'utilisateur'}
        message={`Êtes-vous sûr de vouloir ${selectedUser?.isActive ? 'désactiver' : 'activer'} l'utilisateur "${selectedUser?.email}" ?`}
        confirmText={selectedUser?.isActive ? 'Désactiver' : 'Activer'}
        cancelText="Annuler"
        type={selectedUser?.isActive ? 'danger' : 'info'}
      />
    </div>
  );
};

export default Users;

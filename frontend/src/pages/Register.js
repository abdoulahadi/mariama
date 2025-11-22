// src/pages/Register.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Common/Toast';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('INTERN');
  const [department, setDepartment] = useState('cybersecurity');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    const result = await register(email, password, role, department);

    if (result.success) {
      toast.success('Inscription réussie ! Bienvenue !');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Erreur lors de l\'inscription');
    }

    setLoading(false);
  };

  const roles = [
    { value: 'INTERN', label: 'Stagiaire', icon: '👨‍🎓', desc: 'Lecture seule', color: '#6c757d' },
    { value: 'SECURITY_ANALYST', label: 'Analyste Sécurité', icon: '🔍', desc: 'Lecture + Écriture', color: '#17a2b8' },
    { value: 'SECURITY_MANAGER', label: 'Manager Sécurité', icon: '👔', desc: 'Lecture + Écriture', color: '#ffc107' },
    { value: 'DEPARTMENT_HEAD', label: 'Chef de Département', icon: '👑', desc: 'Accès complet', color: '#dc3545' }
  ];

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '480px',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          padding: '35px 30px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 15px',
            fontSize: '28px'
          }}>
            ✨
          </div>
          <h1 style={{
            color: 'white',
            margin: 0,
            fontSize: '22px',
            fontWeight: '600'
          }}>
            Créer un compte
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.7)',
            margin: '8px 0 0',
            fontSize: '13px'
          }}>
            Rejoignez le système SecureAccess
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: '30px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#333',
                fontSize: '14px'
              }}>
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="votre@email.com"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e0e0e0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#333',
                  fontSize: '14px'
                }}>
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#333',
                  fontSize: '14px'
                }}>
                  Confirmer
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: `2px solid ${confirmPassword && password !== confirmPassword ? '#dc3545' : '#e0e0e0'}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = confirmPassword && password !== confirmPassword ? '#dc3545' : '#e0e0e0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontWeight: '500',
                color: '#333',
                fontSize: '14px'
              }}>
                Rôle
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {roles.map((r) => (
                  <div
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    style={{
                      padding: '12px',
                      border: `2px solid ${role === r.value ? r.color : '#e0e0e0'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: role === r.value ? `${r.color}10` : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '18px' }}>{r.icon}</span>
                      <span style={{
                        fontWeight: '600',
                        fontSize: '13px',
                        color: role === r.value ? r.color : '#333'
                      }}>
                        {r.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#666', marginLeft: '26px' }}>
                      {r.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#333',
                fontSize: '14px'
              }}>
                Département
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  background: 'white',
                  cursor: 'pointer'
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
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading
                  ? '#ccc'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <span style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Inscription...
                </span>
              ) : 'Créer mon compte'}
            </button>
          </form>

          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            paddingTop: '20px',
            borderTop: '1px solid #eee'
          }}>
            <span style={{ color: '#666', fontSize: '14px' }}>Déjà un compte ?</span>
            {' '}
            <Link
              to="/login"
              style={{
                color: '#667eea',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Register;

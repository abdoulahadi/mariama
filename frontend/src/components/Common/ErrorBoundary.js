// src/components/Common/ErrorBoundary.js
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ maxWidth: '600px', margin: '100px auto', padding: '30px' }}>
          <h2 style={{ color: '#dc3545' }}>❌ Une erreur est survenue</h2>
          <p>Quelque chose s'est mal passé. Veuillez rafraîchir la page.</p>

          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '20px', whiteSpace: 'pre-wrap' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Détails de l'erreur (dev)
              </summary>
              <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '5px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </div>
            </details>
          )}

          <button
            className="btn btn-primary"
            style={{ marginTop: '20px' }}
            onClick={() => window.location.reload()}
          >
            Rafraîchir la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

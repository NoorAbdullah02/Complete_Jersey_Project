import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console for now; could integrate with remote logging later
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ maxWidth: 800, textAlign: 'center' }}>
            <h2 style={{ color: '#fff', marginBottom: 8 }}>Something went wrong.</h2>
            <p style={{ color: '#9ca3af' }}>The page encountered an error while rendering. Please try reloading or contact support.</p>
            <pre style={{ textAlign: 'left', marginTop: 12, color: '#f87171', background: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
              {String(this.state.error)}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);

    // Auto-reload on dynamic import / chunk failures (usually caused by new deployments)
    const errorString = error?.toString() || "";
    const isChunkError =
      errorString.includes("Failed to fetch dynamically imported module") ||
      errorString.includes("Failed to load module script") ||
      errorString.includes("ChunkLoadError");

    if (isChunkError) {
      const lastReload = sessionStorage.getItem('last-chunk-error-reload');
      const now = Date.now();
      // Prevent infinite reload loops by only reloading if we haven't reloaded in the last 10 seconds
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem('last-chunk-error-reload', String(now));
        console.warn("Dynamic import failed (likely due to a new deployment). Auto-reloading page to fetch new assets...");
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#991B1B', marginBottom: '16px' }}>Oops! Something went wrong.</h1>
          <p style={{ color: '#4B5563', marginBottom: '24px' }}>
            We're sorry, but an unexpected error occurred. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1A5C2E',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px', textAlign: 'left', background: '#F3F4F6', padding: '15px', borderRadius: '8px' }}>
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </details>
          )}
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;

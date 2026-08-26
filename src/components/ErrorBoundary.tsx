import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Prototype render error boundary caught an error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="main-content">
        <section className="dashboard-panel empty-state" role="alert">
          <AlertTriangle size={44} />
          <h1>Something went wrong</h1>
          <p className="page-title-desc">The mock frontend caught a recoverable render error. Local prototype data was not changed by this fallback.</p>
          {import.meta.env.DEV && <pre className="code-preview">{this.state.error.message}</pre>}
          <button
            className="btn btn-primary"
            style={{ width: 'auto' }}
            onClick={() => {
              this.setState({ error: null });
              this.props.onReset?.();
            }}
          >
            <RefreshCw size={16} /> Reload Prototype
          </button>
        </section>
      </main>
    );
  }
}

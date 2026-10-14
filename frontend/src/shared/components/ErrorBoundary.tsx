import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#141714] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 shadow-lg">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">
            {this.props.fallbackTitle || 'Something went wrong'}
          </h2>
          <p className="text-stone-400 text-sm max-w-md mb-6 leading-relaxed">
            {this.state.error?.message || 'An unexpected rendering error occurred. Please reload to restore your session.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-[#278b50] hover:bg-[#1e6f3f] text-white text-sm font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-500/20"
            >
              <RefreshCw size={16} />
              Reload Platform
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('agri-ui-state');
                try {
                  const raw = localStorage.getItem('app-data-storage');
                  if (raw) {
                    const parsed = JSON.parse(raw);
                    delete parsed.fertilizer;
                    delete parsed.fertilizerError;
                    localStorage.setItem('app-data-storage', JSON.stringify(parsed));
                  }
                } catch (e) {}
                window.location.href = '/';
              }}
              className="px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-semibold rounded-xl cursor-pointer transition-all border border-white/10"
            >
              Reset to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

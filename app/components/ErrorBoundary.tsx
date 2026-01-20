"use client";

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        // Call optional error handler
        this.props.onError?.(error, errorInfo);

        // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
        // trackError({ error, errorInfo, componentStack: errorInfo.componentStack });

        this.setState({
            error,
            errorInfo,
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen bg-background-dark flex items-center justify-center p-6">
                    <div className="max-w-md w-full glass-panel p-8 rounded-3xl border-2 border-reserve-red/30">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="text-reserve-red" size={32} />
                            <h2 className="text-xl font-black uppercase tracking-widest text-white">
                                System Malfunction
                            </h2>
                        </div>

                        <p className="text-white/70 mb-6">
                            The Sentinel encountered an unexpected error. Your data is safe, but this component needs to be reinitialized.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mb-6 p-4 bg-black/40 rounded-xl border border-white/10">
                                <summary className="text-xs font-mono text-reserve-red cursor-pointer mb-2">
                                    Error Details (Dev Mode)
                                </summary>
                                <pre className="text-[10px] text-white/60 overflow-auto max-h-48">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all"
                            >
                                <RefreshCw size={16} />
                                Retry
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="flex-1 px-6 py-3 bg-white/10 text-white font-black uppercase tracking-widest rounded-xl hover:bg-white/20 active:scale-95 transition-all"
                            >
                                Home
                            </button>
                        </div>

                        <p className="text-center text-xs text-white/40 mt-4">
                            If this persists, contact support or clear your browser cache.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Functional wrapper for easier usage
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}

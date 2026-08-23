"use client"

import React from 'react';
import { Button } from '@/components/ui/button';

type Props = { children: React.ReactNode; fallback?: React.ReactNode };
type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    // TODO: Sentry.captureException(error)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 text-center border bg-card">
          <h2 className="font-headline text-2xl mb-2">Something went wrong</h2>
          <p className="text-muted-foreground text-sm mb-6">Our boutique encountered an unexpected issue. Please refresh or return home.</p>
          <div className="flex gap-3">
            <Button onClick={() => location.reload()} className="bg-primary text-white rounded-none uppercase text-xs tracking-widest">Reload</Button>
            <Button variant="outline" onClick={() => (location.href = '/')} className="rounded-none uppercase text-xs tracking-widest">Home</Button>
          </div>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <pre className="mt-6 text-left text-xs bg-muted p-4 overflow-auto max-w-full">{this.state.error.message}</pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

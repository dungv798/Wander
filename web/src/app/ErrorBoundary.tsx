import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { COPY } from '../shared/const/copy.vi.ts';
import { Button } from '../shared/ui/Button.tsx';
import { EmptyState } from '../shared/ui/EmptyState.tsx';
import { describeError } from './describeError.ts';

interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly failed: boolean;
  /** The message + a few leading stack-trace lines, so someone testing on a phone can send them back (there is no console). */
  readonly detail: string;
}

/** The error boundary at the app root: a UI rendering error shows a notice with a reload button instead of leaving the whole page blank. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { failed: false, detail: '' };

  /** Marks it as failed (with the shortened detail) so the next render shows the notice screen. */
  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { failed: true, detail: describeError(error) };
  }

  /** Writes the error to the console for the developer (there is no error-collection service yet). */
  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Lỗi dựng giao diện', error, info.componentStack);
  }

  /** Renders the child normally, or the error notice screen once it has failed. */
  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return <EmptyState role="alert" icon="alert-triangle" title={COPY.state.crashTitle} text={COPY.state.crashText} actions={<><Button onClick={() => location.reload()}>{COPY.state.reload}</Button>{this.state.detail ? <details className="crash-detail"><summary>{COPY.state.crashDetail}</summary><pre>{this.state.detail}</pre></details> : null}</>} />;
  }
}

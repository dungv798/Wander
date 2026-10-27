import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { COPY } from '../shared/const/copy.vi.ts';
import { Button } from '../shared/ui/Button.tsx';
import { EmptyState } from '../shared/ui/EmptyState.tsx';

interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly failed: boolean;
}

/** Ranh giới lỗi ở gốc ứng dụng: lỗi dựng giao diện hiện thông báo có nút tải lại thay vì để cả trang trắng. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { failed: false };

  /** Đánh dấu đã lỗi để lần dựng tiếp theo hiện màn thông báo. */
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  /** Ghi lỗi ra console cho người phát triển (chưa có dịch vụ thu lỗi). */
  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Lỗi dựng giao diện', error, info.componentStack);
  }

  /** Dựng con bình thường, hoặc màn thông báo lỗi khi đã hỏng. */
  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return <EmptyState role="alert" icon="alert-triangle" title={COPY.state.crashTitle} text={COPY.state.crashText} actions={<Button onClick={() => location.reload()}>{COPY.state.reload}</Button>} />;
  }
}

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
  /** Thông điệp + vài dòng đầu dấu vết ngăn xếp, để người thử trên điện thoại gửi lại (không có console). */
  readonly detail: string;
}

/** Ranh giới lỗi ở gốc ứng dụng: lỗi dựng giao diện hiện thông báo có nút tải lại thay vì để cả trang trắng. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { failed: false, detail: '' };

  /** Đánh dấu đã lỗi (kèm chi tiết rút gọn) để lần dựng tiếp theo hiện màn thông báo. */
  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { failed: true, detail: describeError(error) };
  }

  /** Ghi lỗi ra console cho người phát triển (chưa có dịch vụ thu lỗi). */
  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Lỗi dựng giao diện', error, info.componentStack);
  }

  /** Dựng con bình thường, hoặc màn thông báo lỗi khi đã hỏng. */
  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return <EmptyState role="alert" icon="alert-triangle" title={COPY.state.crashTitle} text={COPY.state.crashText} actions={<><Button onClick={() => location.reload()}>{COPY.state.reload}</Button>{this.state.detail ? <details className="crash-detail"><summary>{COPY.state.crashDetail}</summary><pre>{this.state.detail}</pre></details> : null}</>} />;
  }
}

import type { ReactNode } from 'react';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { COPY } from '../../../shared/const/copy.vi.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { goBack } from '../../../shared/router/hashRoute.ts';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { ScreenSkeleton } from '../../../shared/ui/Skeleton.tsx';
import { useDestination } from '../hooks/useDestination.ts';
import { PlaceSheet } from './PlaceSheet.tsx';
import type { DestinationDetail } from '../model/Catalog.types.ts';

interface DestinationGateProps {
  readonly destId: string;
  /** Màn quẹt thẻ: tờ chi tiết là ngăn kéo bên phải trên máy tính rộng. */
  readonly inDeck?: boolean;
  /** Dựng màn khi đã có dữ liệu điểm đến. */
  readonly children: (dest: DestinationDetail) => ReactNode;
}

/** Cổng tải điểm đến: khung xương khi đang tải, thông báo lỗi có "Thử lại" (không trắng trang), rồi mới dựng màn thật. */
export function DestinationGate({ destId, inDeck = false, children }: DestinationGateProps) {
  const { state, retry } = useDestination(destId);
  if (state.status === 'loading') return <ScreenSkeleton />;
  if (state.status === 'error') {
    const notFound = state.error instanceof ApiError && state.error.code === 'NOT_FOUND';
    return (
      <EmptyState
        role="alert"
        title={notFound ? COPY.state.notFoundTitle : COPY.state.loadErrorTitle}
        text={notFound ? COPY.state.notFoundText : COPY.state.loadErrorText}
        actions={<><IconButton icon="chevron-left" label={COPY.common.back} onClick={goBack} /><Button onClick={retry}>{COPY.common.retry}</Button></>}
      />
    );
  }
  return (
    <>
      {children(state.data)}
      <PlaceSheet dest={state.data} inDeck={inDeck} />
    </>
  );
}

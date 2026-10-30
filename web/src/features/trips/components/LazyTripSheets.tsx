import { lazy, Suspense } from 'react';
import type { ComponentProps } from 'react';
import { ScreenSkeleton } from '../../../shared/ui/Skeleton.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { Button } from '../../../shared/ui/Button.tsx';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { TripFormLayout } from './TripFormLayout.tsx';

/** Nạp form nhanh khi người dùng chuẩn bị mở tờ tạo chuyến. */
function loadCreate() { return import('./CreateTripSheetContent.tsx'); }
/** Nạp trình từng bước độc lập với form nhanh. */
function loadWizard() { return import('./TripWizard.tsx'); }
const Create = lazy(() => loadCreate().then(module => ({ default: module.CreateTripSheet })));
const Wizard = lazy(() => loadWizard().then(module => ({ default: module.TripWizard })));

/** Làm ấm chunk trên hover/focus/chạm; lỗi tải sẽ được thử lại khi mở thật. */
export function preloadCreateTrip() { void loadCreate().catch(() => undefined); }
/** Làm ấm trình từng bước mà không dựng hoặc đổi dữ liệu biểu mẫu. */
export function preloadTripWizard() { void loadWizard().catch(() => undefined); }

/** Giữ chiều cao form và khả năng đóng trong lúc chunk chưa sẵn sàng. */
function PendingTripForm({ onClose }: { readonly onClose: () => void }) {
  return <Sheet label={T.create.title} onClose={onClose}>
    <TripFormLayout actions={<Button kind="ghost" block onClick={onClose}>{T.create.cancel}</Button>}>
      <ScreenSkeleton />
    </TripFormLayout>
  </Sheet>;
}

/** Chỉ tải form khi mở, giữ nguyên props và DOM của form sau khi tải. */
export function LazyCreateTripSheet(props: ComponentProps<typeof Create>) {
  return <Suspense fallback={<PendingTripForm onClose={props.onClose} />}><Create {...props} /></Suspense>;
}

/** Giữ bản nháp ở thành phần gọi khi chuyển sang trình từng bước tải lười. */
export function LazyTripWizard(props: ComponentProps<typeof Wizard>) {
  return <Suspense fallback={<PendingTripForm onClose={props.onClose} />}><Wizard {...props} /></Suspense>;
}

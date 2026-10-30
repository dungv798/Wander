import { lazy, Suspense, useState } from 'react';
import { Button } from '../../../shared/ui/Button.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { ScreenSkeleton } from '../../../shared/ui/Skeleton.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { permissionsOf } from '../model/tripPermissions.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';

/** Tải tờ chọn trước thao tác mở, không dựng danh sách nơi ở màn đầu. */
function loadSheet() { return import('./AddManySheet.tsx'); }
const AddManySheet = lazy(() => loadSheet().then(module => ({ default: module.AddManySheet })));
/** Làm ấm chunk cho chuột, bàn phím và thao tác chạm. */
function preload() { void loadSheet().catch(() => undefined); }

/** Lối vào tự quản lý tờ chọn; chỉ người có quyền xếp lịch được thêm lô vào ngày. */
export function AddManyEntry() {
  const { trip } = useTripView();
  const [open, setOpen] = useState(false);
  if (!permissionsOf(trip).schedule) return null;
  return <>
    <Button kind="ghost" icon="plus" onPointerEnter={preload} onFocus={preload} onPointerDown={preload} onClick={() => setOpen(true)}>{T.addMany.open}</Button>
    {open ? <Suspense fallback={<Sheet full label={T.addMany.open} onClose={() => setOpen(false)}><ScreenSkeleton /></Sheet>}>
      <AddManySheet onClose={() => setOpen(false)} />
    </Suspense> : null}
  </>;
}

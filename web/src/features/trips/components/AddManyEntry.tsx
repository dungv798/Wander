import { lazy, Suspense, useState } from 'react';
import { Button } from '../../../shared/ui/Button.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { ScreenSkeleton } from '../../../shared/ui/Skeleton.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { permissionsOf } from '../model/tripPermissions.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';

/** Loads the picker sheet before the open action, and does not build the place list on the first screen. */
function loadSheet() { return import('./AddManySheet.tsx'); }
const AddManySheet = lazy(() => loadSheet().then(module => ({ default: module.AddManySheet })));
/** Warms the chunk for the mouse, the keyboard and a touch action. */
function preload() { void loadSheet().catch(() => undefined); }

/** The entry point manages the picker sheet itself; only someone with permission to schedule can add in bulk to a day. */
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

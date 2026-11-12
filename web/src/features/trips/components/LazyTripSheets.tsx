import { lazy, Suspense } from 'react';
import type { ComponentProps } from 'react';
import { ScreenSkeleton } from '../../../shared/ui/Skeleton.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { Button } from '../../../shared/ui/Button.tsx';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { TripFormLayout } from './TripFormLayout.tsx';

/** Loads the quick form when the user is about to open the trip-creating sheet. */
function loadCreate() { return import('./CreateTripSheetContent.tsx'); }
/** Loads the step-by-step wizard independently of the quick form. */
function loadWizard() { return import('./TripWizard.tsx'); }
const Create = lazy(() => loadCreate().then(module => ({ default: module.CreateTripSheet })));
const Wizard = lazy(() => loadWizard().then(module => ({ default: module.TripWizard })));

/** Warms the chunk on hover/focus/touch; a load error is retried when it is really opened. */
export function preloadCreateTrip() { void loadCreate().catch(() => undefined); }
/** Warms the wizard without building or changing the form data. */
export function preloadTripWizard() { void loadWizard().catch(() => undefined); }

/** Keeps the form height and the ability to close while the chunk is not ready. */
function PendingTripForm({ onClose }: { readonly onClose: () => void }) {
  return <Sheet label={T.create.title} onClose={onClose}>
    <TripFormLayout actions={<Button kind="ghost" block onClick={onClose}>{T.create.cancel}</Button>}>
      <ScreenSkeleton />
    </TripFormLayout>
  </Sheet>;
}

/** Loads the form only when opened, keeping the form's props and DOM unchanged after loading. */
export function LazyCreateTripSheet(props: ComponentProps<typeof Create>) {
  return <Suspense fallback={<PendingTripForm onClose={props.onClose} />}><Create {...props} /></Suspense>;
}

/** Keeps the draft in the calling component when switching to the lazy-loaded wizard. */
export function LazyTripWizard(props: ComponentProps<typeof Wizard>) {
  return <Suspense fallback={<PendingTripForm onClose={props.onClose} />}><Wizard {...props} /></Suspense>;
}

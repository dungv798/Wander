import { useState } from 'react';
import { Button } from '../../../../shared/ui/Button.tsx';
import { CreateTripSheet } from '../../../trips/index.ts';
import type { PlaceView } from '../../model/Catalog.types.ts';
import { DEST_COPY } from '../../model/dest.copy.ts';

/** Choosing a place for a trip: uses the real form to create a new one, add to a compatible trip or leave for later. */
export function PlaceTripAction({ destId, place }: { readonly destId: string; readonly place: PlaceView }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button arrow onClick={() => setOpen(true)}>{DEST_COPY.chooseTrip}</Button>
    {open ? <CreateTripSheet destId={destId} picked={[place]} onClose={() => setOpen(false)} /> : null}
  </>;
}

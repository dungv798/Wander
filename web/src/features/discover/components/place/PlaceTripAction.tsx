import { useState } from 'react';
import { Button } from '../../../../shared/ui/Button.tsx';
import { CreateTripSheet } from '../../../trips/index.ts';
import type { PlaceView } from '../../model/Catalog.types.ts';
import { DEST_COPY } from '../../model/dest.copy.ts';

/** Chọn một nơi cho chuyến: dùng form thật để tạo mới, thêm vào chuyến tương thích hoặc để sau. */
export function PlaceTripAction({ destId, place }: { readonly destId: string; readonly place: PlaceView }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button arrow onClick={() => setOpen(true)}>{DEST_COPY.chooseTrip}</Button>
    {open ? <CreateTripSheet destId={destId} picked={[place]} onClose={() => setOpen(false)} /> : null}
  </>;
}

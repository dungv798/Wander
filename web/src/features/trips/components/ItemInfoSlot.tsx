import { Button } from '../../../shared/ui/Button.tsx';
import { usePlaceSheet } from '../../discover/index.ts';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { useTrashItem } from '../hooks/useTrashItem.ts';
import { COLLAB_COPY } from '../../collab/index.ts';
import { permissionsOf } from '../model/tripPermissions.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { ItemMeta } from './ItemMeta.tsx';

interface SlotProps {
  readonly tripId: string;
  readonly itemId: string;
}

/** The extra part of the place detail sheet when opened from a trip: a summary of the item's time/price/booking and the 'Time, cost, booking' button. Reads the latest data of the item. */
export function ItemInfoSlot({ tripId, itemId, onEdit }: SlotProps & { readonly onEdit: () => void }) {
  const { trip } = useTrips();
  const item = trip(tripId)?.items.find((i) => i.id === itemId);
  const place = usePlaceSheet();
  if (!item) return null;
  return (
    <div className="stack tight">
      <ItemMeta item={item} />
      <Button
        kind="ghost"
        block
        icon="pencil"
        onClick={() => {
          place.close();
          onEdit();
        }}
      >
        {T.itemSheet.edit}
      </Button>
    </div>
  );
}

/** The button bar at the bottom of the detail sheet when opened from a trip: 'Choose day' and 'Remove from the trip' (soft delete, with Undo). */
export function ItemCtaSlot({ tripId, itemId, name, onPickDay, onRequestDelete }: SlotProps & { readonly name: string; readonly onPickDay: () => void; readonly onRequestDelete: () => void }) {
  const place = usePlaceSheet();
  const { trip } = useTrips();
  const trash = useTrashItem();
  const current = trip(tripId);
  const item = current?.items.find((i) => i.id === itemId);
  const mayChange = !!current && !!item && permissionsOf(current).canChange(item);
  if (item && !mayChange) {
    return (
      <Button
        kind="ghost"
        icon="flag"
        onClick={() => {
          place.close();
          onRequestDelete();
        }}
      >
        {COLLAB_COPY.requests.ask}
      </Button>
    );
  }
  const exists = !!item;
  return (
    <>
    <Button
      kind="ghost"
      icon="calendar-event"
      onClick={() => {
        place.close();
        onPickDay();
      }}
    >
      {T.itemSheet.chooseDay}
    </Button>
    {exists ? (
      <Button
        kind="ghost"
        icon="trash"
        onClick={() => {
          place.close();
          trash(tripId, itemId, name);
        }}
      >
        {T.trash.deleteItem}
      </Button>
    ) : null}
    </>
  );
}

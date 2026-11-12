import { Icon } from '../../../shared/ui/Icon.tsx';
import { HOME_COPY } from '../model/home.copy.ts';
import { useShellSheet } from '../hooks/ShellSheetProvider.tsx';

/**
 * The 'Map' button takes the user to the app frame's MAIN MAP (same data, same camera) by collapsing the content sheet.
 * It only means something on a phone, where the sheet covers the map; a wide screen already sees the map next to the panel so CSS hides the button (`.map-peek`).
 */
export function MapPeekButton() {
  const sheet = useShellSheet();
  if (!sheet) return null;
  return (
    <button className="btn ghost map-peek" type="button" onClick={() => sheet.setMode('peek')}>
      <Icon name="map-pin" />
      {HOME_COPY.mapButton}
    </button>
  );
}

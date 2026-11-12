import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

interface DeckFocus { readonly destinationId: string; readonly placeId: string | null }
interface DeckSpotlightValue { readonly focus: DeckFocus | null; readonly publish: Dispatch<SetStateAction<DeckFocus | null>> }
const DeckSpotlightContext = createContext<DeckSpotlightValue | null>(null);

/** The coordinates being looked at by the card being viewed are temporary UI, not recorded as a decision or saved to localStorage. */
export function DeckSpotlightProvider({ children }: { readonly children: ReactNode }) {
  const [focus, publish] = useState<DeckFocus | null>(null);
  const value = useMemo(() => ({ focus, publish }), [focus]);
  return <DeckSpotlightContext.Provider value={value}>{children}</DeckSpotlightContext.Provider>;
}

/** The map reads exactly the deck's card, including the add-to-trip mode that has its own exclusion/skip set. */
export function useDeckSpotlight(): DeckSpotlightValue {
  const value = useContext(DeckSpotlightContext);
  if (!value) throw new Error('DeckSpotlightProvider');
  return value;
}

/** Changes the focus only when the card changes; changing the photo on the same card does not make the camera fly again. Leaving the deck releases the focus. */
export function usePublishDeckSpotlight(destinationId: string, placeId: string | null): void {
  const { publish } = useDeckSpotlight();
  useEffect(() => { publish({ destinationId, placeId }); }, [destinationId, placeId, publish]);
  useEffect(() => () => publish(null), [publish]);
}

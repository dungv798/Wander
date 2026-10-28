/** Cổng công khai của tính năng "Khám phá": bên ngoài chỉ được dùng những gì xuất ở đây. */
export { DiscoverProvider, useDiscover } from './hooks/DiscoverProvider.tsx';
export { CurrentDestinationProvider, useCurrentDestination } from './hooks/CurrentDestinationProvider.tsx';
export type { DestinationSummary } from './model/Catalog.types.ts';
export { PlaceSheetProvider, usePlaceSheet } from './hooks/PlaceSheetProvider.tsx';
export type { PlaceSlot } from './hooks/PlaceSheetProvider.tsx';
export { useDestination } from './hooks/useDestination.ts';
export { HomeScreen } from './components/HomeScreen.tsx';
export { DestScreen } from './components/DestScreen.tsx';
export { DeckScreen } from './components/DeckScreen.tsx';
export type { AddingMode } from './model/addingMode.ts';
export { PickedScreen } from './components/PickedScreen.tsx';
export { DestinationGate } from './components/DestinationGate.tsx';
export { CATEGORY_ICON, CATEGORY_NAME, COMING_SOON } from './model/discover.const.ts';
export { firstPhotoUrl, mainAway, placeById, coverPlace } from './model/destinationQueries.ts';
export { hubMarker, placeMarkers } from './model/mapMarkers.ts';
export { pickedOf } from './model/discoverState.ts';
export type { DestinationDetail, PlaceView, CategoryCode } from './model/Catalog.types.ts';
export type { CatalogRepository } from './api/CatalogRepository.ts';

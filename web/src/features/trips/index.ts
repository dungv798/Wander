/** Cổng công khai của tính năng "Chuyến đi". */
export { TripsProvider, useTrips } from './hooks/TripsProvider.tsx';
export { TripsScreen } from './components/TripsScreen.tsx';
export { TodayScreen } from './components/TodayScreen.tsx';
export { ExportScreen } from './components/ExportScreen.tsx';
export { TripScreen } from './components/TripScreen.tsx';
export { CreateTripSheet } from './components/CreateTripSheet.tsx';
export type { Trip, TripItem } from './model/trip.types.ts';
export { useCreateFromTemplate } from './hooks/useCreateFromTemplate.ts';
export type { TemplateTripSpec } from './hooks/useCreateFromTemplate.ts';
export { JoinScreen } from './components/JoinScreen.tsx';

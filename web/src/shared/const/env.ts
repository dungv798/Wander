/** Running in development mode (vite dev). The 'TRIAL VERSION' buttons that stand in for other devices show only when true; a real build does not have them. */
export const IS_DEV: boolean = Boolean(import.meta.env?.DEV);

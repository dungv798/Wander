/** The public gate of the 'Anonymous identity' feature (recovery code, trusted devices, recovery). */
export { IdentityProvider } from './hooks/IdentityProvider.tsx';
export { useIdentity, useRequireIdentity, useSessionExpired } from './hooks/identityContext.ts';
export { SecurityScreen } from './components/SecurityScreen.tsx';
export { RecoverScreen } from './components/RecoverScreen.tsx';
export { ExpiredScreen } from './components/ExpiredScreen.tsx';
export { parseDeviceName } from './model/deviceName.ts';
export { IDENTITY_COPY } from './model/identity.copy.ts';
export { useReportError } from './hooks/useReportError.ts';

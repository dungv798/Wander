/** Cổng công khai của tính năng "Danh tính ẩn danh" (mã khôi phục, thiết bị tin cậy, khôi phục). */
export { IdentityProvider } from './hooks/IdentityProvider.tsx';
export { useIdentity, useRequireIdentity, useSessionExpired } from './hooks/identityContext.ts';
export { SecurityScreen } from './components/SecurityScreen.tsx';
export { RecoverScreen } from './components/RecoverScreen.tsx';
export { ExpiredScreen } from './components/ExpiredScreen.tsx';
export { parseDeviceName } from './model/deviceName.ts';
export { IDENTITY_COPY } from './model/identity.copy.ts';

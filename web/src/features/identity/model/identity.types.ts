/** The anonymous identity model on the front end, built from the real API (`/api/sessions`, `/api/events`, `/api/recovery-code`). The server is the source of truth. */

/** A trusted device (a session that is not revoked); `at` is the last activity (milliseconds). `name` is a label the device declares itself, NOT verified. */
export interface Device {
  readonly id: string;
  readonly name: string;
  readonly at: number;
  /** This is THIS DEVICE (the calling session). */
  readonly current: boolean;
}

/** The event kind in 'Recent activity' (matches the backend's `EventKind`). */
export type EventKind = 'created' | 'code' | 'paired' | 'revoked' | 'recovered';

/** One line of 'Recent activity'; the display text is derived from `kind` in the UI layer (no wording is stored in the data). */
export interface IdentityEvent {
  readonly at: number;
  readonly kind: EventKind;
  /** The related device name (self-declared, unverified), if any. */
  readonly device?: string;
}

/** The snapshot of this device's identity taken from the server: devices, activity, the 'unseen' flag and whether there is a recovery code yet. */
export interface IdentitySnapshot {
  readonly devices: readonly Device[];
  readonly events: readonly IdentityEvent[];
  /** A new device was added (pairing/recovery) since the last time the Security screen was opened. */
  readonly unseen: boolean;
  readonly hasCode: boolean;
}

/** What was last known about the identity, to choose the session-ended screen branch when the server can no longer be called (contains no secret). */
export interface KnownIdentity {
  readonly hasCode: boolean;
  readonly deviceCount: number;
}

/** This device's own flags (no secret): just opened by recovery, and the latest known mark. */
export interface SessionState {
  /** A trip was just opened on this device by recovery (shows a reminder to check the device list). */
  readonly recovered: boolean;
  readonly known: KnownIdentity | null;
}

/** The identity state of this device. `loading`: the first load when there is already a session secret; `error`: could not load (network), NOT treated as having no identity. */
export type IdentityStatus = 'loading' | 'anonymous' | 'ready' | 'expired' | 'error';

/** A pairing request created by the NEW DEVICE (DR-018 E1): an 8-symbol pairing code + a 2-digit matching number, expiring after 5 minutes. */
export interface PairingRequest {
  readonly requestId: string;
  /** The normalized pairing code (8 symbols). */
  readonly code: string;
  readonly number: number;
  readonly name: string;
  readonly at: number;
  readonly expiresAt: number;
  /** The session secret this device generated itself; it takes effect only when the old device approves the right number. */
  readonly sessionToken: string;
}

/** The state of a pairing request according to the server. */
export type PairingStatus = 'pending' | 'approved' | 'denied' | 'expired';

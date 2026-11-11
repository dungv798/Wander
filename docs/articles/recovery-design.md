# Recovering an anonymous identity: the design behind Wander's recovery code

Wander has no accounts, no email, and no phone numbers. A person's trips belong to an anonymous identity that lives on their devices. This note explains how ownership is recovered when a device is lost, which parts are implemented and tested, and which parts are not proven yet. It is written for engineers who want to see the reasoning, not a product pitch.

Status: design approved by the product owner on 2026-10-24 (`docs/decisions/DR-001`). The security claim ("this is safe enough for real users") is **not verified** and the app is not released to real users.

## The problem

Without an account, there is nothing to "reset". If someone loses every device that holds a session, either there is a way to prove they are the owner, or the trips are gone. The design chooses explicitly:

- **No recovery without accepted evidence.** Permanent loss is an accepted outcome.
- **Evidence in the first slice is one of two things:** a recovery code the owner keeps themselves, or approval from another already-trusted device. No email or SMS.
- **One identity, many trips, one code.** The code is single-use. Generating a new one needs a valid session.

## The recovery flow

Recovery completes only after the person confirms a **replacement code**. The decisions that shape it, as recorded in DR-001:

- Re-authentication before sensitive actions uses another trusted device or the recovery code, one piece of evidence for one action, and there is no "recently authenticated" window that a later action could reuse.
- A replacement code is issued only as part of a recovery by code, and confirming it means typing it back in. A replacement that was never confirmed is never valid.
- Several attempts at the same time do not reserve anything: the first commit wins. Repeating the same attempt is idempotent.
- A pending session has no access to data until recovery completes.
- The code itself carries what is needed to find the identity. Rate limits are per source and global, never a lock on the identity. (The decision states the rule; I read the point of it as preventing an attacker from locking the real owner out, but the record does not say so.)

## Storing the code

The server never stores the code. It stores a hash, and the hash is an **HMAC-SHA-256 with a server-side secret (a "pepper")** read from the environment (`HmacRecoveryCodeHasher`):

- There is no default pepper. If it is missing, still an unresolved placeholder, or shorter than the minimum length, the application refuses to start. The error message never contains the key.
- A fresh `Mac` instance is created per hash, since `javax.crypto.Mac` is not safe to share between threads.

This replaced an earlier unkeyed SHA-256. Migration `V9` invalidated every active code at that point: the old and new hashes cannot be told apart, so an explicit "you have no code, generate one" state was judged better than a code that looks valid and never matches. Pending recoveries from before were closed so users saw "expired" rather than "wrong code".

An honest caveat recorded in the decision: a fast hash of a code is only safe if the code has enough entropy. The exact length and entropy of the code were deferred and are an open item.

## Rotating the pepper without invalidating codes

Changing a pepper must not kill every code silently.

- Each stored code, pending recovery, and pending replacement carries a `key_version` (migration `V17`, existing data labelled `v1`). The hasher holds the current key and optionally one previous key, so codes hashed with the old key still verify while new ones use the new key. Configuration is validated at startup: half-configured previous keys, or the same label for both, stop the application.
- A table `recovery_key_checks` (migration `V18`) stores a **fingerprint**: a truncated HMAC of a public constant under each key version. At startup the configured key is compared with the stored fingerprint. This catches the dangerous mistake of changing the secret value while keeping its label, which would otherwise make every old code fail with no error. The fingerprint is not used to recover the key.

`RecoveryKeyRotationIT` checks that an old-key code recovers into the current key version, and that a pending recovery, a pending replacement, and step-up evidence all survive a rotation.

## Concurrency

Two people (or one person on two devices) can present the same code at the same moment. The identity row and the recovery code row are taken with pessimistic locks while the code is consumed, so exactly one attempt wins and the other gets a clean failure. `RecoveryConcurrencyIT` races them with virtual threads released by a latch against a real PostgreSQL, for three pairings: recovery against recovery, a replacement against itself, and recovery against replacement. One Hibernate detail worth knowing: it flushes INSERT before UPDATE, so invalidating the old code before inserting the new one needs an explicit early flush when a partial unique index is involved.

## What is tested, and what is not

Tested against a real database: recovery by code (`RecoveryApiIT`), concurrent recovery (`RecoveryConcurrencyIT`), key rotation (`RecoveryKeyRotationIT`), session lifetime and security checks (`SessionLifetimeIT`, `SecurityIT`), and device pairing (`PairingMatchApiIT`).

Not proven, and the reason this is not launched:

- No written threat model with measurable "safe" criteria, and no test with real users (release gate RG-2).
- The session secret lives in `localStorage`, so a script-injection bug would expose it (RG-6).
- Backing up and restoring the pepper has not been rehearsed. Losing the pepper means losing every recovery code.
- Someone who holds a single session can pair a second one and then approve it themselves (a risk the product owner accepted in writing: DR-018 B2 and the 2026-10-27 decision F1).

## What I would take from this

- Say what you will *not* recover. Choosing permanent loss over weak evidence made the rest of the design simpler.
- Put the secret's lifecycle in the schema: a version column and a startup fingerprint turned "silent total failure" into "refuses to start".
- Test concurrency with real threads and a real database (virtual threads and a latch here); mocking the database hides exactly the bugs that matter here.

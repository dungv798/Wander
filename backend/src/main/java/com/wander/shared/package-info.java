/**
 * Shared kernel and web plumbing used by every business module (errors, constants, utilities, rate limiting, request context). It is an
 * OPEN application module: the business modules (catalog, identity, planning, rating) may use all of its packages, and it depends on
 * none of them. The business modules do not depend on each other.
 */
@ApplicationModule(type = ApplicationModule.Type.OPEN)
package com.wander.shared;

import org.springframework.modulith.ApplicationModule;

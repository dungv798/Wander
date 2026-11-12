import type { components } from './contract.generated.ts';

/**
 * Schemas of the backend API, generated from `backend/openapi.yaml` (`npm run gen:api` in the repository root). The generated file is
 * committed; CI regenerates it and fails when it differs, so these types cannot drift from the running API.
 */
export type ApiSchemas = components['schemas'];

/**
 * Member names of one API schema. Use with `satisfies` to prove at compile time that a field name the client sends or reads exists
 * in the contract: renaming a field in the backend turns the web build red instead of failing at run time.
 */
export type ApiMember<S extends keyof ApiSchemas> = keyof ApiSchemas[S] & string;

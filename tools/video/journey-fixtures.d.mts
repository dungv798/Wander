import type { BrowserContext, Page } from 'playwright-core';
export function seed(context: BrowserContext): Promise<void>;
export function mockJourney(page: Page, live?: boolean): Promise<void>;

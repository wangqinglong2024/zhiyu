/**
 * Resource catalog with eager imports.
 *
 * Trade-off: bundlers tree-shake each locale-namespace as a separate ES module
 * but they all live in the main chunk. For E04 v1 we accept that and offer
 * lazyLoad() for namespaces declared `lazy: true` (kept here as an opt-in
 * surface; concretely none are lazy yet — the JSON is small enough that the
 * extra request would dominate).
 */
import type { Namespace, UiLocale } from './index.js';

import enCommon from './locales/en/common.json' with { type: 'json' };
import enAuth from './locales/en/auth.json' with { type: 'json' };
import enMe from './locales/en/me.json' with { type: 'json' };
import enDiscover from './locales/en/discover.json' with { type: 'json' };
import enCourses from './locales/en/courses.json' with { type: 'json' };

import viCommon from './locales/vi/common.json' with { type: 'json' };
import viAuth from './locales/vi/auth.json' with { type: 'json' };
import viMe from './locales/vi/me.json' with { type: 'json' };
import viDiscover from './locales/vi/discover.json' with { type: 'json' };
import viCourses from './locales/vi/courses.json' with { type: 'json' };

import thCommon from './locales/th/common.json' with { type: 'json' };
import thAuth from './locales/th/auth.json' with { type: 'json' };
import thMe from './locales/th/me.json' with { type: 'json' };
import thDiscover from './locales/th/discover.json' with { type: 'json' };
import thCourses from './locales/th/courses.json' with { type: 'json' };

import idCommon from './locales/id/common.json' with { type: 'json' };
import idAuth from './locales/id/auth.json' with { type: 'json' };
import idMe from './locales/id/me.json' with { type: 'json' };
import idDiscover from './locales/id/discover.json' with { type: 'json' };
import idCourses from './locales/id/courses.json' with { type: 'json' };

export type ResourceBag = Partial<Record<Namespace, Record<string, unknown>>>;

export const RESOURCES: Record<UiLocale, ResourceBag> = {
  en: { common: enCommon, auth: enAuth, me: enMe, discover: enDiscover, courses: enCourses },
  vi: { common: viCommon, auth: viAuth, me: viMe, discover: viDiscover, courses: viCourses },
  th: { common: thCommon, auth: thAuth, me: thMe, discover: thDiscover, courses: thCourses },
  id: { common: idCommon, auth: idAuth, me: idMe, discover: idDiscover, courses: idCourses },
};

export const LOADED_NAMESPACES: Namespace[] = ['common', 'auth', 'me', 'discover', 'courses'];

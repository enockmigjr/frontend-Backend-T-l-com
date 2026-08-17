'use client';

import { useEffect, useState } from 'react';

export type NavigationTone = 'blue' | 'slate' | 'teal';
export type AccentColor = 'blue' | 'violet' | 'emerald' | 'orange' | 'rose';
export type DensityPreference = 'comfortable' | 'compact';
export type ControlSize = 'compact' | 'default' | 'large';
export type RadiusPreference = 'sharp' | 'default' | 'round';
export type ContentWidth = 'standard' | 'wide' | 'full';
export type SidebarStyle = 'solid' | 'soft' | 'contrast';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface InterfacePreferences {
  readonly navigationTone: NavigationTone;
  readonly accentColor: AccentColor;
  readonly density: DensityPreference;
  readonly controlSize: ControlSize;
  readonly radius: RadiusPreference;
  readonly contentWidth: ContentWidth;
  readonly sidebarStyle: SidebarStyle;
  readonly reduceMotion: boolean;
  readonly sidebarOpen: boolean;
  readonly theme: ThemePreference;
}

const storageKeyV2 = 'kamgoko.interface-preferences.v2';
const storageKeyV3 = 'kamgoko.interface-preferences.v3';
const storageKeyV4 = 'kamgoko.interface-preferences.v4';
const eventName = 'kamgoko:preferences';
const themeCookie = 'theme';
const themeCookieMaxAge = 60 * 60 * 24 * 365;
export const defaultPreferences: InterfacePreferences = {
  navigationTone: 'blue',
  accentColor: 'blue',
  density: 'comfortable',
  controlSize: 'default',
  radius: 'default',
  contentWidth: 'standard',
  sidebarStyle: 'solid',
  reduceMotion: false,
  sidebarOpen: true,
  theme: 'system',
};

export function loadPreferences(): InterfacePreferences {
  const current = readStored(storageKeyV4, isPreferences);
  if (current) return current;
  const legacy = readStored(storageKeyV3, isPreferencesV3) ?? readStored(storageKeyV2, isLegacyPreferences);
  if (legacy) {
    const migrated: InterfacePreferences = {
      ...defaultPreferences,
      ...legacy,
      theme: 'theme' in legacy ? legacy.theme : 'system',
    };
    window.localStorage.setItem(storageKeyV4, JSON.stringify(migrated));
    window.localStorage.removeItem(storageKeyV3);
    window.localStorage.removeItem(storageKeyV2);
    return migrated;
  }
  return defaultPreferences;
}

export function savePreferences(value: InterfacePreferences): void {
  window.localStorage.setItem(storageKeyV4, JSON.stringify(value));
  window.localStorage.removeItem(storageKeyV3);
  window.localStorage.removeItem(storageKeyV2);
  document.cookie = `sidebar_state=${value.sidebarOpen}; path=/; max-age=${60 * 60 * 24 * 7}`;
  document.cookie = `${themeCookie}=${value.theme}; path=/; max-age=${themeCookieMaxAge}`;
  applyPreferences(value);
  window.dispatchEvent(new CustomEvent(eventName, { detail: value }));
}

export function useInterfacePreferences() {
  const [preferences, setPreferences] = useState(defaultPreferences);
  useEffect(() => {
    const sync = () => setPreferences(loadPreferences());
    sync();
    window.addEventListener(eventName, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(eventName, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return [preferences, savePreferences] as const;
}

export function applyPreferences(value: InterfacePreferences): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = value.theme === 'dark' || (value.theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.dataset.navigationTone = value.navigationTone;
  document.documentElement.dataset.accent = value.accentColor;
  document.documentElement.dataset.density = value.density;
  document.documentElement.dataset.controlSize = value.controlSize;
  document.documentElement.dataset.radius = value.radius;
  document.documentElement.dataset.contentWidth = value.contentWidth;
  document.documentElement.dataset.sidebarStyle = value.sidebarStyle;
  document.documentElement.dataset.reduceMotion = String(value.reduceMotion);
}

export function InterfacePreferencesSync() {
  useEffect(() => {
    const apply = () => applyPreferences(loadPreferences());
    apply();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onMediaChange = () => apply();
    media.addEventListener('change', onMediaChange);
    window.addEventListener(eventName, apply);
    window.addEventListener('storage', apply);
    return () => {
      media.removeEventListener('change', onMediaChange);
      window.removeEventListener(eventName, apply);
      window.removeEventListener('storage', apply);
    };
  }, []);
  return null;
}

function readStored<T>(key: string, guard: (value: unknown) => value is T): T | null {
  const stored = window.localStorage.getItem(key);
  if (!stored) return null;
  try {
    const value: unknown = JSON.parse(stored);
    return guard(value) ? value : null;
  } catch {
    return null;
  }
}

function isPreferences(value: unknown): value is InterfacePreferences {
  if (typeof value !== 'object' || value === null) return false;
  const read = (key: string) => Reflect.get(value, key);
  return (
    ['blue', 'slate', 'teal'].includes(String(read('navigationTone'))) &&
    ['blue', 'violet', 'emerald', 'orange', 'rose'].includes(String(read('accentColor'))) &&
    ['comfortable', 'compact'].includes(String(read('density'))) &&
    ['compact', 'default', 'large'].includes(String(read('controlSize'))) &&
    ['sharp', 'default', 'round'].includes(String(read('radius'))) &&
    ['standard', 'wide', 'full'].includes(String(read('contentWidth'))) &&
    ['solid', 'soft', 'contrast'].includes(String(read('sidebarStyle'))) &&
    typeof read('reduceMotion') === 'boolean' &&
    typeof read('sidebarOpen') === 'boolean' &&
    ['light', 'dark', 'system'].includes(String(read('theme')))
  );
}

function isPreferencesV3(
  value: unknown,
): value is Omit<InterfacePreferences, 'accentColor' | 'controlSize' | 'radius' | 'contentWidth' | 'sidebarStyle'> {
  if (typeof value !== 'object' || value === null) return false;
  const read = (key: string) => Reflect.get(value, key);
  return (
    ['blue', 'slate', 'teal'].includes(String(read('navigationTone'))) &&
    ['comfortable', 'compact'].includes(String(read('density'))) &&
    typeof read('reduceMotion') === 'boolean' &&
    typeof read('sidebarOpen') === 'boolean' &&
    ['light', 'dark', 'system'].includes(String(read('theme')))
  );
}

function isLegacyPreferences(value: unknown): value is Omit<InterfacePreferences, 'theme'> {
  if (typeof value !== 'object' || value === null) return false;
  const read = (key: string) => Reflect.get(value, key);
  return (
    ['blue', 'slate', 'teal'].includes(String(read('navigationTone'))) &&
    ['comfortable', 'compact'].includes(String(read('density'))) &&
    typeof read('reduceMotion') === 'boolean' &&
    typeof read('sidebarOpen') === 'boolean'
  );
}

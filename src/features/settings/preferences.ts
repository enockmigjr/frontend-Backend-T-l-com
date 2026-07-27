'use client';

import { useEffect, useState } from 'react';

export type NavigationTone = 'blue' | 'slate' | 'teal';
export type DensityPreference = 'comfortable' | 'compact';

export interface InterfacePreferences {
  readonly navigationTone: NavigationTone;
  readonly density: DensityPreference;
  readonly reduceMotion: boolean;
  readonly sidebarOpen: boolean;
}

const storageKey = 'kamgoko.interface-preferences.v2';
const eventName = 'kamgoko:preferences';
export const defaultPreferences: InterfacePreferences = {
  navigationTone: 'blue',
  density: 'comfortable',
  reduceMotion: false,
  sidebarOpen: true,
};

export function loadPreferences(): InterfacePreferences {
  const stored = window.localStorage.getItem(storageKey);
  if (!stored) return defaultPreferences;
  try {
    const value: unknown = JSON.parse(stored);
    return isPreferences(value) ? value : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
}

export function savePreferences(value: InterfacePreferences): void {
  window.localStorage.setItem(storageKey, JSON.stringify(value));
  document.cookie = `sidebar_state=${value.sidebarOpen}; path=/; max-age=${60 * 60 * 24 * 7}`;
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
  document.documentElement.classList.remove('dark');
  document.documentElement.dataset.navigationTone = value.navigationTone;
  document.documentElement.dataset.density = value.density;
  document.documentElement.dataset.reduceMotion = String(value.reduceMotion);
}

export function InterfacePreferencesSync() {
  useEffect(() => {
    const sync = () => applyPreferences(loadPreferences());
    sync();
    window.addEventListener(eventName, sync);
    return () => {
      window.removeEventListener(eventName, sync);
    };
  }, []);
  return null;
}

function isPreferences(value: unknown): value is InterfacePreferences {
  if (typeof value !== 'object' || value === null) return false;
  const read = (key: string) => Reflect.get(value, key);
  return (
    ['blue', 'slate', 'teal'].includes(String(read('navigationTone'))) &&
    ['comfortable', 'compact'].includes(String(read('density'))) &&
    typeof read('reduceMotion') === 'boolean' &&
    typeof read('sidebarOpen') === 'boolean'
  );
}

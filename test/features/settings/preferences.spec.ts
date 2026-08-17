import {
  applyPreferences,
  defaultPreferences,
  loadPreferences,
  savePreferences,
  type InterfacePreferences,
} from '@/features/settings/preferences';

const v2Key = 'kamgoko.interface-preferences.v2';
const v3Key = 'kamgoko.interface-preferences.v3';
const v4Key = 'kamgoko.interface-preferences.v4';

function legacyPreferences(): Omit<
  InterfacePreferences,
  | 'theme'
  | 'accentColor'
  | 'controlSize'
  | 'radius'
  | 'contentWidth'
  | 'sidebarStyle'
  | 'animationStyle'
  | 'depthStyle'
  | 'fontScale'
> {
  return { navigationTone: 'teal', density: 'compact', reduceMotion: true, sidebarOpen: false };
}

function stubMatchMedia(prefersDark: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: prefersDark,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

describe('préférences d’interface', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.cookie = 'theme=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    stubMatchMedia(false);
  });

  describe('migration du stockage historique → v4', () => {
    it('lit la clé v2, écrit v4 et supprime v2', () => {
      window.localStorage.setItem(v2Key, JSON.stringify(legacyPreferences()));

      const preferences = loadPreferences();

      expect(preferences).toEqual({ ...defaultPreferences, ...legacyPreferences(), theme: 'system' });
      expect(window.localStorage.getItem(v4Key)).toBe(
        JSON.stringify({ ...defaultPreferences, ...legacyPreferences(), theme: 'system' }),
      );
      expect(window.localStorage.getItem(v2Key)).toBeNull();
    });

    it('ignore un stockage v3 invalide et migre quand même v2', () => {
      window.localStorage.setItem(v3Key, '{invalide');
      window.localStorage.setItem(v2Key, JSON.stringify(legacyPreferences()));

      expect(loadPreferences()).toEqual({ ...defaultPreferences, ...legacyPreferences(), theme: 'system' });
      expect(window.localStorage.getItem(v4Key)).not.toBeNull();
      expect(window.localStorage.getItem(v2Key)).toBeNull();
    });

    it('retourne les préférences par défaut sans stockage', () => {
      expect(loadPreferences()).toEqual(defaultPreferences);
    });
  });

  describe('résolution du thème', () => {
    it('pose la classe dark quand la préférence est sombre', () => {
      savePreferences({ ...defaultPreferences, theme: 'dark' });
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('reste clair quand le système est sombre mais la préférence est claire', () => {
      stubMatchMedia(true);
      applyPreferences({ ...defaultPreferences, theme: 'light' });
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('suit le système quand la préférence est system', () => {
      stubMatchMedia(true);
      applyPreferences({ ...defaultPreferences, theme: 'system' });
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      stubMatchMedia(false);
      applyPreferences({ ...defaultPreferences, theme: 'system' });
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('retire la classe dark quand la préférence repasse en clair', () => {
      savePreferences({ ...defaultPreferences, theme: 'dark' });
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      savePreferences({ ...defaultPreferences, theme: 'light' });
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  it('projette les personnalisations vers les attributs du document', () => {
    applyPreferences({
      ...defaultPreferences,
      accentColor: 'violet',
      controlSize: 'large',
      radius: 'round',
      contentWidth: 'wide',
      sidebarStyle: 'contrast',
      animationStyle: 'expressive',
      depthStyle: 'elevated',
      fontScale: 'large',
    });

    expect(document.documentElement.dataset).toMatchObject({
      accent: 'violet',
      controlSize: 'large',
      radius: 'round',
      contentWidth: 'wide',
      sidebarStyle: 'contrast',
      animationStyle: 'expressive',
      depthStyle: 'elevated',
      fontScale: 'large',
    });
  });

  it('complète une préférence v4 sans les nouvelles options', () => {
    window.localStorage.setItem(
      v4Key,
      JSON.stringify({
        ...defaultPreferences,
        animationStyle: undefined,
        depthStyle: undefined,
        fontScale: undefined,
      }),
    );
    const stored = JSON.parse(window.localStorage.getItem(v4Key) ?? '{}') as Record<string, unknown>;
    delete stored.animationStyle;
    delete stored.depthStyle;
    delete stored.fontScale;
    window.localStorage.setItem(v4Key, JSON.stringify(stored));

    expect(loadPreferences()).toEqual(defaultPreferences);
  });

  describe('persistance', () => {
    it('écrit v3, retire v2 et pose le cookie theme', () => {
      savePreferences({ ...defaultPreferences, theme: 'dark' });

      expect(window.localStorage.getItem(v4Key)).toBe(JSON.stringify({ ...defaultPreferences, theme: 'dark' }));
      expect(document.cookie).toContain('theme=dark');
      expect(document.cookie).toContain('sidebar_state=true');
    });

    it('pose le cookie theme=system par défaut', () => {
      savePreferences(defaultPreferences);
      expect(document.cookie).toContain('theme=system');
    });
  });
});

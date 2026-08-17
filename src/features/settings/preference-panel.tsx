'use client';

import { CircleDot, Moon, Monitor, PanelLeft, RadioTower, RotateCcw, Sparkles, Sun, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  type DensityPreference,
  type AccentColor,
  type ControlSize,
  type ContentWidth,
  type NavigationTone,
  type RadiusPreference,
  type SidebarStyle,
  type ThemePreference,
  defaultPreferences,
  useInterfacePreferences,
} from './preferences';

const tones: readonly { value: NavigationTone; label: string; icon: typeof RadioTower }[] = [
  { value: 'blue', label: 'Bleu', icon: RadioTower },
  { value: 'slate', label: 'Ardoise', icon: CircleDot },
  { value: 'teal', label: 'Turquoise', icon: Waves },
];

const themes: readonly { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'system', label: 'Système', icon: Monitor },
];
const accents: readonly { value: AccentColor; label: string; className: string }[] = [
  { value: 'blue', label: 'Bleu', className: 'bg-blue-600' },
  { value: 'violet', label: 'Violet', className: 'bg-violet-600' },
  { value: 'emerald', label: 'Émeraude', className: 'bg-emerald-600' },
  { value: 'orange', label: 'Orange', className: 'bg-orange-600' },
  { value: 'rose', label: 'Rose', className: 'bg-rose-600' },
];

export function PreferencePanel() {
  const [preferences, save] = useInterfacePreferences();
  const update = (patch: Partial<typeof preferences>) => save({ ...preferences, ...patch });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Thème de l’interface</CardTitle>
          <CardDescription>Le mode sombre améliore le confort en environnement peu éclairé.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={preferences.theme || 'system'}
            onValueChange={(value) => {
              if (isTheme(value)) update({ theme: value });
            }}
            className="grid-cols-1 sm:grid-cols-3"
          >
            {themes.map(({ value, label, icon: Icon }) => (
              <label
                key={value}
                className="preference-option flex cursor-pointer items-center gap-2 rounded-lg border p-3"
              >
                <RadioGroupItem value={value} />
                <Icon className="size-4" />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Couleur d’accent</CardTitle>
          <CardDescription>Appliquée aux boutons, liens, focus et éléments actifs.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {accents.map((accent) => (
              <button
                key={accent.value}
                type="button"
                aria-pressed={preferences.accentColor === accent.value}
                onClick={() => update({ accentColor: accent.value })}
                className="flex min-h-16 flex-col items-center justify-center gap-2 rounded-lg border p-2 text-xs font-medium transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-primary/30"
              >
                <span className={`size-5 rounded-full ${accent.className}`} aria-hidden />
                {accent.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Couleur de navigation</CardTitle>
          <CardDescription>Modifie uniquement la sidebar et la topbar.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={preferences.navigationTone || 'blue'}
            onValueChange={(value) => {
              if (isNavigationTone(value)) update({ navigationTone: value });
            }}
            className="grid-cols-1 sm:grid-cols-3"
          >
            {tones.map(({ value, label, icon: Icon }) => (
              <label
                key={value}
                className="preference-option flex cursor-pointer items-center gap-2 rounded-lg border p-3"
              >
                <RadioGroupItem value={value} />
                <Icon className="size-4" />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Dimensions de l’interface</CardTitle>
          <CardDescription>Adaptez les contrôles, les angles et la largeur de lecture.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <ChoiceGroup
            label="Taille des contrôles"
            value={preferences.controlSize}
            options={[
              ['compact', 'Compacte'],
              ['default', 'Standard'],
              ['large', 'Grande'],
            ]}
            onChange={(value) => isControlSize(value) && update({ controlSize: value })}
          />
          <ChoiceGroup
            label="Angles"
            value={preferences.radius}
            options={[
              ['sharp', 'Carrés'],
              ['default', 'Doux'],
              ['round', 'Arrondis'],
            ]}
            onChange={(value) => isRadius(value) && update({ radius: value })}
          />
          <ChoiceGroup
            label="Largeur"
            value={preferences.contentWidth}
            options={[
              ['standard', 'Standard'],
              ['wide', 'Large'],
              ['full', 'Pleine largeur'],
            ]}
            onChange={(value) => isContentWidth(value) && update({ contentWidth: value })}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Style de sidebar</CardTitle>
          <CardDescription>Choisissez le contraste de la navigation.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChoiceGroup
            label="Apparence"
            value={preferences.sidebarStyle}
            options={[
              ['solid', 'Unie'],
              ['soft', 'Douce'],
              ['contrast', 'Contrastée'],
            ]}
            onChange={(value) => isSidebarStyle(value) && update({ sidebarStyle: value })}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Densité d’information</CardTitle>
          <CardDescription>Choisissez l’espacement des tableaux et des cartes.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={preferences.density || 'comfortable'}
            onValueChange={(value) => {
              if (isDensity(value)) update({ density: value });
            }}
            className="grid-cols-1 sm:grid-cols-2"
          >
            {(['comfortable', 'compact'] as const).map((value) => (
              <label key={value} className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 has-data-checked:border-blue-500 has-data-checked:bg-blue-50 dark:has-data-checked:bg-blue-950/30">
                <RadioGroupItem value={value} />
                <span className="text-sm font-medium">{value === 'comfortable' ? 'Confortable' : 'Compacte'}</span>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
      <PreferenceSwitch
        icon={PanelLeft}
        title="Sidebar ouverte par défaut"
        description="Appliqué à la prochaine navigation ou actualisation."
        checked={preferences.sidebarOpen}
        onCheckedChange={(checked) => update({ sidebarOpen: checked })}
      />
      <PreferenceSwitch
        icon={Sparkles}
        title="Réduire les animations"
        description="Limite immédiatement transitions et mouvements."
        checked={preferences.reduceMotion}
        onCheckedChange={(checked) => update({ reduceMotion: checked })}
      />
      <div className="flex justify-end lg:col-span-2">
        <Button variant="outline" onClick={() => save(defaultPreferences)}>
          <RotateCcw />Rétablir les préférences
        </Button>
      </div>
    </div>
  );
}

function isNavigationTone(value: unknown): value is NavigationTone {
  return value === 'blue' || value === 'slate' || value === 'teal';
}

function isControlSize(value: unknown): value is ControlSize {
  return ['compact', 'default', 'large'].includes(String(value));
}
function isRadius(value: unknown): value is RadiusPreference {
  return ['sharp', 'default', 'round'].includes(String(value));
}
function isContentWidth(value: unknown): value is ContentWidth {
  return ['standard', 'wide', 'full'].includes(String(value));
}
function isSidebarStyle(value: unknown): value is SidebarStyle {
  return ['solid', 'soft', 'contrast'].includes(String(value));
}

function isDensity(value: unknown): value is DensityPreference {
  return value === 'comfortable' || value === 'compact';
}

function isTheme(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function PreferenceSwitch({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
}: Readonly<{
  icon: typeof RadioTower;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}>) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-muted p-2">
            <Icon className="size-4" />
          </span>
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={title} />
      </CardContent>
    </Card>
  );
}

function ChoiceGroup({
  label,
  value,
  options,
  onChange,
}: Readonly<{
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (value: string) => void;
}>) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="grid gap-1.5">
        {options.map(([option, optionLabel]) => (
          <button
            key={option}
            aria-pressed={value === option}
            type="button"
            onClick={() => onChange(option)}
            className="flex cursor-pointer items-center gap-2 rounded-lg border p-2 aria-pressed:border-primary aria-pressed:bg-primary/5"
          >
            <span
              aria-hidden
              className={`grid size-4 place-items-center rounded-full border ${value === option ? 'border-primary bg-primary' : 'border-input'}`}
            >
              {value === option ? <span className="size-1.5 rounded-full bg-primary-foreground" /> : null}
            </span>
            <span className="text-xs font-medium">{optionLabel}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

'use client';

import { CircleDot, PanelLeft, RadioTower, Sparkles, Waves } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  type DensityPreference,
  type NavigationTone,
  useInterfacePreferences,
} from './preferences';

const tones: readonly { value: NavigationTone; label: string; icon: typeof RadioTower }[] = [
  { value: 'blue', label: 'Bleu', icon: RadioTower },
  { value: 'slate', label: 'Ardoise', icon: CircleDot },
  { value: 'teal', label: 'Turquoise', icon: Waves },
];

export function PreferencePanel() {
  const [preferences, save] = useInterfacePreferences();
  const update = (patch: Partial<typeof preferences>) => save({ ...preferences, ...patch });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
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
              <label key={value} className="navigation-tone-option flex cursor-pointer items-center gap-2 rounded-lg border p-3">
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
    </div>
  );
}

function isNavigationTone(value: unknown): value is NavigationTone {
  return value === 'blue' || value === 'slate' || value === 'teal';
}

function isDensity(value: unknown): value is DensityPreference {
  return value === 'comfortable' || value === 'compact';
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
          <span className="rounded-lg bg-muted p-2"><Icon className="size-4" /></span>
          <div><p className="font-medium">{title}</p><p className="text-sm text-muted-foreground">{description}</p></div>
        </div>
        <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={title} />
      </CardContent>
    </Card>
  );
}

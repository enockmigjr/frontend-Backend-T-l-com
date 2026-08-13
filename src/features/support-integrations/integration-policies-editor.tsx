'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { ticketsApi } from '@/features/tickets/api';

const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const severities = ['S1', 'S2', 'S3', 'S4'] as const;
const priorityLabels: Record<string, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  CRITICAL: 'Critique',
};

type Route = { priority: string; severity: string; departmentId: string; teamId: string };
type Routing = {
  allowedCategoryIds?: unknown;
  services?: unknown;
  defaultRoute?: unknown;
  categoryRoutes?: unknown;
};
type Quota = { attachmentMaxBytes?: unknown };

const emptyRoute = (): Route => ({ priority: '', severity: '', departmentId: '', teamId: '' });

function routeFrom(value: unknown): Route {
  if (!value || typeof value !== 'object') return emptyRoute();
  const record = value as Record<string, unknown>;
  return {
    priority: typeof record.priority === 'string' ? record.priority : '',
    severity: typeof record.severity === 'string' ? record.severity : '',
    departmentId: typeof record.departmentId === 'string' ? record.departmentId : '',
    teamId: typeof record.assignedTeamId === 'string' ? record.assignedTeamId : '',
  };
}

function filledRoute(route: Route): Route | null {
  if (!route.priority && !route.severity && !route.departmentId && !route.teamId) return null;
  return { ...route };
}

function selectClass(value: string): string {
  return `h-9 rounded-lg border bg-background px-2 text-sm ${value ? '' : 'text-muted-foreground'}`;
}

function RouteFields({
  route,
  departments,
  onChange,
  compact = false,
}: Readonly<{
  route: Route;
  departments: ReadonlyArray<{ id: string; name: string }>;
  onChange: (route: Route) => void;
  compact?: boolean;
}>) {
  const options = (current: string) => (
    <>
      <option value="">—</option>
      {departments.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
      {current && !departments.some((item) => item.id === current) ? (
        <option value={current}>{current}</option>
      ) : null}
    </>
  );
  return (
    <div className={`grid gap-2 ${compact ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 xl:grid-cols-4'}`}>
      <label className="grid gap-1 text-xs text-muted-foreground">
        Priorité
        <select
          className={selectClass(route.priority)}
          value={route.priority}
          onChange={(event) => onChange({ ...route, priority: event.target.value })}
        >
          <option value="">—</option>
          {priorities.map((value) => (
            <option key={value} value={value}>
              {priorityLabels[value]}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        Sévérité
        <select
          className={selectClass(route.severity)}
          value={route.severity}
          onChange={(event) => onChange({ ...route, severity: event.target.value })}
        >
          <option value="">—</option>
          {severities.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        Département
        <select
          className={selectClass(route.departmentId)}
          value={route.departmentId}
          onChange={(event) => onChange({ ...route, departmentId: event.target.value })}
        >
          {options(route.departmentId)}
        </select>
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        Équipe assignée
        <select
          className={selectClass(route.teamId)}
          value={route.teamId}
          onChange={(event) => onChange({ ...route, teamId: event.target.value })}
        >
          {options(route.teamId)}
        </select>
      </label>
    </div>
  );
}

/**
 * Éditeurs structurés pour les politiques d'intégration : routage (catégories
 * autorisées, route par défaut, routes par catégorie, services) et quotas
 * (taille max de pièce jointe). Aucun JSON ni saisie clé/valeur.
 */
export function IntegrationPoliciesEditor({
  routingInitial,
  quotaInitial,
}: Readonly<{ routingInitial?: Routing; quotaInitial?: Quota }>) {
  const departments = useQuery({ queryKey: ['departments'], queryFn: ticketsApi.departments });
  const categories = useQuery({ queryKey: ['categories'], queryFn: ticketsApi.categories });
  const depts = departments.data ?? [];
  const cats = categories.data ?? [];

  const [allowed, setAllowed] = useState<string[]>(() =>
    Array.isArray(routingInitial?.allowedCategoryIds)
      ? (routingInitial.allowedCategoryIds as string[])
      : [],
  );
  const [services, setServices] = useState(() =>
    Array.isArray(routingInitial?.services) ? (routingInitial.services as string[]).join(', ') : '',
  );
  const [defaultRoute, setDefaultRoute] = useState<Route>(() => routeFrom(routingInitial?.defaultRoute));
  const [categoryRoutes, setCategoryRoutes] = useState<Record<string, Route>>(() => {
    const initial = routingInitial?.categoryRoutes;
    if (!initial || typeof initial !== 'object') return {};
    const result: Record<string, Route> = {};
    for (const [categoryId, value] of Object.entries(initial as Record<string, unknown>)) {
      result[categoryId] = routeFrom(value);
    }
    return result;
  });
  const [maxBytes, setMaxBytes] = useState(() =>
    typeof quotaInitial?.attachmentMaxBytes === 'number' ? String(quotaInitial.attachmentMaxBytes) : '',
  );

  const defaultFilled = filledRoute(defaultRoute);
  const categoryRoutesFilled: Record<string, Route> = {};
  for (const categoryId of allowed) {
    const route = filledRoute(categoryRoutes[categoryId] ?? emptyRoute());
    if (route) categoryRoutesFilled[categoryId] = route;
  }
  const routingJson = JSON.stringify({
    allowedCategoryIds: allowed,
    services: services
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    ...(defaultFilled ? { defaultRoute: defaultFilled } : {}),
    ...(Object.keys(categoryRoutesFilled).length > 0 ? { categoryRoutes: categoryRoutesFilled } : {}),
  });
  const quotaJson = JSON.stringify({
    ...(maxBytes.trim() !== '' && Number(maxBytes) > 0 ? { attachmentMaxBytes: Number(maxBytes) } : {}),
  });

  const toggleCategory = (categoryId: string) => {
    setAllowed((current) =>
      current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId],
    );
  };

  return (
    <div className="grid gap-4">
      <fieldset className="grid gap-2 rounded-lg border p-3">
        <legend className="px-1 text-xs font-medium text-muted-foreground">
          Catégories autorisées pour le routage
        </legend>
        {cats.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucune catégorie disponible.</p>
        ) : (
          <div className="grid gap-1 sm:grid-cols-2">
            {cats.map((item) => (
              <label key={item.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={allowed.includes(item.id)}
                  onChange={() => toggleCategory(item.id)}
                  className="size-4 accent-blue-700"
                />
                {item.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Services concernés (séparés par des virgules, optionnel)</span>
        <Input className="h-9" value={services} onChange={(event) => setServices(event.target.value)} placeholder="ticketing, bot" />
      </label>

      <fieldset className="grid gap-3 rounded-lg border p-3">
        <legend className="px-1 text-xs font-medium text-muted-foreground">Route par défaut</legend>
        <RouteFields route={defaultRoute} departments={depts} onChange={setDefaultRoute} />
      </fieldset>

      {allowed.length > 0 ? (
        <fieldset className="grid gap-3 rounded-lg border p-3">
          <legend className="px-1 text-xs font-medium text-muted-foreground">Routes par catégorie</legend>
          {allowed.map((categoryId) => {
            const category = cats.find((item) => item.id === categoryId);
            const route = categoryRoutes[categoryId] ?? emptyRoute();
            return (
              <div key={categoryId} className="grid gap-1">
                <p className="text-sm font-medium">{category?.name ?? categoryId}</p>
                <RouteFields
                  compact
                  route={route}
                  departments={depts}
                  onChange={(next) => setCategoryRoutes((current) => ({ ...current, [categoryId]: next }))}
                />
              </div>
            );
          })}
        </fieldset>
      ) : null}

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Taille maximale de pièce jointe (octets, optionnel)</span>
        <Input
          type="number"
          min={1}
          className="h-9"
          value={maxBytes}
          onChange={(event) => setMaxBytes(event.target.value)}
          placeholder="10485760"
        />
      </label>

      <input type="hidden" name="routingPolicy" value={routingJson} />
      <input type="hidden" name="quotaPolicy" value={quotaJson} />
    </div>
  );
}

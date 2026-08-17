# Phase 01 — Tokens et préférences

## Statut

- À valider ; aucune implémentation commencée.

## Contexte

Les préférences actuelles gèrent le thème, trois tonalités de navigation, deux densités, la motion et l’état de sidebar. Les couleurs principales, rayons, tailles de contrôles et largeur de contenu restent codés dans les tokens globaux ou les classes des composants.

## Vue d’ensemble

Étendre le modèle avec des unions strictes et un schéma de migration, puis projeter chaque choix validé vers des attributs `data-*` et variables CSS sur `html`.

## Fichiers

- Modifier : `src/features/settings/preferences.ts`, `src/app/globals.css`.
- Tests : `test/features/settings/preferences.spec.ts`.

## Étapes et gates

1. Ajouter les unions allowlistées : palette d’accent, taille (`sm/default/lg`), rayon (`sharp/default/round`), largeur (`standard/wide`) et éventuels modes sidebar.
2. Passer la clé de stockage à une version ultérieure avec migration des préférences existantes.
3. Valider les données chargées avant application ; ignorer toute valeur inconnue et retomber sur les défauts.
4. Exposer les attributs DOM et variables CSS correspondants, sans concaténer de CSS fourni par l’utilisateur.
5. Définir les tokens clair/sombre et les règles de densité/taille/rayon pour les composants partagés.

## Tests et critères de succès

- [ ] Anciennes préférences migrées sans perte.
- [ ] Valeurs invalides rejetées.
- [ ] `applyPreferences` pose les attributs attendus et le thème système reste réactif.
- [ ] Les tokens changent effectivement les couleurs, tailles et rayons via le DOM.

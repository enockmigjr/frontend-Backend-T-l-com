# Phase 02 — Composants et Settings

## Statut

- À valider ; aucune implémentation commencée.

## Vue d’ensemble

Faire consommer les tokens par les primitives et ajouter dans l’onglet Interface des contrôles lisibles, immédiatement prévisualisés et réinitialisables.

## Fichiers

- Modifier : `src/features/settings/preference-panel.tsx`, `src/features/settings/settings-page.tsx` si nécessaire.
- Modifier les primitives : `src/components/ui/button.tsx`, `input.tsx`, `select.tsx`, `card.tsx`, `table.tsx`, `dialog.tsx`, `skeleton.tsx`, `sidebar.tsx`, `panel.tsx`.
- Modifier les layouts/pages qui ont des tailles ou surfaces codées en dur après inventaire ciblé.

## Étapes et gates

1. Ajouter des variantes de taille/rayon via attributs ou classes tokenisées, sans casser les API existantes des composants.
2. Remplacer les couleurs de marque codées en dur dans les primitives par les tokens sémantiques.
3. Ajouter les contrôles Settings : thème, accent, navigation, densité, taille des contrôles, rayon, largeur de contenu, sidebar et motion.
4. Donner à chaque contrôle un label, une description, un état sélectionné et un reset accessible.
5. Vérifier les petits écrans : grilles empilées, tableaux scrollables, actions non tronquées et modales utilisables au clavier.

## Tests et critères de succès

- [ ] Chaque option modifie l’aperçu sans rechargement.
- [ ] Les boutons, champs, cartes, tableaux, modales, sidebar et skeletons reflètent les tokens.
- [ ] Le reset restaure exactement les defaults.
- [ ] Aucun composant ne reçoit une classe ou une valeur CSS arbitraire issue du stockage.

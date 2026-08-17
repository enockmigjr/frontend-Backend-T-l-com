# Phase 03 — Validation et revue

## Statut

- À valider ; aucune implémentation commencée.

## Étapes

1. Ajouter ou étendre les tests unitaires des préférences et des composants critiques.
2. Lancer `pnpm lint`, `pnpm typecheck`, `pnpm test -- --runInBand` et `pnpm build`.
3. Vérifier les scénarios responsive et clair/sombre avec Playwright si l’environnement permet une session authentifiée ; sinon distinguer clairement la preuve statique de la preuve navigateur.
4. Relire le diff sous l’angle sécurité, accessibilité, SSR/hydratation et régression des préférences existantes.
5. Stager explicitement uniquement les fichiers de ce chantier et créer un commit conventionnel.

## Gates absolues

- Aucun succès E2E ne sera annoncé sans exécution réelle.
- Aucun fichier modifié avant validation des phases précédentes.
- Les fichiers préexistants du worktree restent hors commit.

## Preuves de clôture

- Résultats des commandes consignés.
- Diff staged audité et commit hash confirmé.

# Plan — Design system et personnalisation de l’interface

## Statut

- État : audit lecture seule terminé ; implémentation non commencée.
- Design source : composants `src/components/ui/`, tokens `src/app/globals.css`, préférences `src/features/settings/preferences.ts`.
- Mode : chantier substantiel avec revue adversariale avant implémentation.
- Dépôt : `frontend/` uniquement.

## Objectif

Permettre une interface interne cohérente, responsive et personnalisable depuis Settings, au-delà du simple couple clair/sombre.

## Décisions d’exécution

1. Utiliser les variables CSS natives et les tokens Tailwind existants ; aucun préprocesseur supplémentaire sans besoin démontré.
2. Centraliser les choix dans `InterfacePreferences` : couleur d’accent, tonalité de navigation, densité, taille des contrôles, rayon, largeur de contenu, sidebar, motion et thème.
3. Persister localement avec migration versionnée, synchronisation entre onglets, cookie de thème SSR et valeurs par défaut sûres.
4. Exposer uniquement des palettes et valeurs allowlistées ; aucune saisie CSS arbitraire, URL, classe ou HTML provenant de l’utilisateur.
5. Les composants UI consomment les tokens (`primary`, `background`, `card`, `input`, `sidebar`, espacements/rayons) et gardent des variantes explicites.

## Séquence

1. [Phase 01 — tokens et préférences](./phase-01-tokens-preferences.md)
2. [Phase 02 — composants et Settings](./phase-02-composants-settings.md)
3. [Phase 03 — validation et revue](./phase-03-validation.md)

## Chemin critique

`Tokens/préférences → composants → Settings → tests/build`

## Gates absolues

- Aucun style arbitraire ou valeur non validée ne peut atteindre le DOM.
- Les préférences restent compatibles avec les anciens stockages et le rendu SSR initial.
- Chaque contrôle personnalisable conserve focus visible, contraste, clavier et responsive.
- Aucun contrat backend ni endpoint nouveau n’est nécessaire pour les préférences locales.
- Lint, typecheck, tests et build doivent être verts avant commit.

## Décisions requises avant production

- Validation utilisateur du présent plan avant toute modification de code.
- Confirmer que les personnalisations sont personnelles/locales et ne doivent pas être administrées par le backend.

## Preuves de clôture

- Settings permet de modifier et réinitialiser les options prévues avec aperçu immédiat.
- Les tokens sont consommés par les primitives bouton, champ, carte, tableau, sidebar, modal, skeleton et pagination.
- Les tests couvrent migration, validation, application DOM et reset ; build de production réussi.
- Le commit ne contient que les fichiers de ce chantier.

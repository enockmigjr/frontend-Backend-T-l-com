# Revue adversariale — Design system et personnalisation

## Verdict initial

PAS PRÊT à implémenter avant validation utilisateur du plan.

## P0 détectés et résolution

- Aucun P0 technique détecté dans le périmètre audité : l’architecture actuelle dispose déjà de tokens CSS, d’un stockage local versionné et d’un synchroniseur client.

## P1 détectés et résolution intégrée

1. **Contraste et saisie CSS arbitraire** — la personnalisation pourrait rendre l’interface illisible ou injecter du style ; le plan impose des unions allowlistées, des tokens sémantiques et des contrôles bornés en phases 01 et 02.
2. **Hydratation SSR** — le choix local n’est pas connu au premier rendu ; le plan conserve le cookie de thème côté serveur et limite les autres projections au synchroniseur client, avec test de migration/application en phase 01.
3. **Régression des composants existants** — les primitives ont des API déjà consommées ; la phase 02 impose des variantes additives et la phase 03 exige lint, typecheck, tests et build.
4. **Responsive incomplet** — les nouveaux réglages peuvent agrandir ou réduire les contrôles ; la phase 02 impose la vérification petits écrans et la phase 03 distingue l’E2E réellement exécuté.
5. **Mauvais périmètre backend** — aucune route système ne doit être inventée pour des préférences personnelles ; le plan fixe la persistance locale et interdit l’extension de contrat.

## Seconde lecture

Le plan couvre les validations de données, SSR, compatibilité des composants, accessibilité, responsive, tests et périmètre Git. Aucune dépendance backend ou donnée métier n’est introduite.

## Verdict final

PRÊT sous réserve de l’approbation explicite de l’utilisateur ; ensuite seulement l’implémentation pourra commencer.


# V21 — DLC Motards et reprise des visuels

Cette version contient toutes les améliorations gameplay/performance précédentes, le DLC Motards et le boss final **Gaz na Gaz — le Baron de l'Asphalte**.

## Visuels
- Le choix Kino validé est inclus dans `assets/img/boss_kino.jpg` comme référence.
- Le moteur attend les fichiers finaux `boss_kino.webp`, `boss_sape.webp` et `boss_asphalte.webp`.
- S'ils manquent, un monogramme néon s'affiche à la place : aucune image cassée.
- Voir `DLC_MOTARDS_ASSETS_A_FINALISER.md` pour les prompts et noms de fichiers.

## Tests de reprise
1. Ouvrir le projet extrait avec un serveur local.
2. Terminer la campagne de base : les trois niveaux DLC sont ajoutés après la Gombe.
3. Jouer les bases R2K et Motard Beaugard, puis la Traversée.
4. Vérifier les cartes de boss : fallback néon tant que les webp ne sont pas installés.

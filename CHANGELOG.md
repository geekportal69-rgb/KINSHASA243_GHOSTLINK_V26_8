# CHANGELOG — KINSHASA 243 / GHOSTLINK

## V26.8 — 2026-10-13 — Enemy Tactics / AI Fairness

- Huit profils d'IA spécialisés, distances d'attaque et rôles uniques avec les MOVES existants.
- Jetons d'attaque avec expiration et restitution sur interruption/KO/fin de coup ; drones également régulés.
- Esquive de boxeuse contrôlée par délai, changements de déplacement selon le type ; zéro création de tableau dans la sélection des attaques.
- Tests de rôles, concurrence, reprise et 30 étapes ; pas de mesure FPS ou certification visuelle sur PC/mobile.
- Pas de suppression des niveaux, graphismes ou crédits antérieurs ; code réalisé par OpenAI GPT-6 (ChatGPT), démarche de revue issue du brief de Claude.

## V26.7 — 2026-10-13 — Hero Combat Identity

- Ajout des profils de cadence et de réaction de Kabongo, Nzinga et Makasi dans `js/data.js`.
- Mise en mémoire différenciée des enchaînements, cancel de coups normaux uniquement après un impact confirmé et après la récupération minimale propre au héros (`js/game.js`).
- Différenciation du recul et de l'étourdissement des héros, sans toucher aux ennemis ni aux chiffres de dégâts initiaux.
- Anticipations, impacts, retour en garde et respiration par héros dans le rendu illustré (`js/sprites.js`). Correction de l'anticipation manquante des attaques de marteau/hache de Makasi.
- Indication du style de combat à la sélection (`js/ui.js`), test `tools/test_v26_7.js`, historique et crédits préservés.
- Tests : suites V26–V26.7 et vérification statique `file://`; rendu navigateur, performances et périphériques physiques non validés.

## V26.6 — 2026-10-13 — Combat & Physics

- SAUT mémorisé à l'atterrissage sans consommer le double saut de façon involontaire.
- Actions pressées pendant le hitstop conservées jusqu'au retour de la simulation.
- Détection des fenêtres de frappe traversées par un pas plus long.
- Hitboxes des boss colosses corrigées en profondeur et en hauteur.
- Allocations de tableaux réduites dans les timers et l'interpolation.
- Suite de tests `tools/test_v26_6.js` et documentation de limites, crédits préservés.


## V26.5 — 2026-10-13 — Contrôles et interaction

- Correction sprint lors des inversions de direction.
- Nouvelle action RAMASSER sur clavier/manette/tactile ; COUP n'a plus de priorité de ramassage.
- Ciblage déterministe de l'arme la plus proche ; anti-double ramassage.
- Suppression de 3 comptages d'IA produisant des tableaux temporaires.
- Diagnostic des fichiers image manquants et métadonnées de version synchronisées.
- Nouveaux tests de non-régression des entrées et vérification statique du lancement local.
- Crédits historiques préservés. Contributeur : GPT-6 (OpenAI) ; proposition technique externe : Claude (Anthropic).

## V26.4 — 2026-10-13 — Routes Vivantes

- Barrages destructibles Kenge, garage Carly protégé par embuscade et motards alliés de décor.

## V26.3 — 2026-10-13 — Traversée

- Phases Joe-Vally Déchu, balises Val Industries et conditions de victoire du DLC.

## V26.2 — 2026-10-13 — Progression

- Records, médailles et import/export de progression.

## V26.1 — 2026-10-13 — Restauration combat

- Coup chargé et finisher 8+.

## V26 — 2026-10-13 — Reconstruction

- Consolidation V12.4 + Traversée V24 : 24 communes et 6 étapes DLC.

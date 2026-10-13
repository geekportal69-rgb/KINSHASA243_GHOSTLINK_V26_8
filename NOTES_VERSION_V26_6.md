# KINSHASA 243 : GHOSTLINK — V26.6 Combat & Physics

**13 octobre 2026 — BÊTA de consolidation, pas une édition finale.** Base : `KINSHASA243_GHOSTLINK_V26_5_COMMANDES_ET_INTERACTIONS_BETA.zip`. Code précédent conservé dans son archive d'origine. Auteur de cette passe : **OpenAI GPT-6 (ChatGPT)** ; stratégie et priorités d'audit proposées par **Claude (Anthropic)**. Autres contributions et crédits historiques inchangés.

## Correctifs appliqués dans le moteur

1. **SAUT anticipé en fin de chute** (`js/game.js`) : la pression SAUT jusqu'à 0,18 seconde avant le contact est mémorisée lorsque le héros descend à moins de 18 unités de hauteur. Après l'atterrissage, le saut démarre ; le double saut volontaire en altitude reste disponible. Ce n'est pas un « coyote time » de plateforme : GHOSTLINK utilise une piste continue sans bords de plateforme dans sa conception actuelle.
2. **Entrées perdues pendant le hitstop** (`js/game.js`) : le gel de simulation récupère désormais les nouveaux appuis clavier, tactile ou manette (priorité dash > attaque arrière > saut > spécial > coup), puis exécute l'action lorsque la simulation reprend. COUP en mode « charge manuelle » n'est pas converti en frappe instantanée. Un appui sur RAMASSER est également mémorisé pendant le gel. Les commandes ne sont pas mises en tampon dans les états mort, relevé, étoile ou réapparition.
3. **Fenêtres d'attaque traversées par un grand pas de temps** (`js/game.js`) : une frappe est active si l'intervalle de simulation intersecte la fenêtre du mouvement, même lorsque l'instant de simulation saute entièrement la fenêtre `[act[0],act[1]]`. Une attaque normale ne touche toujours qu'une fois chaque cible.
4. **Collisions contre les colosses** (`js/game.js`) : réintroduction d'un contrôle sur la profondeur de combat et la plage verticale. Les frappes circulaires restent reconnues derrière la cible et la marge horizontale reste plus généreuse que pour un ennemi ordinaire.
5. **Allocations par pas** (`js/game.js`) : suppression de `players.concat(enemies)` dans les timers, et mémorisation par niveau de la liste des groupes d'interpolation. Cette passe réduit les allocations mais **ne prouve pas** un fonctionnement sans aucune allocation dans toutes les autres routines du moteur.
6. **Métadonnées & transmission** : numéro 26.6, documentation, journal des contributeurs, tests additionnels, nouvelle empreinte de cache PWA.

## Tests réellement exécutés

```bash
node tools/validate_v26.js
node tools/test_v26_1.js
node tools/test_v26_2.js
node tools/test_v26_3.js
node tools/test_v26_4.js
node tools/test_v26_5.js
node tools/test_v26_6.js
node tools/verify_file_launch_v26_5.js
```

Le test spécifique V26.6 couvre la pression SAUT avant l'atterrissage, le double saut en altitude, le tampon d'entrée pendant le hitstop, la priorité DASH sur SAUT, le coup chargé manuel, les frappes aux fenêtres actives de 0,02 s, la géométrie des colosses et le cache d'interpolation. Il rejoue également **90 cycles de simulation pour chacune des 30 étapes**. Les 7 tests historiques et la vérification statique de `file://` restent exécutables.

## Limites et contrôles humains restants

- **Pas de test réel** du rendu, d'une partie complète, du gamepad physique, du tactile Android, de l'installation Windows en double-cliquant sur `index.html`, ou des FPS en conditions de jeu.
- Les 25 boss n'ont pas encore des mouvements tous distincts ; le DLC comporte six étapes codées, huit étapes du GDD restant à concevoir et implémenter ; les sprites/sons spécifiques du DLC ne sont pas finalisés.
- Le tampon de hitstop gère une action prioritaire, pas une longue file de commandes : les joueurs ne peuvent pas programmer une chaîne entière pendant un seul gel d'impact.
- Les optimisations portent sur quelques routines identifiées, pas sur un profiling complet.
- Les sauvegardes `v12.*`, l'import/export, les 24 communes, le DLC et les crédits existants sont inchangés.

## Démarrer

Décompresser **tout** le dossier ZIP. Essayer de double-cliquer sur `index.html` dans le dossier extrait (chargement local `file://` prévu, non certifié sous Windows) ; ou lancer un serveur HTTP statique, par exemple `python -m http.server 8086` depuis ce dossier, puis ouvrir `http://localhost:8086/?nosw`. Attention : les sauvegardes du navigateur sont séparées par port/origine ; exporter avant de changer de port.

# KINSHASA 243 : GHOSTLINK — Notes de version V26.4

Date : 13 octobre 2026. Contributeur : OpenAI GPT-6 (ChatGPT).
Branche parente : **V26.3 Traversée bêta**, intégralement préservée dans une archive séparée.

## Modifications réelles

1. **Barrages Kenge** : trois objets `roadblock` avec PV et indicateur d'attaque, collision des attaques existantes par `hitRoadBlocks` ; les barrières manquées coûtent 7 points d'intégrité (avant réduction des améliorations). Trois touches en mêlée pour neutraliser chacune. Les notifications et objectifs sont mis à jour uniquement après destruction.
2. **Réparations Carly** : `startRoadRepair()` est reliée aux vagues nettoyées à Kikwit/Kamina, avec apparition de deux saboteurs, garage dessiné en jeu, barre de progression et événement annulable après 28 secondes. La validation de l'objectif dépend d'une vraie réparation réussie.
3. **Motards alliés** : `Render.convoyEscort()` produit 1, 2 ou 3 motos d'arrière-plan suivant la cohésion restante. Silhouettes vectorielles originales, pas d'assets supposés.
4. **Joe-Vally temporaire** : bob léger du véhicule et de la posture, sans toucher aux phases/mécaniques V26.3 ni au boss colosse de Gombe.
5. **Séparation des objectifs** : `roadProgress()` ne mélange plus victoire sur une vague, barrage détruit, réparation terminée et balise finale.

## État réel

- Campagne principale : 24 étapes du code préexistant conservées.
- DLC : 6 étapes en code conservées, **8 étapes du GDD non intégrées**.
- Sprites illustrés antérieurs préservés. Barrages/garage/escorte = rendus vectoriels temporaires.
- Aucune nouvelle musique, voix, cinématique pré-rendue, vraie animation image par image ni piste de route exclusive.
- Ce n'est **pas** un jeu final certifié AAA. Le gameplay intégral, les FPS et les manettes/écrans tactiles exigent encore des tests humains.

## Tests livrés

Exécuter à la racine :

```bash
node tools/validate_v26.js
node tools/test_v26_1.js
node tools/test_v26_2.js
node tools/test_v26_3.js
node tools/test_v26_4.js
```

Les assertions V26.4 couvrent les trois barrages, leur non-validation par vagues, le barrage manqué, les deux réparations, la défense sous embuscade, l'échec de réparation, les types d'objectifs, les fonctions de dessin isolées et 30 démarrages de niveaux avec 60 ticks chacun. Les tests de dessin par simulation Canvas ne remplacent pas un rendu de navigateur.

## Test manuel recommandé

Dans le dossier `index.html` : `python -m http.server 8085`, puis ouvrir `http://localhost:8085/?nosw`.

- À **Kenge**, frapper trois fois chaque barrage orange de Val Industries ; vérifier que la jauge OBJECTIF ne progresse pas en tuant seulement les ennemis. Contourner une barrière pour vérifier la pénalité.
- À **Kikwit** et **Kamina**, vider une vague, défendre le garage mobile, puis vérifier progression/récompense et éventuel échec de réparation.
- Vérifier la lisibilité des trois motards alliés et l'absence de baisse de FPS avec effets activés.
- À **Lubumbashi**, vérifier la moto, les béquilles et les trois balises du boss ; vérifier qu'aucun barrage Kenge n'apparaît ailleurs.
- Sur mobile et manette, vérifier les commandes et transitions, notamment les menus du garage.

## Travaux non commencés

Huit étapes routières supplémentaires, sprites finaux de Carly/Joe-Vally, bruitages dédiés, véritable mise en scène image par image, défi hebdomadaire, polissage de niveaux et playtests matériels.

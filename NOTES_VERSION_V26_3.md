# GHOSTLINK — V26.3 : Traversée, premier boss interactif

**13 octobre 2026 — OpenAI GPT-6 (ChatGPT)**

Source inchangée : V26.2. Le contenu de la campagne principale, ses 24 communes et son boss colosse ne sont pas remplacés. Six étapes routières conservées.

## Fonctionnalités intégrées
- Dans **Lubumbashi seulement**, Joe-Vally utilise une IA de boss routier distincte du colosse de Gombe.
- Phase 1 (100%→68%) : moto et charges télégraphiées, parables. La moto réapparaît en position initiale après une charge. Après une parade, le boss est vulnérable.
- Phase 2 (68%→34%) : transition vers la silhouette avec béquilles (placeholder vectoriel), coups de béquille télégraphiés avec deux portées, contre sur parade.
- Phase 3 (34%→12%) : trois balises Val Industries réellement destructibles en deux frappes chacune, ciblées aussi par l'assistance de visée. Le boss ne peut pas être achevé tant que les trois balises restent actives.
- Objectif de libération : sa progression est désormais exclusive à la destruction des balises ; les vagues et réparations précédentes ne peuvent plus le compléter.
- Un seul système d'événements de route à la fois durant le combat final ; le garage et la fin des étapes précédentes sont conservés.
- Représentation graphique provisoire du personnage, moto et balises, sans ajout d'illustrations définitives non réalisées.

## Limites
- V26.3 reste une **bêta** : animations au dessin vectoriel de secours, pas encore de cinématique dessinée, voix ni SFX enregistrés spécifiquement pour le boss.
- Aucun des huit niveaux routiers additionnels du GDD n'est encore créé.
- Contrôles à la manette/au tactile et campagne entière non validés par un joueur humain sur appareil.
- L'IA bénéficie d'un script original simplifié et ne constitue pas un combat « AAA » terminé.

## Tests
Exécuter `node tools/validate_v26.js`, `node tools/test_v26_1.js`, `node tools/test_v26_2.js`, puis `node tools/test_v26_3.js` depuis le dossier contenant index.html. Les tests automatisés n'établissent pas 60 FPS sur matériel réel.

## Démarrer
Depuis le dossier racine du jeu : `python -m http.server 8084` ; URL `http://localhost:8084/?nosw`.

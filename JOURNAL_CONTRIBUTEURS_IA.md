# JOURNAL DES CONTRIBUTEURS IA — KINSHASA 243 : GHOSTLINK (Val Industries Corporate Technologies, anciennement Africa-Secure)

Développeur principal : **JOE-VALLY**

## Protocole d'accès pour les futures IA (V6.1 et au-delà)

- **Règle d'or :** aucune IA ne doit effacer ou écraser l'historique des contributions précédentes de ses consœurs (ChatGPT, GPT-6, Gemini, Perplexity Computer…).
- **Traçabilité :** toute modification majeure (physique, réseau, portage, IA générative, design) est signée ici avec la date, l'outil utilisé et les tests de validation associés.
- **Philosophie :** Africa-Secure appartient au code vivant. Pose ta brique avec respect pour Kabongo, Kinshasa 243 et le réseau GHOSTLINK.

> Note : les mentions de versions et de modèles ci-dessous sont reprises telles que déclarées par le projet ; elles ne constituent pas une certification indépendante.

## Registre (ordre chronologique — ne jamais supprimer de ligne)

| Version | Contributeur | Contenu déclaré |
|---|---|---|
| Versions fondatrices | ChatGPT / GPT | Concept, premières bases du jeu |
| V6 | GPT-6 (déclaré) | Renommage KINSHASA 243 : GHOSTLINK Africa-Secure, protocole des contributeurs |
| V6 – V9 | Gemini | Itérations de gameplay et de rendu |
| V4 Network, V9.1, V9.2 Visual | Perplexity Computer | Réseau, corrections, passe visuelle |
| **V10 Mobile** | **Perplexity Computer — 12/10/2026** | Refonte complète (voir ci-dessous) |
| **V11 Furie dans les rues** | **Perplexity Computer — 13/10/2026** | Nouvelle application : beat'em up d'arcade original à 3 héros (voir ci-dessous). La V10 reste intacte et séparée. |
| **V12 Les 24 communes** | **Perplexity Computer — 13/10/2026** | Nouvelle application : 24 niveaux dans les 24 communes de Kinshasa, récits du Congo, refonte des mécaniques façon beat'em up mobile moderne. **Renommage : Africa-Secure → Val Industries Corporate Technologies** (les lignes historiques ci-dessus qui citent Africa-Secure sont conservées telles quelles). V10 et V11 restent intactes. |
| **V12.1 Sprites & fluidité** | **Perplexity Computer — 13/10/2026** | Héros jouables en sprites illustrés fidèles aux portraits du menu, moteur plus rapide, interpolation 90/120/144 Hz, nouvelles mécaniques. Mise à jour de la V12 (même application). |
| **V12.2 Sprites ennemis & boss, mobilité** | **Perplexity Computer — 13/10/2026** | Ennemis et boss illustrés, 12 poses intermédiaires par héros, double saut et dash inspirés d'Ori 2. Mise à jour de la V12 (même application). |
| **V12.3 Studio : hors ligne, manette, son 3D** | **Perplexity Computer — 13/10/2026** | 76 poses supplémentaires, jeu 100 % hors ligne, parade et esquive parfaite, commandes en arc façon Diablo mobile, navigation manette dans tous les menus, réglages à onglets, son spatial binaural, optimisations. Mise à jour de la V12 (même application). |
| **V12.4 Physique & animations** | **Perplexity Computer — 13/10/2026** | 120 poses supplémentaires (chutes, relevés, coups au ventre, saisis, projection, revers, respiration, provocation), physique avec masse, rebond mur, domino, glissade, saut variable, traînées de frappe, pré-réduction des sprites. Mise à jour de la V12 (même application). |

## V10 Mobile — 12 octobre 2026 — Perplexity Computer

**Changements**
- Réécriture complète en 5 modules (`core`, `assets`, `world`, `render`, `ui`) : moteur Canvas 2D à pas fixe 60 Hz.
- Format portrait compact : tours verticales de 10 secteurs, caméra suiveuse, altimètre, arène du boss JOE-VALLY (3 phases, 6 motifs d'attaque).
- Effets : pool de particules (étincelles, braises, anneaux, fumée, débris, fantômes de dash), ombres portées dynamiques selon la lumière, couche d'éclairage (secteurs sombres), vignette, aberration chromatique, flash, éclairs, transitions iris.
- Interface glassmorphism (HUD, menus, feuilles coulissantes), polices Chakra Petch + Sora embarquées.
- Contrôles tactiles : joystick flottant multi-touch, boutons TIR/SAUT/DASH/BOMBE, mode gaucher, taille réglable, vibrations ; clavier (2 joueurs) et manettes.
- Visée assistée, combos, relais à détruire, checkpoints, 3 étoiles par secteur, coop locale.
- 11 illustrations générées (fonds, key-art, ennemis, boss) en WebP.
- Préparation APK (Capacitor) et Windows/Linux (Electron, AppImage).

**Tests de validation (navigateur Chromium automatisé)**
- 390×844 tactile, 360×640, bureau 1280×800 : aucune erreur JavaScript.
- Multi-touch simultané (joystick + saut/tir), coop clavier, menus, pause, fin de secteur, game over, victoire.
- Vérification d'accessibilité des sorties et relais sur les secteurs 1 à 9.
- Non testé : appareils Android physiques, manettes physiques, builds APK/AppImage compilés.

## V11 « Furie dans les rues » — 13 octobre 2026 — Perplexity Computer

**Demande du développeur principal :** un remake inspiré de *Streets of Rage 4*. Pour respecter les droits de Dotemu / Lizardcube / Guard Crush / SEGA, la V11 est une **création originale inspirée du genre** : aucun personnage, niveau, musique, texte ou graphisme de SoR4 n'est copié.

**Changements**
- Nouvelle application séparée (dossier `ghostlink-v11`, identifiant `cd.joevally.ghostlink11`), la V10 n'est ni écrasée ni modifiée.
- Genre beat'em up à défilement horizontal, couloir de profondeur (axe z), caméra verrouillée par vagues, flèche GO, arènes de boss.
- 3 héros jouables : **Kabongo** (équilibré, TEMPÊTE FANTÔME), **Nzinga** (rapide, FOUDRE WAX), **Makasi** (puissant, SÉISME DU CONGO).
- Combat : combos 4 coups, attaques sautées et en course (double-tap), saisies (genoux, projections), spéciaux payés en vie récupérable (barre verte), coup étoile plein écran, armes (barre, couteau, bouteille), nourriture et argent dans les objets cassables, jonglages, rebonds, arrêts sur image, ralenti du K.O.
- 6 types d'ennemis (voyou, kuluna, boxeuse, molosse, garde à bouclier, drone) avec jetons d'attaque ; 7 boss (Ndeke, Mama Zenga, Capitaine Mbisi, DJ Kanyinda, Sergent Kitoko, le Baron, JOE-VALLY en colosse avec rayon, poing, balayage et drones).
- 7 stages à Kinshasa (Boulevard du 30 Juin, Marché Gambela, Port du fleuve, Matonge la nuit, Gare centrale avec trains, Tour Africa-Secure sous l'orage, Core GHOSTLINK), histoire en cases de BD (prologue + fin), cartes de stage et de boss.
- Rendu : personnages à squelette dessinés à l'encre style BD, décors peints en parallaxe, sols procéduraux avec reflets, météo par stage, étincelles BD, trame demi-teinte, vignette.
- Musique générée en temps réel (house / breakbeat / techno 90s + guitare sebene de rumba congolaise) et bruitages synthétisés.
- Interface : panneaux inclinés façon arcade, HUD avec portrait, vie + vie récupérable, vies, étoiles, combo, barre ennemi/boss, rang S/A/B/C/D en fin de stage, options (difficulté Facile→Mania, qualité, secousses, vibrations, gaucher, taille des boutons, volumes).
- 17 illustrations générées (key-art, héros, boss, décors) en WebP.

**Tests de validation (Chromium automatisé)**
- 390×844 tactile, 360×640, paysage 844×390, bureau 1280×800 : aucune erreur JavaScript.
- Bot de test : stage 1 complet (vagues → boss → résultats), combats de boss des stages 2 à 7, colosse JOE-VALLY vaincu, écran de fin.
- Multi-touch réel (joystick + COUP simultanés), saisie → genoux → projection, coup étoile, coop 2 joueurs (sélection J1/J2, HUD double), pause, options, K.O. → Continuer.
- Corrigés pendant les tests : drones sortant de l'arène, drones impossibles à rattraper, double dégât des projections, recouvrement pause/options.
- Non testé : appareils Android physiques, manettes physiques, builds APK/AppImage compilés.

## V12 « Les 24 communes » — 13 octobre 2026 — Perplexity Computer

**Demande du développeur principal :** garder l'histoire et le lore, les enrichir avec des récits du Congo sur 24 niveaux dans les 24 communes de Kinshasa, remplacer Africa-Secure par **Val Industries Corporate Technologies**, rapprocher le jeu de *Streets of Rage 4* en refaisant les mécaniques « comme un vrai jeu mobile, pas un jeu Flash ».

**Note de renommage :** à partir de la V12, la corporation s'appelle **Val Industries Corporate Technologies** (Tour Val Industries à la Gombe). Conformément au protocole, les entrées précédentes mentionnant Africa-Secure ne sont ni effacées ni réécrites.

**Note de droits :** les mécaniques (règles de jeu, non protégées) sont reproduites au plus près de SoR4 ; personnages, décors, musique et textes restent des créations originales.

**Changements**
- Nouvelle application séparée (dossier `ghostlink-v12`, identifiant `cd.joevally.ghostlink12`, version 12.0.0, sauvegarde `ghostlink-v12-save.json`, clés `v12.`).
- **24 stages = 24 communes**, groupés en 4 districts-chapitres (Tshangu, Mont-Amba, Funa, Lukunga), de Nsele à la Gombe, chacun avec un lieu, un boss, une intro, une conclusion et un « Récit du Congo » (fait historique ou culturel : aéroport de N'djili à Nsele, Mami Wata, Marché de la Liberté, UNIKIN, Échangeur de Limete, Rumble in the Jungle à Kalamu, rumba à l'UNESCO, Ntamo/Kintambo, Lola ya Bonobo, Kimpa Vita…).
- **25 boss** (18 nouveaux), 2 nouveaux ennemis (sapeur, motard), kuluna lanceur de couteaux, molosses qui saisissent.
- **Mécaniques** : attaque arrière (bouton DOS), annulation d'un coup qui touche vers l'attaque arrière ou le saut, BLITZ (course + spécial), spécial aérien, lancer d'arme (SPÉCIAL avec une arme), saut par-dessus l'adversaire pendant une saisie, saisies ennemies avec libération en martelant, **points de combo encaissés en fin de combo et perdus si on est touché**, vie bonus tous les 50 000 points, **barres de vie de boss empilées**, final en deux phases (le Baron puis JOE-VALLY, changement de décor et de musique), pulsation de zoom sur les gros impacts.
- **Rendu** : cadrage portrait plus serré (personnages plus grands), membres en capsules effilées ombrées (fin de l'aspect « traits Flash »), projectiles couteau / arme / ondes colorées, chargement des décors à la demande.
- **Interface** : carte des 24 communes par district avec progression, carte de chapitre, carte de stage avec commune + récit, 5e bouton tactile, popups des points de combo, crédits mis à jour.
- 36 nouvelles illustrations (18 décors, 18 portraits de boss) en WebP.

**Tests de validation (Chromium automatisé)**
- 390×844 tactile, 844×390 paysage, 1280×800 : aucune erreur JavaScript.
- Les 24 stages chargés et joués par le bot sans erreur.
- Vérifiés : points de combo encaissés (180) puis perdus après un coup, attaque arrière (demi-tour + k_back), BLITZ, spécial aérien, lancer d'arme (dégâts + arme au sol), saisie ennemie → libération en martelant, saisie complète (2 genoux + projection), vie bonus à 50 000, phase 2 de la Gombe (Baron K.O. → JOE-VALLY, décor bg_core, sol grid).
- Non testé : appareils Android physiques, manettes physiques, builds APK/AppImage compilés.

## V12.1 « Sprites & fluidité » — 13 octobre 2026 — Perplexity Computer

**Demande du développeur principal :** déplacement trop lent ; les personnages jouables doivent ressembler exactement aux portraits du menu ; mécanique rapide, fluide, dynamique, 60/120 FPS, « comme SoR4 et Ori », avec du code solide.

**Changements**
- **Sprites des héros** : 42 poses illustrées (14 par héros : garde, 2 pas de marche, course, direct, crochet, uppercut, coup de pied, saut, coup de pied sauté, spécial, touché, au sol, saisie), générées à partir des portraits du menu (même visage, tenue, couleurs). Nouveau module `js/sprites.js` : choix de la pose selon l'état, animation procédurale (respiration, rebond, inclinaison en course, anticipation et étirement des coups, écrasement à l'atterrissage, bascule en chute), flash blanc d'impact, traînées teintées. Repli automatique sur le rig si une image manque. Ennemis et boss gardent le rig vectoriel.
- **Vitesse** : marche +35 %, profondeur +30 %, ennemis +15 %, attaques des héros +15 % plus rapides, saut plus sec (gravité de saut ×1,38), course automatique en maintenant la direction 0,38 s.
- **Joystick tactile** : courbe de réponse arcade (pleine vitesse dès 45 % d'inclinaison).
- **Fluidité 60/90/120/144 Hz** : simulation à pas fixe 60 Hz (déterministe) + interpolation de rendu des positions (héros, ennemis, projectiles, objets, particules, caméra). Compteur d'images avec `?fps` dans l'URL.
- **Récupération aérienne** : SAUT pendant une chute = rétablissement (invulnérabilité courte).

**Tests de validation (Chromium automatisé)**
- 390×844 et 844×390 : aucune erreur JavaScript ; 3 héros joués par le bot sur 3 stages.
- Séquence vérifiée : direct → crochet → uppercut, marche, saut, coup sauté, spécial : chaque état affiche la bonne pose.
- Boucle 120 Hz simulée (240 images) : interpolation active, sans erreur.
- Coût mesuré : rendu ≈ 1,3 ms et simulation ≈ 0,05 ms par image (marge suffisante pour 120 FPS sur un mobile récent). Le navigateur de test, sans GPU, ne permet pas de mesurer les FPS réels.
- Non testé : appareils physiques 120 Hz.

## V12.2 « Sprites ennemis & boss, mobilité » — 13 octobre 2026 — Perplexity Computer

**Demande du développeur principal :** même refonte (sprites illustrés) pour les ennemis et les boss, poses intermédiaires pour les trois héros, mécanique de SoR4 et d'Ori 2.

**Changements**
- **7 types d'ennemis** (voyou, kuluna, boxeuse, molosse, garde Val Industries, sapeur, motard) : un modèle de référence créé pour chacun, puis 7 poses (garde, 2 pas, frappe rapide, frappe lourde, touché, au sol).
- **24 boss** : 7 poses chacun, générées à partir de leurs portraits (mêmes tenues et armes). Le drone et le colosse JOE-VALLY gardent leur rendu dédié.
- **Héros : 26 poses** (+12) : cycle de marche à 4 temps, course à 2 temps, préparations du direct, du coup de pied et de l'uppercut, atterrissage, relevé, coup au ventre, envol, dash, salto, second temps du spécial.
- `js/sprites.js` généralisé : un seul moteur pour héros, ennemis et boss ; chargement à la demande par stage (ennemis du stage + boss + stage suivant) ; replis en chaîne si une pose manque, puis repli sur le rig.
- **Ennemis lisibles (SoR4)** : recul visible avant chaque attaque, frappe lourde distincte de la frappe rapide.
- **Mobilité (Ori 2)** : double saut en salto, dash invulnérable avec traînée (DOS + direction) au sol et en l'air, dash + COUP = attaque en course, dash + SAUT = saut en course. DOS seul reste l'attaque arrière.
- Script de traitement `ghostlink-v12-extras/spr2.py` (WebP, ancrage sur le torse, échelle par pose).

**Tests de validation (Chromium automatisé)**
- 24 stages : chaque boss s'affiche avec son sprite ; aucune erreur JavaScript.
- Double saut (66 px de hauteur max), dash (58 px en 0,2 s, invulnérable), dash → attaque en course, dash aérien, DOS seul = attaque arrière : vérifiés.
- Portrait 390×844 et paysage 844×390 contrôlés visuellement.
- Non testé : appareils physiques, temps de chargement en 3G.

## V12.3 « Studio » — 13 octobre 2026 — Perplexity Computer

**Demande du développeur principal :** animations restantes, mode « Studio Pro AAA », jeu totalement hors ligne, mécanique façon Ori 2 et SoR4, menus et réglages en profondeur, contrôles façon Diablo 3 mobile, mode manette recommandé, son et musique en profondeur (casque recommandé), optimisation générale.

**Animations (76 nouvelles images)**
- 24 boss : pose de préparation (« wind ») et pose de coup spécial.
- 7 ennemis : pose de préparation (lecture des attaques comme dans SoR4).
- Seconde apparence complète (8 poses) pour le voyou et le kuluna, attribuée à un ennemi sur deux.
- 3 héros : pose de victoire après le K.O. du boss.

**Mécanique**
- **Parade** (inspirée du fragment Parade d'Ori 2) : DOS ou DASH juste avant l'impact → attaquant sonné, ralenti, projectiles renvoyés (+50 % de dégâts).
- **Esquive parfaite** : traverser une attaque en dash → ralenti, le coup suivant fait +50 % (« CONTRE »).
- Bouton **DASH** dédié avec recharge de 0,3 s ; le dash annule un coup qui touche (au sol et en l'air).
- **Combo automatique** en maintenant COUP et **aide à la visée** (façon Diablo mobile), désactivables.

**Contrôles**
- Disposition tactile **en arc** (gros COUP dans le coin, SAUT, DASH, SPÉCIAL, DOS en éventail, ★ au-dessus) avec anneaux de recharge, alerte « VIE » sur le spécial, halo de parade. Disposition classique conservée en option.
- Opacité et taille des boutons réglables, mode gaucher.
- **Manette** : détection avec notification, zone morte radiale, vibrations proportionnelles, symboles Xbox ou PlayStation, navigation complète des menus (croix ou stick, A valider, B retour, LB/RB onglets), commandes tactiles masquées quand la manette joue. Le clavier pilote aussi les menus.

**Menus et réglages**
- Réglages à 6 onglets : Jeu, Contrôles, Manette, Audio, Vidéo, Accessibilité (25 réglages, bouton « réglages par défaut »).
- Écran de démarrage : recommandation casque + manette, état du mode hors ligne. Pause : commune, temps, K.O., combo max, parades. Bilan : parades et esquives parfaites.

**Son**
- Spatialisation de chaque bruitage selon la position à l'écran : Stéréo, **Casque 3D (binaural HRTF)** par défaut, ou Mono.
- Réverbération selon le lieu (rue, hall, tunnel), limiteur maître, plage dynamique Cinéma ou Nuit.
- Musique dynamique : intensité selon le combat, filtre passe-bas en pause et à faible vie, battement de cœur sous 25 % de vie, une variation musicale par commune et par chapitre de boss.
- Test du son 3D dans les réglages. Limite assumée : Dolby Atmos n'existe pas dans un navigateur ; le binaural HRTF le remplace.

**Hors ligne et optimisation**
- `sw.js` (généré par `tools/build-sw.py`) : met en cache les 449 fichiers du jeu à la première visite, cache d'abord, mise à jour automatique au lancement suivant.
- Limite d'images par seconde (30 / 60 / 120 / Max), résolution dynamique, échelle de rendu, réduction des flashs, vitesse du jeu.
- Boucle sans allocations répétées : pool des entités de rendu, particules compactées en place, tableaux nettoyés sans recréation, éléments du HUD mis en cache.

**Tests de validation (Chromium automatisé)**
- 24 stages avec combats simulés : chaque boss affiche ses poses de préparation et de coup spécial ; aucune erreur JavaScript.
- Parade (dégâts annulés, ennemi sonné), esquive parfaite (ralenti + bonus), dash dédié et anneau de recharge, combo maintenu : vérifiés.
- Manette simulée : détection, navigation dans la pause et les réglages, changement d'onglet, retour.
- Service worker : installation et état « Hors ligne prêt » vérifiés en local.
- Non testé : appareils physiques, vraies manettes, rendu HRTF à l'oreille.

## V12.4 « Physique & animations » — 13 octobre 2026 — Perplexity Computer

**Demande du développeur principal :** continuer les animations et les performances, travailler en profondeur la mécanique, la logique et la physique, ajouter des animations aux héros, ennemis et boss, résultat de niveau studio.

**Animations (120 nouvelles images, 15 Mo de sprites au total)**
- 9 apparences d'ennemis : chute aérienne, relevé, coup au ventre, saisi / sonné (12 poses chacune).
- 24 boss : chute aérienne, relevé, coup au ventre (12 poses chacun).
- 3 héros : projection, revers arrière, seconde pose de garde (respiration), provocation après 6 s d'immobilité (31 poses chacun).
- Réactions selon la hauteur du coup : coup bas = plié au ventre, coup haut = tête en arrière.
- Traînées de frappe (« smear ») à la couleur du héros, lignes de vitesse sur les gros impacts, vibration de la cible pendant le gel d'image.

**Physique et logique**
- Masse par personnage (molosse 1,5, garde 1,2, boxeuse 0,88, boss selon leur gabarit, Makasi 1,25, Nzinga 0,9) : recul, projection et projections au sol en dépendent.
- Adhérence selon le sol (sable, terre, asphalte, métal…) et la pluie : glissade au sol après une chute.
- Rebond sur le bord de l'écran pour les ennemis projetés (« MUR ! »), effet domino sur les alliés (« DOMINO ! »).
- Jongles : la gravité augmente à chaque coup en l'air (fin des jongles infinis).
- Séparation douce des corps : les ennemis ne se superposent plus.
- Héros : apex de saut plus flottant, contrôle aérien avec inertie, saut à hauteur variable (manette / clavier).
- Gel d'image proportionnel aux dégâts, secousse de caméra lissée et orientée dans le sens du coup, caméra qui anticipe la direction du héros.

**Performances**
- Pré-réduction des sprites à la taille d'affichage (lissage haute qualité, paliers de 24 px, 4 créations max par image) : moins de bande passante GPU, plus de netteté. Rendu mesuré : 0,85 ms par image contre 1,3 ms auparavant (navigateur de test sans GPU).
- `?nosw` : mode développement sans cache hors ligne.

**Tests de validation (Chromium automatisé)**
- 24 stages avec combats simulés : aucune erreur JavaScript ; chutes, relevés et coups au ventre affichés pour ennemis et boss.
- Masse (voyou 70/187 contre molosse 53/153 en recul/projection), rebond mur, domino, séparation, coup bas, saut variable (48 px maintenu contre 31 px bref), provocation : vérifiés.
- Non testé : appareils physiques.


## V26 « Reconstruction / intégration prudente » — 13 octobre 2026 — OpenAI GPT-6 (ChatGPT)

**Sources conservées** : 243.zip (V12.4, 120 animations supplémentaires), Val Industries V24.zip (prototype Traversée), V25 et autres variantes auditées. Les contributions précédentes restent intactes ci-dessus.

**Apports** : réintégration des six étapes de la Traversée et du garage/convoi sans écraser les améliorations V12.4 ; section géographique distincte ; compteur de communes borné à 24 ; sauvegarde localStorage dans le navigateur ; nettoyage du script de capture Perplexity non lié au gameplay ; correctifs des déclenchements colosse, de la surface de route et des charges de motos (version V25 retrouvée sous extension .txt), ainsi que des mises en cache ; contrôles statiques et tests automatisés documentés séparément.

**Limites** : extension expérimentale, décors/boss temporairement réutilisés ; interactions manuelles et équilibre à valider ; 60 FPS non certifiés sur appareils physiques ; compilations Windows/Android non certifiées.

**Statut** : version de reprise *bêta*, non publication officielle ni certification AAA.

## V26.1 « Restaurations ciblées » — 13 octobre 2026 — OpenAI GPT-6 (ChatGPT)

**Sources préservées** : V26 Reconstruction, ancienne Beta4 code source (V21), PDF historique de 78 pages. Les contributions antérieures ci-dessus restent intactes.

**Modifications** : restauration du coup chargé lorsque le combo automatique est désactivé (maintien 0,55 seconde + relâchement), restauration du finisher de combo 8+ contre les ennemis ordinaires (sans perturber les KO de boss), clarification du nom de la société dans l'épilogue du DLC, textes d'options et README, tests de régression et cache hors ligne régénéré.

**Fichiers modifiés** : `js/game.js`, `js/ui.js`, `index.html`, `README.md`, `JOURNAL_CONTRIBUTEURS_IA.md`, `tools/test_v26_1.js`, `sw.js`.

**Limites** : pas de validation de partie entière sur Android, pas de prétention AAA ; Joe-Vally moto/béquilles, niveaux supplémentaires, médailles et défis restent à produire.


## 13 octobre 2026 — OpenAI GPT-6 (ChatGPT) — V26.2 PROGRESSION (bêta)
- A préservé sans écrasement les contributions antérieures et leurs archives.
- A ajouté un stockage additif `v12.recordsV3` : tentatives, victoires, rang, score, chrono, combo, dégâts et intégrité du convoi par étape.
- A migré les rangs de `v12.progress` sans inventer des records historiques.
- A branché la validation uniquement lors d'une victoire, ajouté les médailles et le registre des exploits, et protégé les doubles événements de victoire.
- A ajouté des tests de migration/régression Node ; cette livraison ne certifie pas un playtest humain, les FPS ni les plateformes compilées.
- Limites : défis journaliers, modificateurs, cosmétiques, 8 étapes manquantes et boss Joe-Vally définitif restent à réaliser.

- Complément V26.2 : export/import JSON sécurisé et fusion non destructive des sauvegardes entre ports/navigateurs.

## V26.3 — 13 octobre 2026 — OpenAI GPT-6 (ChatGPT)

**Apports :** patterns dédiés Joe-Vally uniquement sur la Traversée (moto, béquilles, trois balises destructibles), visuels temporaires, condition de victoire interactive, objectifs verrouillés par le bon événement. Sources précédentes et crédits conservés.

**Limites :** animation finale à produire, boss à équilibrer en jeu, six niveaux DLC seulement, tests sur vrais appareils en attente. **Tests** : voir `tools/test_v26_3.js` et notes de version.

## V26.4 — 13 octobre 2026 — OpenAI GPT-6 (ChatGPT)

**Base et travaux précédents respectés :** V26.3 complète conservée ; historique original du projet inchangé.

**Apports :** barrages physiques destructibles à Kenge, réparation Carly déclenchée par les vagues de Kikwit/Kamina avec saboteurs, personnages alliés motards rendus en vectoriel, animation secondaire légère de Joe-Vally et conditions d'objectifs séparées.

**Tests :** vérification de syntaxe de tous les modules JS, tests historiques V26/V26.1/V26.2/V26.3, test dédié V26.4 (barrages/réparations/échappement/rendu isolé), simulation de 30 niveaux × 60 ticks, intégrité ZIP et régénération du service worker.

**Limites :** navigateur Chromium bloqué lors de la navigation locale dans l'environnement de test ; pas de capture visuelle validée, pas de FPS mesuré, pas de test Android/manette. DLC encore six étapes, assets finaux non fournis.


## V26.5 — 13 octobre 2026 — OpenAI GPT-6 (ChatGPT)

**Brief technique proposé par Claude (Anthropic), transmis par le créateur.** Contributions : correction sprint/inversion, séparation COUP/RAMASSER, sélection d'arme la plus proche sans double ramassage, intégration clavier/manette/tactile, amélioration des comptes d'IA, diagnostic des ressources locales, tests supplémentaires et notes de distribution.

**Validation :** sept suites Node réussies (dont 5 préexistantes), préflight statique `file://`; **non validés** : vrai Windows/Android, manette physique, FPS réels et partie complète. Les crédits antérieurs et les sauvegardes ne sont pas effacés.


## 13 octobre 2026 — OpenAI GPT-6 (ChatGPT) — V26.6 Combat & Physics
- **Base :** V26.5 officielle, aucune suppression des contributions antérieures.
- **Apport :** tampon d'entrées pendant le hitstop, saut anticipé au contact, précision des fenêtres actives, géométrie des colosses, allocations limitées, tests automatisés et documentation.
- **Méthode externe :** audit et priorisation proposés par Claude (Anthropic), sans attribuer à Claude la modification de code de cette version.
- **Tests :** huit commandes Node (sept suites précédentes + test V26.6) ; 30 étapes × 90 cycles de simulation ; test réel Windows/Android et certification FPS non effectués.
- **Limites :** bosses, assets et 8 étapes DLC non terminés ; aucune prétention à une qualité AAA finale.


## 13 octobre 2026 — OpenAI GPT-6 (ChatGPT) — V26.7 Hero Combat
- **Base :** V26.6, aucune suppression des contributions de ChatGPT, Claude, Gemini, Perplexity et autres participants historiques.
- **Apports :** profils propres à Kabongo / Nzinga / Makasi ; cancels de combos uniquement sur coup confirmé avec fenêtres propres au personnage ; marge de mise en mémoire ajustée ; réactions (stagger/recul) et poses procédurales différenciées, réparation de l'anticipation de Makasi ; présentation des styles en sélection.
- **Méthode :** proposition et priorités d'audit issues du brief de Claude (Anthropic). Le code et les tests de cette passe ont été écrits par ChatGPT GPT-6.
- **Limites :** aucun nouveau sprite image par image, aucune validation FPS réelle, ni test de manette ou tactile physique, jeu toujours en bêta.
- **Tests :** `tools/test_v26_7.js` et 8 scripts historiques de tests et de vérification ; les 30 étapes passent le smoke test de 90 cycles.


## 13 octobre 2026 — OpenAI GPT-6 (ChatGPT) — V26.8 Enemy Tactics
- **Sources conservées :** archive V26.7 Hero Combat ; crédits fondateurs et contributions de Perplexity, Gemini, Claude et ChatGPT non effacés.
- **Apports effectifs :** huit profils tactiques d'ennemis, sélection des coups sans tableaux temporaires, distance et encerclement, expiration des jetons d'attaque et libération sur interruption, drone soumis au quota, esquive réactive avec délai.
- **Revue externe :** brief de Claude (Anthropic) transmis par le créateur, crédité comme proposition de méthode, non comme auteur du code V26.8.
- **Vérifications :** validation JS, régressions V26 à V26.7, tests V26.8 de concurrence et rotation, 30 étapes × 90 cycles simulés, ZIP et assets vérifiés.
- **Limites :** gameplay physique/visuel, 60 FPS, manette et Android non testés en conditions réelles ; combats de boss spécifiques et huit étapes DLC supplémentaires restant à produire.

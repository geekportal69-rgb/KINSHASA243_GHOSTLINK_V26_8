# KINSHASA 243 : GHOSTLINK — V26.8 Enemy Tactics (bêta)

Développeur principal : **JOE-VALLY**. Beat'em up mobile original : Kabongo, Nzinga et Makasi libèrent les **24 communes de Kinshasa** (4 districts : Tshangu, Mont-Amba, Funa, Lukunga), de Nsele à la Gombe, où la Tour **Val Industries Corporate Technologies** abrite le Core GHOSTLINK gardé par JOE-VALLY. Chaque niveau raconte un « Récit du Congo ».

> Inspiré du genre des grands jeux de bagarre de rue. Personnages, histoire, niveaux, musique et illustrations sont originaux. Les mécaniques sont proches de Streets of Rage 4 ; tout le contenu (personnages, décors, musique, textes) est original. Cette V12 est une application séparée : V10 et V11 restent intactes.

## V26.8 — Tactiques ennemies & coordination (13 octobre 2026)

- **Voyou** : pression au corps-à-corps ; **Kuluna** : approche latérale et couteau à distance ; **Boxeuse** : coups de pied et esquive avec délai ; **Molosse** : charges et saisies ; **Garde** : garde et électrochoc ; **Drone** : harcèlement à distance réglementé ; **Sapeur** : encerclement ; **Motard** : charge puis repositionnement.
- Les ennemis utilisent toujours les coups `MOVES` existants et les sprites d'origine. Le système de jetons d'attaque empêche que tous les adversaires attaquent simultanément (quota selon difficulté) et libère les places après une interruption ou en fin de coup.
- Nouveaux tests `node tools/test_v26_8.js`. Le benchmark en Node ne mesure pas les FPS du navigateur ni l'équilibrage réel.
- Pour le lancement : extraire puis essayer `index.html` par double-clic ; si Chrome bloque les ressources locales, servir le dossier avec `python -m http.server 8088` puis ouvrir `http://localhost:8088/?nosw`. Transférer les sauvegardes via Exporter/Importer en changeant d'origine.
- Détails : `NOTES_VERSION_V26_8.md`.

## V26.7 — Identité des trois héros (13 octobre 2026)

- **Kabongo** : style polyvalent, enchaînement après contact dans une fenêtre équilibrée (0,055 s après la fin active).
- **Nzinga** : style rush, accès au coup suivant plus tôt après impact confirmé (0,015 s), mais recul et durée de réaction supérieurs sous les coups adverses.
- **Makasi** : style lourd, mise en mémoire prolongée des commandes et récupération avant cancel (0,11 s) ; meilleure stabilité au recul, anticipation visible sur ses coups de marteau/hache.
- Les coups ratés ne profitent pas des annulations anticipées ; les spéciaux, armes et saisies ne sont pas annulés par ce mécanisme.
- Le menu des héros indique maintenant leur style de combat, sans changer les touches.
- Tous les tests historiques sont conservés et une suite supplémentaire `node tools/test_v26_7.js` vérifie les changements. Aucun sprite supplémentaire requis ; retouches procédurales sur les sprites déjà existants.
- Limite : **aucun essai réel dans Chrome Windows ou sur Android, ni calibration de FPS**. Les timings nécessitent un équilibrage humain.

## V26.6 — Combat & Physics (13 octobre 2026)

- Tampon SAUT avant atterrissage et conservation des touches lors du hitstop ; double saut inchangé en altitude.
- Fenêtres d'impact traversées par un pas lent reconnues ; hitbox des colosses corrigée en profondeur/hauteur.
- Moins d'allocations dans les timers et les groupes d'interpolation.
- Voir `NOTES_VERSION_V26_6.md`, tests `node tools/test_v26_6.js` ; les essais manuels PC/mobile restent indispensables.
- Depuis le dossier extrait, double-cliquer sur `index.html` (comportement `file://` non certifié sous Chrome Windows) ou utiliser `python -m http.server 8086` et `http://localhost:8086/?nosw`.

## V26.5 — Contrôles & interactions (13 octobre 2026)

- Sprint corrigé lors des demi-tours, course automatique et double-appui conservés.
- **RAMASSER indépendant de COUP** : E/V (J1), Pavé 0/N (J2), View/Share (manette), bouton contextuel (tactile). Arme la plus proche prioritaire.
- Jetons IA : comptage sans allocations temporaires ; ressources locales manquantes signalées.
- **PC sans PowerShell :** extraire toute l'archive et double-cliquer sur `index.html`. Ce mode est prévu par les scripts classiques et les images locales, mais **n'a pas encore été validé dans Chrome Windows** ; `file://` peut modifier la persistance des sauvegardes selon le navigateur. Faire un export depuis RECORDS pour sécuriser la progression.
- Tests additionnels : `node tools/test_v26_5.js`, `node tools/verify_file_launch_v26_5.js` ; voir `NOTES_VERSION_V26_5.md`.

## V26.4 — Routes vivantes (13 octobre 2026)

- **Kenge :** trois barrages Val Industries réellement destructibles (trois coups chacun), intégrité convoi pénalisée si un barrage est dépassé sans être détruit ; seuls les barrages neutralisés valident l'objectif.
- **Kikwit et Kamina :** réparations visibles du garage mobile Carly Dokota. Après une vague nettoyée, deux saboteurs approchent ; protéger le garage pendant huit secondes sans ennemis proches termine une réparation et fait progresser l'objectif. Une réparation interrompue pénalise le convoi, sans bloquer définitivement le niveau.
- **Convoi vivant :** silhouettes vectorielles de motards alliés animées en arrière-plan. Leur nombre visible diminue lorsque l'intégrité collective baisse, sans créer d'escorte PNJ à pathfinding lourd.
- **Joe-Vally :** légère animation procédurale de suspension et d'appui sur la silhouette temporaire, sans prétendre remplacer les sprites finaux.
- **Objectifs fiabilisés :** une vague vaincue ne peut plus compter à la place d'une réparation, d'un barrage ou d'une balise finale.
- **Compatibilité :** campagne de 24 communes, DLC de six étapes, V26.1–V26.3, sauvegardes et crédits conservés.
- **Tests :** `node tools/test_v26_4.js` et tous les tests historiques. Aucun test visuel réel sur PC/mobile n'a été validé par cette livraison.
- Démarrage local de cette branche : `python -m http.server 8085` puis `http://localhost:8085/?nosw`.

## V26.3 — Jouable en bêta (13 octobre 2026)

- Extension conservée : six étapes routières, convoi et garage Carly.
- **Boss de Lubumbashi unique** : charge moto, combat aux béquilles, trois balises Val Industries destructibles ; victoire conditionnée à leur neutralisation. Le boss colosse de Gombe reste inchangé.
- Affichage vectoriel provisoire : sprites illustrés, cinématiques et effets sonores définitifs restent à produire.
- **Aucune extension artificielle à 14 niveaux** : les huit autres étapes du Game Design Document ne sont pas encore codées.
- Tests automatisés : `node tools/validate_v26.js`, `node tools/test_v26_1.js`, `node tools/test_v26_2.js`, `node tools/test_v26_3.js`.
- Démarrage local conseillé : `python -m http.server 8084` puis `http://localhost:8084/?nosw`.

## V26 Reconstruction — branche de travail, non version finale

- Base de gameplay : **V12.4 provenant de 243.zip** (544 images WebP), conserve la physique améliorée.
- Ajoute **six étapes optionnelles de la Traversée de l’Unité** provenant de Val Industries V24.zip, accessibles depuis la carte après avoir terminé Gombe.
- Convoi et garage Carly Dokota récupérés, 5e section de carte, progression du DLC séparée, fin principale conservée au niveau 24.
- Sauvegarde du navigateur dans `localStorage` (clé `v12.*` conservée) ; si stockage bloqué, repli mémoire.
- La V26.5 propose le **double-clic sur `index.html`** (chemins locaux et sans `fetch`). Lancer par HTTP reste pris en charge. Le fonctionnement `file://` et les sauvegardes doivent être contrôlés sur votre navigateur Windows ; une archive complète doit rester extraite dans son dossier.
- L’extension **n’a pas de sprites et décors propres** : elle est expérimentale et exige tests/équilibrage.
- Voir `AUDIT_ET_REPRISE_V26.md` et `tests/`.

## V26.1 — Restaurations ciblées depuis V21

- **Finisher** : KO d’un ennemi ordinaire avec un combo actif d’au moins 8 coups → ralenti, onde de choc et +500 points. Les boss conservent leurs propres KO.
- **Coup chargé** : dans Options > Contrôles, désactiver **Combo automatique**. Au sol et sans arme, maintenir COUP au moins 0,55 seconde, puis relâcher ; attaque de course ×1,6 dégâts (une seule attaque). Les coups rapides se déclenchent au relâchement dans ce mode. Avec Combo automatique sur « Oui » (réglage par défaut), le maintien produit toujours les chaînes de coups habituelles.
- **Lore** : Val Industries Corporation est l'entreprise antagoniste ; GHOSTLINK est un protocole du réseau dans la conclusion de la Traversée. Le titre historique reste inchangé, sous réserve de décision du créateur.
- **Limites** : Joe-Vally routier reste un colosse provisoire, sans sprites moto/béquilles dédiés ; les 8 étapes additionnelles du GDD et la sauvegarde avancée ne sont pas encore implémentées.
- Tests : `node tools/validate_v26.js` puis `node tools/test_v26_1.js` ; tests manuels Chrome/Android encore nécessaires.

## Nouveautés V12.4 « Physique & animations »

- **120 poses supplémentaires** : chute, relevé, coup au ventre et saisi pour tous les ennemis ; chute, relevé et coup au ventre pour les 24 boss ; projection, revers, respiration et provocation pour les héros.
- **Physique** : masse par personnage, glissade selon le sol (et la pluie), rebond sur le bord de l'écran, effet domino, gravité de jongle croissante, séparation des corps, saut à hauteur variable.
- **Impacts** : traînées de frappe, lignes de vitesse, vibration de la cible, secousse de caméra orientée, caméra qui anticipe.
- **Performances** : sprites pré-réduits à la taille d'affichage. Développement : ajouter `?nosw` à l'adresse pour désactiver le cache hors ligne.

## Nouveautés V12.3 « Studio »

- **Jeu 100 % hors ligne** : à la première visite, tout le jeu est mis en cache (`sw.js`). Après chaque modification du code, relancer `python3 tools/build-sw.py`.
- **Parade** (DOS ou DASH juste avant l'impact), **esquive parfaite** (dash à travers une attaque), bouton **DASH** dédié.
- **Commandes en arc façon Diablo mobile** avec anneaux de recharge ; combo automatique en maintenant COUP ; aide à la visée.
- **Manette recommandée** : navigation complète des menus, symboles Xbox / PlayStation, vibrations. Touches : X coup, A saut, B spécial, Y dos, RB/RT dash, LB/LT étoile, Menu pause.
- **Son 3D au casque** (binaural HRTF), réverbération selon le lieu, musique dynamique, variation par commune. Dolby Atmos n'est pas disponible dans un navigateur.
- **Réglages à 6 onglets** (Jeu, Contrôles, Manette, Audio, Vidéo, Accessibilité), limite de FPS, résolution dynamique.
- **76 poses supplémentaires** : préparation et coup spécial des 24 boss, préparation des ennemis, seconde apparence du voyou et du kuluna, victoire des héros.

## Nouveautés V12.2

- **Tous les combattants humains sont illustrés** : 7 types d'ennemis et 24 boss (7 poses chacun), générés à partir de leurs portraits ; le drone et le colosse JOE-VALLY gardent leur rendu dédié.
- **Poses intermédiaires des héros** : 26 poses par héros (cycle de marche à 4 temps, course à 2 temps, préparations de coups, atterrissage, relevé, coup au ventre, envol, dash, salto, second temps du spécial).
- **Mobilité inspirée d'Ori 2** : double saut en salto, dash invulnérable (DOS + direction) au sol et en l'air, dash + COUP = attaque en course.
- **Lecture des attaques ennemies** (comme SoR4) : les ennemis reculent visiblement avant de frapper.
- Régénérer les sprites : `ghostlink-v12-extras/spr2.py`.

## Nouveautés V12.1

- Héros jouables en **sprites illustrés** identiques aux portraits du menu (`assets/spr/`, `js/sprites.js`).
- Jeu plus rapide (marche +35 %, attaques +15 %, course automatique), saut plus sec, récupération aérienne (SAUT pendant une chute).
- Rendu interpolé : fluide à 60, 90, 120 ou 144 Hz. Ajoutez `?fps` à l'URL pour afficher le compteur.
- Régénérer les sprites : `ghostlink-v12-extras/spr.py` (recadrage, échelle, point d'ancrage, WebP) puis `assets/spr/meta.js`.

### Police de caractères (optionnel)

Les binaires des polices ne figurent pas dans cette archive de reconstruction. Le jeu fonctionne avec les polices système de secours ; pour retrouver exactement les typographies de votre projet original, copier le dossier `assets/fonts` depuis votre archive personnelle `243.zip` ou exécuter :

```powershell
python tools/restore_fonts.py "C:\Users\Administrator\Pictures\243.zip"
```

Cette commande régénère automatiquement le cache après la restauration.

## Lancer en local
Jeu 100 % statique (HTML/CSS/JS, sans dépendance).
```bash
npm run serve        # puis ouvrir http://localhost:8080
# ou : python3 -m http.server 8080
```

## Commandes
- **Tactile** : joystick flottant à gauche ; COUP, SAUT, SPÉCIAL, DOS (attaque arrière) et ★ (coup étoile) à droite. Mode gaucher et taille des boutons dans Options.
- **Clavier J1** : Q/A·D déplacer, Z/W·S profondeur, F/J coup, Espace/K saut, H/L spécial, R/U dos, T/I étoile. **J2 (coop)** : flèches, `,` coup, `.` saut, `/` spécial, `M` dos, `;` étoile. Échap/P : pause.
- **Manette** : X coup, A saut, B spécial, Y dos, LB/RB étoile, START pause (2 manettes en coop).
- Saisie : marcher contre un ennemi. COUP = genou, arrière + COUP ou DOS = projection, SAUT = passer de l'autre côté.
- Double-tap = course ; course + COUP = attaque en course ; course + SPÉCIAL = BLITZ. SPÉCIAL en l'air = spécial aérien. Avec une arme, SPÉCIAL la lance.
- SPÉCIAL coûte de la vie (barre verte) récupérée en frappant. Saisi par un molosse : martelez les boutons.
- Points de combo : encaissés à la fin du combo, perdus si vous êtes touché avant. Vie bonus tous les 50 000 points.

## Android (APK) — Capacitor
Prérequis : Node 18+, Android Studio + SDK.
```bash
npm install
npm run android:add      # copie le jeu dans www/ et crée android/
npm run android:open     # Android Studio → Build > Build APK(s)
```
Après chaque modification : `npm run android:sync`. Le jeu fonctionne en portrait et en paysage.

## Windows et Linux (AppImage) — Electron
```bash
npm install
npm run desktop          # test
npm run dist:linux       # → dist/*.AppImage
npm run dist:win         # → installateur + portable
```

## Sauvegardes
En navigateur, la progression est sauvegardée par défaut dans localStorage, si autorisé. Une plateforme peut fournir `window.GHOSTLINK_STORE = { get(key), set(key, value) }` avant `js/core.js` (clés préfixées `v12.`). Electron le fait déjà (`electron/preload.js`). Pour Android, branchez `@capacitor/preferences` sur la même interface.

## Structure
```
index.html            écrans, HUD, commandes tactiles
css/style.css         direction artistique arcade / BD
js/core.js            utilitaires, réglages, entrées (tactile, clavier, manettes)
js/audio.js           musique électro-rumba et bruitages synthétisés
js/data.js            coups, héros, ennemis, 25 boss, 24 communes, districts, récits, histoire
js/rig.js             squelettes et dessin des personnages
js/game.js            simulation : combat, IA, vagues, boss, objets, dangers
js/render.js          rendu Canvas : décors, sols, effets, météo
js/ui.js              écrans, HUD, boucle principale
assets/img            illustrations WebP · assets/fonts : Anton, Barlow Condensed (OFL)
electron/             enveloppe bureau
JOURNAL_CONTRIBUTEURS_IA.md   registre des contributions (ne jamais supprimer de ligne)
```


## V26.2 — Progression, Médailles et Transfert de sauvegarde

- Menu **RECORDS & MÉDAILLES** : records par étape, temps, scores, rangs et médailles cumulées.
- Les rangs historiques (`v12.progress`) sont conservés ; les nouveaux records sont dans `v12.recordsV3`.
- **Exporter** depuis le registre : `GHOSTLINK_SAUVEGARDE_V26_2.json` ; **Importer** dans une autre version au même endroit.
- Les ports `localhost:8080`, `8082`, `8083` ont des sauvegardes distinctes : pour récupérer une progression d'un ancien port, lancer temporairement V26.2 sur ce même port, exporter, puis importer ailleurs. Les réglages sont exclus du transfert.
- Pour lancer : dans le dossier `index.html`, `python -m http.server 8083`, puis `http://localhost:8083/?nosw`.
- Tests automatisés : `node tools/test_v26_2.js`, `node tools/test_v26_1.js`, `node tools/validate_v26.js`.
- Limitations : aucune certification visuelle/mobile 60 FPS ; DLC toujours six étapes ; huit étapes prévues non réalisées ; boss final Joe-Vally encore en cours.

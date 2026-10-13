# AUDIT ET REPRISE — KINSHASA 243 : GHOSTLINK V26 BÊTA

**Date :** 13 octobre 2026  
**Auteur de la reprise :** OpenAI GPT-6 (ChatGPT)  
**Statut :** reconstruction technique et tests automatisés limités ; **non certifiée AAA** / non testée de bout en bout sur navigateur ou mobile.

## 1. Reconstitution des fichiers et des branches

Les titres d'archives ne décrivent pas fidèlement les révisions internes :

| Source | Découverte | Action |
|---|---|---|
| `243.zip` | **V12.4** : 544 fichiers images WebP, 120 poses de plus que les bases 12.3, physique/animation et pré-réduction des sprites | **Base principale retenue** |
| `Val Industries V24.zip` | Prototype DLC 6 étapes Traversée, convoi, garage Carly, objectifs ; dérivé de V12.3 | Réintégration sélective du DLC |
| `ghostlink-v25-traversee-aaa-Complet.zip` | Identique bit-à-bit à plusieurs archives "code source" / `555.zip` : retour V12.3, DLC non présent | Référence seulement |
| `ghostlink-v25-traversee-aaa.txt` | **Archive ZIP cachée sous extension .txt**, distincte de la V25 "Complet", contient `RAPPORT_QUALITE_V25.md` ; route, friction, charge motos, phases Joe ; contient aussi des erreurs | Récupération corrigée des routes et charges |
| `Val Industries Beta4 code source.zip` | Variante V21 : **autre scénario du DLC Motards (3 niveaux, Kino la Foudre, Sapé Moteur, Gaz na Gaz)** et référence `boss_kino.jpg` | Conservée en `docs/heritage/` et `docs/references/`, non fusionnée automatiquement |
| Beta1/Beta4 et fichiers `.txt` restants | Plusieurs duplications exactes d'archives malgré des noms différents | Historique respecté sans répétition des modules |

### Choix de cohérence narrative

L'histoire des 24 communes conserve sa fin à **Gombe** (Baron et Core). La Traversée est une **extension indépendante** débloquée après cette fin, avec six étapes jusqu'à Lubumbashi. Le compteur de libération des communes n'inclut jamais les étapes du DLC. Le scénario **V21 Motards en trois étapes** représente une proposition concurrente : la fusion automatique avec les six étapes V24 créerait une contradiction de boss final. Elle reste une référence à décider plus tard, pas un contenu livré.

**Piste de réconciliation narrative (proposition, pas canon validé)** : distinguer JOE-VALLY, l'empreinte/colosse gardien du Core à la Gombe, et Joe-Vally humain sous contrôle résiduel du signal sur la Traversée, à libérer. Le code reprend les textes sources tant que ce point n'est pas approuvé.

## 2. Fonctionnalités réellement livrées dans la V26

1. **Campagne Kinshasa :** 24 communes originales, 4 districts, 3 héros et 25 définitions de boss (24 boss de commune + colosse du Core), vagues et combats existants conservés.
2. **Physique V12.4 :** masses, glissades, rebonds, réactions aux dégâts, 120 poses supplémentaires, effets et sprites pré-réduits préservés.
3. **Extension Traversée :** 6 niveaux supplémentaires (`r2k_base`, `kwango_gate`, `kikwit_relay`, `kananga_crossroads`, `kamina_rail`, `lubumbashi_unity`) dans une cinquième section de carte dédiée. Verrouillage initial jusqu'à la fin de Gombe et progression propre au DLC.
4. **Carly Dokota / convoi :** jauge d'intégrité, objectifs et réparations, garage mobile, améliorations persistantes entre les étapes ; menu final non bloquant lorsque les quatre améliorations sont épuisées.
5. **Héritage V25 `.txt` :** variabilité des sols de route, charges de motos avec avertissement lisible, collision/esquive/parade, silhouette vectorielle temporaire de moto. Correctif au chronomètre de charge (dans le code V25, `h.t -= dt` puis `h.t += dt` annulait son avancée).
6. **JOE-VALLY Déchu :** transitions sur 68 % et 34 % de vie dans la branche `colossus` réellement utilisée, au lieu de l'ancien code inatteignable sous `!t.colossus`. Cette version utilise l'illustration colosse existante, non le sprite final de rider.
7. **Correctifs de distribution :** suppression d'un script d'édition de l'aperçu Perplexity étranger au jeu ; chargement d'images compatible `file://` pour les enveloppes locales ; sauvegarde `localStorage` avec repli mémoire/adaptateur Electron ; régénération du service worker et de sa clé de cache.
8. **Crédits IA :** les anciennes contributions et notes V12.4 sont préservées ; une entrée de reprise a été ajoutée au journal et dans les crédits du jeu.

## 3. Contrôles réellement effectués

- Syntaxe `node --check` : modules JS, service worker et enveloppe Electron.
- Vérification Pillow : **544 WebP** lisibles avant suppression des polices du paquet de distribution (les WebP sont conservés).
- Script `node tools/validate_v26.js` : 30 stages, 5 chapitres, 25 boss ; toutes les définitions de stage pointent vers un chapitre/boss valides ; 60 cycles de simulation par stage sans exception avec périphériques/audio simulés ; tests de convoi, garage, progression et phases spéciales de Joe.
- Inspection de la compilation HTML/CSS/JS et des fichiers PWA ; service worker régénéré.
- **Pas de test complet dans un navigateur réel de cet environnement** : Chrome automatisé bloque la navigation locale (`ERR_BLOCKED_BY_ADMINISTRATOR`). Aucune mesure FPS réelle, ni APK, ni exécutable Windows validé ; la validation par l'utilisateur sur `localhost` reste essentielle.

## 4. Risques résiduels / non terminé

- Les 6 décors du DLC et ses boss réutilisent les assets de Kinshasa : **pas encore d'assets originaux** pour chaque tronçon, Carly ou Joe-Vally rider.
- Les 24 communes utilisent des vagues générées, non 24 niveaux intégralement mis en scène et équilibrés à la main.
- Les charges de motos sont un rendu vectoriel transitoire, pas une animation sprite de haute qualité.
- Les transitions exactes du combat final DLC et la continuité narrative doivent être testées manuellement jusqu'à la fin.
- Les sauvegardes préexistantes sous certains environnements d'aperçu peuvent demander migration si origine navigateur différente ; la clé `v12.*` reste inchangée sur une même origine.
- Les fichiers binaires des polices **ne sont pas redistribués** : pour le rendu typographique identique, restaurer `assets/fonts` depuis le **propre** fichier `243.zip`, puis régénérer le cache avec `python tools/restore_fonts.py "CHEMIN_VERS_243.zip"`.
- Aucun APK / installeur Windows, ni couverture FPS physique, ni campagne entière jouée n'est revendiqué.

## 5. Tester sur le PC Windows

Décompresser l'archive dans un **nouveau dossier** (ne pas écraser V24/V25/243). Ouvrir PowerShell dans le dossier où se trouve `index.html` puis :

```powershell
python -m http.server 8080
```

Ouvrir **`http://localhost:8080/?nosw`** pour désactiver les anciens caches et confirmer la nouvelle version. Ensuite utiliser `http://localhost:8080/` pour le mode hors ligne une fois le cache reconstruit. Sur la carte, le chapitre V de Traversée apparaît sous la campagne principale et reste verrouillé tant que Gombe n'a pas été libérée. Pour tester sans refaire 24 niveaux, les développeurs peuvent uniquement utiliser la console de développement sur une **copie de test**, par exemple `Progress.ranks.gombe='A'; Progress.unlocked=24; Progress.roadUnlocked=1; saveProgress(); UI.renderStages();` (cela modifie la sauvegarde locale).

## 6. Priorités recommandées V26.1 → V27

**P0 :** partie manuelle PC 24 + DLC, transitions, manette, persistance, installation hors ligne, inventaire des bugs avec étapes de reproduction.  
**P1 :** rendre le DLC visuellement unique et corriger l'équilibrage de Carly/motos, développer un vrai boss rider et événements régionaux.  
**P2 :** refonte détaillée d'un niveau à la fois (décors, animations supplémentaires, cinématiques, ennemis) avec cible 60 FPS mesurée sur appareils.  
**P3 :** publier une bêta contrôlée, compiler et tester APK/Windows, licences des actifs et procédure de distribution.

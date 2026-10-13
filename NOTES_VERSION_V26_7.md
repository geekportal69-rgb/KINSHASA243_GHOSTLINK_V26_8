# GHOSTLINK / Val Industries — Rapport V26.7 « Hero Combat »

**13 octobre 2026 — statut BÊTA.** Socle unique : archive V26.6 Combat & Physics fournie dans le projet. L'ancienne archive et les archives précédentes n'ont pas été modifiées. Réalisation : GPT-6 (ChatGPT). Brief de revue externe : Claude (Anthropic). Les anciennes contributions restent dans le journal et à l'écran « Crédits ».

## Ce qui a effectivement été modifié

| Fichier | Modification |
|---|---|
| `js/data.js` | Ajout d'un profil de combat par héros ; aucun MOVE original supprimé ni dégâts réécrits. |
| `js/game.js` | Durée du buffer COUP propre au héros pendant une attaque ; possibilité d'enchaîner une attaque normale après contact confirmé, à partir d'un délai de récupération propre au héros ; temps de réaction et recul à l'impact ajustés pour les joueurs uniquement. |
| `js/sprites.js` | Animation procédurale de l'anticipation, de l'impact, de la récupération et du recul par héros ; correction de la pose de Makasi : ses marteaux/haches utilisent désormais une anticipation visible. |
| `js/ui.js` | Présentation du style de combat dans la fiche de sélection du héros. |
| `index.html`, `package.json`, `README.md`, `CHANGELOG.md`, `JOURNAL_CONTRIBUTEURS_IA.md` | Version V26.7, informations de lancement, traçabilité et conservation intégrale des anciens crédits. |
| `tools/test_v26_7.js`, `sw.js` | Ajout d'une suite de tests et régénération du cache hors ligne. |

## Caractéristiques de combat ajoutées

Les valeurs de temps ci-dessous sont exprimées dans l'horloge **du mouvement**, qui est mise à jour avec le tempo du moteur (`PLAYER_TEMPO = 1.15`). Elles ne correspondent donc pas directement à des durées murales.

| Héros | Identité | Cancel après la fin de la fenêtre active | Buffer COUP pendant une attaque | Réaction aux dégâts |
|---|---|---:|---:|---|
| Kabongo | Polyvalent | +0,055 s | 0,32 s | Équilibrée (×1 étourdissement ; ×1 recul) |
| Nzinga | Pression rapide | +0,015 s | 0,36 s | Plus vulnérable au recul (×1,12), en contrepartie de sa vitesse |
| Makasi | Impact lourd | +0,11 s | 0,48 s | Plus stable (×0,86 étourdissement ; ×0,78 recul) |

**Garde-fous :** un coup qui rate sa cible ne bénéficie pas de ce cancel ; les spéciaux, les saisies, les armes et les coups aériens conservent leurs restrictions actuelles. Les réactions aux impacts de l'IA ennemie ne sont pas modifiées. Les images d'origine ne sont ni effacées ni remplacées.

## Tests réellement exécutés

Exécutés avec Node.js sur l'archive reconstruite :

```bash
for f in js/*.js; do node --check "$f"; done
node tools/validate_v26.js
node tools/test_v26_1.js
node tools/test_v26_2.js
node tools/test_v26_3.js
node tools/test_v26_4.js
node tools/test_v26_5.js
node tools/test_v26_6.js
node tools/test_v26_7.js
node tools/verify_file_launch_v26_5.js
```

**Tous réussis.** La nouvelle suite couvre : tous les combos de départ des héros, enchaînement après touche, non-annulation immédiate à vide, non-annulation d'un spécial, comparaison du délai effectif de cancel, tampon différencié, étourdissement/recul en réception, pose préparatoire des coups illustrés, références de mouvements et 30 étapes × 90 cycles simulés. Les anciens tests vérifient notamment chargement des étapes, phases DLC, progression, collisions, interaction RAMASSER et sauvegardes. **549 fichiers d'assets**, dont **544 WebP**, ont été comparés par hash SHA-256 à la V26.6 : identiques. Les anciens crédits et celui de la V26.6 restent présents.

## Ce que ces tests NE prouvent PAS

- Aucune mesure des FPS ou de la latence tactile sur téléphone ou PC ; aucune manette physique testée.
- Aucune partie complète de la campagne ou du DLC jouée manuellement ; pas de certification « AAA ».
- Aucun nouveau sprite illustré image par image : les changements d'animation reposent sur les poses existantes et leurs transformations.
- Les enchaînements, dégâts, réactions et boss nécessitent encore équilibrage et observations visuelles.
- Le démarrage par double-clic `file://` n'est vérifié ici que **statiquement**, et doit être essayé sur Chrome Windows.

## Lancement

1. Décompresser entièrement le ZIP en conservant `index.html`, `js/`, `css/`, `assets/`.
2. Essayer d'ouvrir `index.html` par double-clic. Si des ressources ne chargent pas, lancer un serveur statique depuis le dossier extrait : `python -m http.server 8087`, puis `http://localhost:8087/?nosw`.
3. Attention : les sauvegardes du navigateur dépendent de l'origine (port compris). Utiliser l'outil **Exporter/Importer** avant de changer d'origine et conserver un fichier de sauvegarde.
4. Essayer avec les trois héros un combo après un coup qui touche, puis répéter volontairement le même combo dans le vide et comparer la récupération.

## Chantier suivant envisagé

V26.8 : comportements spécialisés des ennemis et jetons d'attaque, puis patterns dédiés des boss. Ne pas annoncer cette passe comme réalisée tant que le code n'a pas été modifié et testé.

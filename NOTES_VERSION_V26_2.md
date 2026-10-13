# GHOSTLINK V26.2 — Progression (bêta)

Source : V26.1 Restauration intacte. Auteur passe : OpenAI GPT-6 (ChatGPT), 13 octobre 2026.

## Changements intégrés
- Records version 3 enregistrés dans la **nouvelle clé** `v12.recordsV3`, sans supprimer les anciennes clés `v12.progress` et `v12.settings`.
- Migration conservatrice des rangs historiques : pas de score/temps fictifs, records issus des victoires V26.2 uniquement.
- Tentatives enregistrées au lancement effectif d'un niveau ; victoires enregistrées une seule fois par tentative.
- Rang, meilleur score, meilleur temps, combo, dégâts minimaux, intégrité du convoi et médailles cumulatives.
- Menu « RECORDS & MÉDAILLES » et nouvelles récompenses affichées sur l'écran de fin.
- Le déblocage de campagne et l'interface des anciennes versions sont préservés.

## Médailles
- Intouchable : 0 dégâts.
- Chrono : victoire en moins de 4 minutes (seuil provisoire identique à la règle historique de bonus temps).
- Maître combo : 8 coups ou plus.
- Convoi 75 % : au moins 75 % de cohésion finale sur un niveau routier.
- Mission accomplie : objectif de route atteint.
- Sans faute : aucun dégât (et, pour DLC, convoi >= 75 % avec objectif réalisé).

## Tests et limites
Voir `tools/test_v26_2.js` pour les tests automatiques : migration, victoires, records, doublons, données invalides.
Ce travail ne prétend pas garantir que les trente niveaux ont été terminés par un humain dans un navigateur. Test visuel PC/mobile indispensable avant promotion en version stable.
Pour tester : depuis le dossier du jeu, `python -m http.server 8083`, puis `http://localhost:8083/?nosw`.

## Export/Import entre versions et ports locaux
- Utiliser « RECORDS & MÉDAILLES » → « EXPORTER MA SAUVEGARDE » pour obtenir un fichier JSON (progression + records, pas les réglages).
- Dans une autre version ou sur un autre appareil : « IMPORTER UNE SAUVEGARDE ». Fusion des meilleurs résultats, préservation des acquis, aucun effacement.
- Les ports `localhost:8080`, `8082`, `8083` n'ont PAS le même espace localStorage dans Chrome : l'export/import est nécessaire pour transférer une partie entre eux.
- Import uniquement de fichiers `GHOSTLINK_SAVE` v3 et de taille ≤1 Mo ; pas d'exécution de code. L'import ne permet pas de retrouver automatiquement un ancien port inaccessible.

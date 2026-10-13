# KINSHASA 243 : GHOSTLINK — V26.1 Restauration / tests

Date : 13 octobre 2026. Contributeur de cette passe : OpenAI GPT-6 (ChatGPT).

## Origines de la restauration

- Base **immutée en amont** : `KINSHASA243_GHOSTLINK_V26_RECONSTRUCTION_BETA.zip`.
- Référence historique de mécaniques : `Val Industries Beta4 code source.zip` (`ghostlink-v12/js/game.js`, variante V21).
- Source narrative et conception : `Superpdf_261013_134345.pdf` (78 pages), en particulier pages 37, 39-42, 58-68.
- Aucun ancien journal ni ancien contributeur n'a été supprimé.

## Changements effectivement codés

1. **COUP CHARGÉ** sur les trois héros : dans Options, mettre Combo automatique sur *Non* ; au sol, sans arme, maintenir COUP au moins 0,55 s puis relâcher. Le prochain coup de course a 1,6× les dégâts de base (pour ce coup uniquement). Un appui court déclenche une attaque classique au relâchement. Ce comportement n'altère pas les coups aériens, les armes ou les saisies ; avec combo auto sur *Oui*, le fonctionnement historique reste inchangé.
2. **FINISHER 8+** : si un coup élimine un ennemi ordinaire avec au moins huit coups au compteur, ajout du texte FINISH !, ralentissement, zoom, onde de choc et +500 points. Les boss gardent leur animation spécifique de victoire.
3. **Événements inter-niveaux** : remise à zéro de la liste d'événements lors de `startStage`, évitant de réafficher des notifications appartenant à l'étape précédente.
4. **Narration** : l'épilogue du DLC décrit le réseau GHOSTLINK comme un protocole de *Val Industries Corporation*. Cette formulation est **provisoire**, en attendant la validation du propriétaire du jeu sur le nom/titre final.
5. **Interface, distribution** : nouvelle explication du paramètre Combo automatique ; version V26.1 affichée ; retrait de deux préchargements de polices absentes de l'archive reconstruite pour éviter les requêtes 404 inutiles ; cache offline `sw.js` régénéré. Les polices pourront être restaurées séparément, sans perte du jeu.

## Tests automatisés reproduits

```bash
node tools/test_v26_1.js
node tools/validate_v26.js
for f in js/*.js tools/*.js; do node --check "$f"; done
python tools/build-sw.py
```

- Coup normal court en mode manuel : PASS
- Maintien 0,55 seconde et frappe chargée ×1,6 : PASS
- Bonus de charge effacé au prochain coup : PASS
- Appui immédiat en mode combo automatique : PASS
- Finisher 8+ et bonus 500 : PASS
- Absence de finisher avant 8 coups : PASS
- K.O. des boss inchangé : PASS
- Seuils du boss Joe-Vally DLC existants : PASS (structure provisoire)
- Données : 30 étapes / 5 sections / 25 définitions de boss, références valides : PASS
- Démarrage des 30 étapes et 60 pas simulés pour chacune : PASS
- Garage Carly quand toutes les améliorations sont possédées : PASS
- `node --check` sur tous les fichiers JS : PASS

## Limites et vérifications manuelles indispensables

- L'environnement de navigateur automatisé refuse l'ouverture de `http://localhost` (erreur `ERR_BLOCKED_BY_ADMINISTRATOR`) : **aucun test visuel Chromium réalisé dans cette passe**.
- La fluidité 60 FPS, l'équilibrage du coup chargé sur manette / tactile et le rendu sur appareil réel **ne sont pas certifiés**.
- Le final Joe-Vally à moto / béquilles / trois balises destructibles n'est **pas terminé**.
- Le GDD de la Traversée compte 14 étapes, contre 6 étapes codées. Huit étapes restent à développer, avec décors, patrons et scénario propres.
- Médailles détaillées, défis quotidiens, système de cosmétiques et sauvegarde versionnée avancée restent hors périmètre de V26.1 ; ne pas les annoncer comme déjà jouables.
- La structure fonctionnelle ne garantit pas que les 30 niveaux soient jouables de bout en bout ; cela exige un vrai playtest et une validation des sorties/boss.

## Essai PC Windows

1. Décompresser l'archive dans un **nouveau dossier** (ne pas écraser V26).
2. Ouvrir PowerShell dans `KINSHASA243_GHOSTLINK_V26_1` (il doit contenir `index.html`, `js/`, `css/`, `assets/`).
3. Exécuter `python -m http.server 8082`.
4. Ouvrir `http://localhost:8082/?nosw` dans Chrome. `?nosw` contourne le service worker pour la validation.
5. Tester coup normal, combo automatique, puis désactiver Combo automatique et tester le maintien 0,55 s + relâchement. Enchaîner huit coups puis éliminer un ennemi. Tester trois héros, un boss et le DLC, sans effacer les sauvegardes antérieures.
6. Ouvrir F12 → Console et Network en cas de problème. **Ne pas lancer directement `index.html` avec `file://`**, car les images peuvent ne pas s'afficher.

## Conservation et prochaines passes

Conserver toutes les archives historiques. V26.2 devrait se concentrer sur la sauvegarde versionnée, les rangs/médailles/records et le suivi de fin de stage, puis V27 sur les niveaux manquants, les assets originaux de Carly, de Joe-Vally et des motards fictifs.

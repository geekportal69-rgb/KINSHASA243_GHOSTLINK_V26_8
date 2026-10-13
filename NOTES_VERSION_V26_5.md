# KINSHASA 243 : GHOSTLINK — V26.5, Commandes & interactions

**13 octobre 2026 — branche bêta.** Base effective : V26.4 Routes Vivantes. Développeur principal : JOE-VALLY. Contributeur : OpenAI GPT-6 (ChatGPT). Brief d'audit/méthode fourni par Claude (Anthropic) et validé par le créateur. Les autres crédits restent inchangés.

## Réparations livrées

1. **Sprint / demi-tour (B1)** — `js/game.js`. Auparavant `p.running` restait actif si le joueur inversait horizontalement son déplacement sans relâcher le stick. Désormais l'inversion annule la course et remet à zéro le maintien ; la course automatique reprend après un nouveau maintien de 0,38 s et le double-appui reste valide.
2. **Attaque vs ramassage (B2)** — `js/game.js`, `js/core.js`, `index.html`, `js/ui.js`, `js/pad.js`, `css/style.css`. `COUP` est exclusivement une attaque. Une commande `RAMASSER` distincte sélectionne l'arme utilisable **la plus proche**, avec départage stable par identifiant. Une arme ne peut pas être ramassée plusieurs fois ; le bouton tactile apparaît uniquement près d'une arme.
3. **Jetons IA / allocations (B3)** — `js/game.js`. Trois comptages via `.filter(...).length` ont été remplacés par des compteurs sans tableaux temporaires (jetons attaquants, derniers ennemis, drones). Cette modification évite des allocations, sans constituer une mesure FPS sur matériel.
4. **Version visible (B4)** — `index.html`, `package.json`. Affichage V26.5, notes d'interface et description dans les crédits.
5. **Diagnostic des assets** — `js/render.js`, `js/sprites.js`, `js/ui.js`, `index.html`. Images manquantes signalées, présence des images initiales indiquée ; fallback graphique conservé. Le mode `file://` garde ses chemins locaux et ne requiert **pas** de serveur HTTP dans son architecture.
6. **Documentation et transmission** — CHANGELOG, README, journal historique des contributions, tests automatisés supplémentaires.

## Commandes de ramassage

| Support | Personnage | RAMASSER |
|---|---|---|
| Clavier | J1 | `E` ou `V` |
| Clavier coop | J2 | `Pavé numérique 0` ou `N` |
| Manette standard | J1/J2 | `View / Select` (Xbox) ou `Share / Select` (PlayStation), bouton standard 8 |
| Tactile | J1 | Bouton contextuel **RAMASSER**, proche des commandes d'action, affiché seulement quand une arme est au sol à portée |

`F/J` reste COUP, `H/L` reste SPÉCIAL (lance l'arme équipée), et les modes combo automatique/coup chargé sont inchangés.

## Démarrage sans PowerShell

1. **Décompresser le ZIP entièrement** dans un dossier. Ne pas déplacer `index.html` seul : garder `js`, `css`, `assets` avec lui.
2. **Double-cliquer sur `index.html`** dans l'Explorateur Windows. Le navigateur doit voir une adresse `file:///.../index.html`.
3. Lire le diagnostic sur l'écran de chargement. Le jeu signale maintenant les ressources initiales manquantes et utilise des silhouettes de secours si nécessaire.
4. Pour les sauvegardes : le stockage `file://` varie selon navigateur/chemin. Utiliser **Exporter la sauvegarde** puis **Importer** depuis le menu Records pour migrer entre installations.

L'option de serveur HTTP reste possible (`python -m http.server 8085`) et peut être utilisée si le navigateur local a des restrictions particulières. **Nous n'avons pas certifié le double-clic sous Windows** : Chromium headless ne s'est pas terminé dans l'environnement de test. Le vérificateur statique confirme les 11 scripts classiques et leurs fichiers présents, sans `fetch`, ES modules ou requêtes XHR dans les scripts chargés.

## Tests réellement exécutés

```bash
node tools/validate_v26.js
node tools/test_v26_1.js
node tools/test_v26_2.js
node tools/test_v26_3.js
node tools/test_v26_4.js
node tools/test_v26_5.js
node tools/verify_file_launch_v26_5.js
```

Les sept commandes passent. Les tests V26.5 vérifient : le coup près d'une arme, la priorité au plus proche, le refus du ramassage double, le demi-tour pendant un sprint, la réactivation après maintien, le double-appui, les entrées clavier J1/J2, le toucher simulé, la manette simulée et le reset lors d'une perte de focus. Le test `file://` est **statique** ; il ne garantit pas l'exécution réelle sous Chrome Windows.

## Contrôles non réalisés / travaux restants

- Aucune certification humaine d'une partie complète, des 60 FPS en continu, du rendu tactile Android, du gamepad physique ni de la persistance de `localStorage` sur `file://`.
- Coyote time, priorités avancées d'annulation, hitboxes par pose, 25 boss aux mouvements distincts, huit niveaux DLC manquants et nouveaux assets : **prochaines passes** ; non attribués à cette V26.5.
- Les polices originales ne sont pas redistribuées. Les polices de secours fonctionnent ; voir `assets/fonts/README.md` pour restaurer les polices depuis votre propre copie.
- Ne remplacez pas vos anciennes archives : V26.4 est conservée intacte. Les clés de sauvegarde `v12.*` et les 30 niveaux ne sont pas renommés.

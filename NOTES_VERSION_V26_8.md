# V26.8 — Enemy Tactics (bêta, 13 octobre 2026)

**Base :** V26.7 Hero Combat authentique. Les 24 communes, les 6 étapes DLC, les assets existants, les sauvegardes et les crédits antérieurs ne sont pas supprimés.

## Modifications réelles

- `js/data.js` : `ENEMY_TACTICS` attribue un rôle, une distance d'engagement, une marge d'encerclement et un ordre de priorité d'attaques aux huit types (`voyou`, `kuluna`, `boxeuse`, `molosse`, `garde`, `drone`, `sapeur`, `motard`). Pas de nouveau coup fictif : seules les références existantes de `MOVES` sont employées.
- `js/game.js` : sélection de coups par distance et opportunité, sans `map/filter` dans la boucle chaude ; rotation des coups et tactiques d'approche/encerclement selon type.
- Les **jetons d'attaque** ont un bail temporel : l'ennemi hors portée, blessé, projeté ou ayant fini son coup libère sa place. Les drones consomment désormais eux aussi un jeton pour tirer. Les boss classiques gardent leur priorité historique ; le colosse final conserve son moteur spécifique.
- La boxeuse esquive de manière réactive une attaque proche, avec un délai de 2,2 s entre les esquives, au lieu de probabilités continues par image.
- Les saisies libèrent leurs jetons lorsque le combat reprend.
- Métadonnées V26.8, journal d'IA, tests `tools/test_v26_8.js`, cache hors ligne régénéré.

## Tests exécutés

`node --check` pour les dix modules JavaScript ; `node tools/validate_v26.js` ; suites `node tools/test_v26_1.js` à `node tools/test_v26_8.js` ; `node tools/verify_file_launch_v26_5.js`.

La suite V26.8 teste les huit profils de combat et leurs mouvements, la sélection par distance, le plafond de jetons à difficulté normale (2), la libération après interruption, leur expiration hors portée, les drones, l'esquive, la rotation entre sept types sur 15 s simulées et les 30 étapes sur 90 cycles chacune.

## Limites

- Ce sont des règles d'IA et de mouvement sur les sprites existants, pas huit nouveaux jeux d'animations image par image.
- Aucun test de performance physique, aucun 60 FPS certifié sur Android ou Windows, aucun test manette réel, aucune campagne finie humainement.
- La difficulté et la lisibilité des télégraphes demandent du playtesting pour l'équilibrage.
- Les 25 boss de la campagne et les boss DLC ne disposent pas encore tous de patterns exclusifs ; chantier V26.9.
- Lancement `file://` toujours à confirmer sur le PC cible, malgré les vérifications statiques.

## Test conseillé

Lancer le jeu, choisir une difficulté, puis observer un groupe de voyou/kuluna/boxeuse/molosses : les ennemis en retrait encerclent ; seuls 1 à 4 ennemis selon la difficulté peuvent réserver une attaque simultanée. Vérifier le comportement avec drones et boss. Faire ensuite une partie avec les trois héros et dans la Traversée.

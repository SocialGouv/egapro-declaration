# EgaPro – Solen

Ce projet est une application cliente qui utilise l'API d'EgaPro, dont elle dépend.

Ce client utilise [Jekyll](https://jekyllrb.com/) pour créer les pages statiques.
Jekyll permet ici d'utiliser des templates réutilisables et d'éviter la réécriture des entêtes et pied de page.
Accessoirement il permet aussi d'utiliser des composants.

Il faudra donc installer Jekyll et lancer le project avec la commande

```
jekyll serve
```

Le client s'authentifie par _token_.

En parallèle, l'API pourra être lancée avec la commande `EGAPRO_REQUIRE_TOKEN=1 gmake serve`

## Choix technologiques

Par souci de facilité de développement et d'augmenter la pérennité du code, le code utilises HTML5 et ES6.

Afin d'augmenter la couverture de navigateurs, le projet demandera certainement à être transpilé pour être rendu compatible avec des navigateurs constatés comme utilisés dans les statistiques récentes.

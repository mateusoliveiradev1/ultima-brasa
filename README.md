# Última Brasa

Roguelike incremental 2.5D pós-apocalíptico (Canvas2D) + **Forja de Efeitos**, a ferramenta para pintar os efeitos das habilidades.

- 4 mapas (Ruínas, Pântano, Deserto, Tundra), 19 inimigos, 4 chefes, elites, baús, combo, eventos e modo infinito
- Árvore da Brasa com nós, pré-requisitos, Renascer (Cinzas), Patentes e Marcos
- Jogo roda 100% no navegador, em um único HTML

## Rodar / construir
```
npm ci
node build.mjs ultima   # dist/ultima-brasa.html
node build.mjs forja    # dist/forja-de-efeitos.html
```
O deploy no GitHub Pages é automático a cada push (Settings → Pages → Source: GitHub Actions).

Créditos de assets (Kenney, CC0) em `licenses/`.

## Forja de Mapas
Editor de mapas no navegador: `?editor=mapas` na página do jogo (ou `dist/forja-de-mapas.html`). Ferramentas: selecionar, carimbo, pincel, borracha, luz, trilha, terreno e ponto de partida; desfazer/refazer, avaliador de composição, exportar/importar JSON e "Testar no jogo" (`?map=local`).
Mapas publicados ficam em `data/maps/<bioma>.json` (o `build.mjs` gera o índice). Dentro dos limites do mapa vale o desenho; fora, o mundo continua procedural. `?map=0` ignora os mapas.

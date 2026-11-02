# DESIGN — Última Brasa

**Mundo:** ferro velho em brasa. Escuro quente, a luz vem de fogo e lanterna; o laranja só aparece onde há ação ou chama.

**Cor (estratégia: restrita + uma brasa)**
- Chão: `--void #0a0708`, `--soot #14100f`, `--char #221916`, `--umber #3a241b`.
- Texto: `--bone #e9dcc6` (principal), `--ash #b9ada0` (secundário; ≥ 7:1 sobre soot).
- Ação/brasa: `--ember #ff7a2a`, `--glow #ffb347`, `--flame #ffd98a`. Botão primário = fundo ember com texto `#1a0d06` (≥ 6,9:1).
- Biomas aparecem só como imagem do jogo, nunca como tema de UI. `--toxic #42e0b4` = sucesso/online. `--blood #c0322a` = erro.

**Tipografia:** Bebas Neue (títulos, números de ranking) · Rajdhani 500/600/700 (corpo e controles). Corpo ≥ 17 px, medida ≤ 65ch, títulos com `text-wrap: balance`. Sem gradiente no texto.

**Forma e profundidade:** raios 10–14 px, bordas de 1 px `rgba(233,220,198,.14)`, sombras com deslocamento e desfoque real (sem halo de brilho). Uma elevação por superfície.

**Movimento:** um momento autoral por tela (landing: a imagem do jogo acende e se aproxima devagar na entrada; biomas expandem ao passar o mouse). Ease-out exponencial, `prefers-reduced-motion` respeitado.

**Proibido aqui:** eyebrow acima de títulos, cartões iguais de ícone+título+texto, emoji como ícone, gradiente em texto, glassmorphism decorativo.

**Estados obrigatórios:** hover, foco visível (anel ember 2 px), desabilitado, carregando, erro com recuperação, vazio com convite.

# Recursos visuais

- `logo.png`: logo original fornecida pelo usuário, copiada de `21 Sem Título_20260930202926 1 (1).png`, preservando a transparência.
- `landscape.png`: paisagem original gerada com a ferramenta integrada `imagegen`, mantida na tela de acesso.
- `sky.png`: céu original gerado com a ferramenta integrada `imagegen`, usado na área de monitoramento.
- As folhas animadas são elementos SVG definidos em `src/components/LeafScene.tsx`, separados do fundo para permitir o parallax.

As referências enviadas orientaram a atmosfera e a paleta. Os fundos gerados não reproduzem as interfaces nem os textos dessas referências.

## Página inicial atual

Os arquivos locais em `src/home/assets` foram fornecidos pelo usuário:

- `ecobyte-logo.png`: marca usada na home aprovada.
- `hero-landscape.png`: `Lago Alpino ao Entardecer.png`.
- `hero-lugano.jpg`: `xiaozhe-yao-UnpbQF0H5dA-unsplash.jpg`.
- `hero-lakes.jpg`: `omri-d-cohen-ISdle_qVhnM-unsplash.jpg`.
- `hero-mountains.jpg`: `omri-d-cohen-Ur-5Qiq4oFY-unsplash.jpg`.
- `hero-lagoon.jpg`: `pexels-marcelo-mora-203572590-37544007.jpg`.

## Prompt final · landscape.png

```text
Use case: photorealistic-natural. Asset type: background photograph for EcoByteMetrics sustainability software landing page. Create an original panoramic 16:9 high resolution photographic landscape: verdant Brazilian Atlantic forest covering rolling mountains, a turquoise lake winding through the valley, mist in the distant hills, luminous pale blue sky with soft white sunlit clouds filling the upper two thirds. Warm late morning sun softly glowing from upper left, natural airy solar light, peaceful optimistic sustainable future atmosphere. Fine botanical detail on right foreground, mostly open sky and softly lit hazy lake to the left for dark text overlay. Realistic premium editorial landscape photography, subtle teal greens, pale cyan skies and warm ivory sunlight. No text, no logos, no website UI, no buildings, no floating leaves (animated leaves will be separate HTML elements). This is a background asset only, not a screenshot. Save the resulting image so it can be copied to the local frontend project.
```

## Prompt final · sky.png

```text
Use case: photorealistic-natural. Asset type: original panoramic 16:9 blue sky background photograph for EcoByteMetrics environmental software dashboard. A luminous clear pale cyan blue sky with soft airy white cumulus clouds near the borders and bottom, warm sunlight shining gently from upper left, beautiful natural soft solar illumination. Mostly open sky in center with unobtrusive fine clouds. Premium natural editorial landscape photography, airy optimistic morning light. SKY ONLY, no ground, no forest, no mountains, no leaves, no text, no UI, no logo. It will sit behind white translucent dashboard cards, so keep the sky very soft and pale and the overall image light.
```

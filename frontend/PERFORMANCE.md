# Comparação do globo

As mudanças preservam as cores, os contornos, os agrupamentos de serviços e as animações da câmera. Não existe limite artificial de FPS. Aparelhos sem WebGL 2 continuam podendo usar a lista de aplicações.

## Verificações automatizadas

```powershell
npm test
node --experimental-strip-types scripts/benchmark-globe.mjs
```

O benchmark compara geometrias, não mede FPS. Os 288 polígonos anteriores exigiam até 576 desenhos para preenchimentos e contornos. A versão agrupada usa 2, com os mesmos triângulos. Esfera, atmosfera e demais elementos não entram nessa contagem.

Durante uma interação, a resolução do canvas fica em 75% da resolução normal por dimensão: 56,25% dos pixels originais. Ela é restaurada 250 ms após a interação terminar. Textos, bandeiras e marcadores HTML mantêm sua resolução.

O canvas agora é opaco sobre o fundo branco do dashboard. A suavização das bordas permanece ligada. Gradientes brancos estáticos substituem a máscara CSS do canvas; a equivalência visual e o efeito sobre FPS precisam ser conferidos no navegador.

## Comparação no navegador

As opções abaixo existem apenas no servidor de desenvolvimento. Recarregue a página após mudar a URL. Em produção, elas são ignoradas.

Use `http://localhost:5173/dashboard` seguido de uma das consultas:

| Comparação | Consulta |
| --- | --- |
| Referência anterior | `?globeBatch=0&globeMask=legacy&globeAlpha=1&globeAdaptive=0` |
| Apenas agrupamento | `?globeBatch=1&globeMask=legacy&globeAlpha=1&globeAdaptive=0` |
| Apenas gradientes no lugar da máscara | `?globeBatch=0&globeMask=overlay&globeAlpha=1&globeAdaptive=0` |
| Apenas canvas opaco | `?globeBatch=0&globeMask=legacy&globeAlpha=0&globeAdaptive=0` |
| Apenas resolução adaptativa | `?globeBatch=0&globeMask=legacy&globeAlpha=1&globeAdaptive=1` |
| Sem máscara, para diagnóstico visual | `?globeBatch=0&globeMask=off&globeAlpha=1&globeAdaptive=0` |
| Todas as otimizações | sem consulta |

Mantenha tamanho da janela, zoom do navegador e máquina iguais. Espere o globo carregar. Grave 10 segundos de rotação automática e 10 segundos arrastando e usando zoom. Repita três vezes por variante e compare medianas, frames perdidos e a gravação da aba Performance. Não mantenha versões em outras abas animando ao mesmo tempo.

Confira também seleção/desseleção, agrupamentos em Ashburn e Toronto, alinhamento dos marcadores, limites do zoom, tela estreita e preferência por movimento reduzido.

Depois, repita a versão otimizada com `npm run build` e `npm run preview`, em aparelhos com GPUs diferentes. A limitação de CPU do DevTools não simula uma GPU mais fraca. Registre navegador, resolução, estado de WebGL 2 e FPS; uma única máquina não comprova compatibilidade de desempenho com todas as outras.

## Limite da validação nesta sessão

Build, lint, geometrias e controladores podem ser verificados localmente. A medição comparativa de FPS e a aprovação visual das máscaras dependem de acesso ao navegador. Nenhum valor de FPS foi estimado a partir da redução de desenhos ou de pixels.

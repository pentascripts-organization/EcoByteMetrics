# Verificação do frontend

## Verificações automatizadas locais

Execute na pasta `frontend/`:

```powershell
npm test
npm run lint
npm run build
docker compose -f compose.yaml config --quiet
node --experimental-strip-types scripts/benchmark-globe.mjs
node --experimental-strip-types scripts/benchmark-monitoring.mjs
```

Os testes HTTP não acessam as APIs reais. Usam respostas controladas para conferir descoberta inicial, dados inválidos, catálogo indisponível, ausência de coordenadas, serviço incorreto, 404, intervalo inválido, limites de concorrência e cancelamento. Os testes de renderização verificam abas, posições relativas do conteúdo, avisos, filtros, cobertura e links. Eles não provam a aparência no navegador.

Resultado local desta revisão: **117 testes passaram**, sem falhas. Lint, build de produção (incluindo TypeScript), verificação de espaços do diff e configuração do Compose passaram. O build continua informando o tamanho elevado do chunk do globo, carregado separadamente; a biblioteca 3D ainda exige conferência em hardware real.

Os testes da evolução também cobrem variações de horário perto da virada de 30 segundos, lacunas reais, estimativas ausentes, pausas da interface, respostas repetidas e diagnósticos limitados à aplicação e ao instante selecionados. A renderização verifica a seção Lacunas com um trecho por página e tooltips que preservam valores zero. A API atual não permite reconstruir causas históricas que a interface não registrou.

### Servidores locais e cache de desenvolvimento

Na conferência em execução, o frontend em `localhost:5173`, o backend em `127.0.0.1:3000`, `/health`, a descoberta pelo proxy e as métricas das oito aplicações responderam com HTTP 200. Isso verifica disponibilidade e comunicação; não comprova banco, autenticação ou histórico persistido da `develop`.

Uma execução inicial do teste de integração havia compartilhado o cache padrão do Vite com o servidor ativo. Bibliotecas passaram a responder com HTTP 504, levando à tela de erro da interface. O teste agora usa `node_modules/.vite-tests`, com descoberta de dependências desativada. O frontend foi reiniciado com `npm run dev -- --force`; as bibliotecas voltaram a responder com HTTP 200. Uma aba que já entrou na tela de erro precisa ser recarregada.

## Desempenho: medição de 23/10/2026

O script de monitoramento gera 201.600 amostras, equivalentes a dez aplicações, sete dias e intervalo de 30 s. Na primeira execução local, a construção da série levou aproximadamente 1.045 ms. Após evitar a conversão de datas a cada comparação da ordenação, levou aproximadamente 410 ms. O ranking levou aproximadamente 322 ms e a simplificação do desenho cerca de 4 ms. Os 20.160 pontos do acumulado foram reduzidos a 180 elementos desenhados, mantendo o valor final.

São medições isoladas de CPU com dados sintéticos. Tempos e memória variam entre execuções e computadores; não equivalem a FPS ou a uma comparação controlada entre dispositivos. O volume pode bloquear a interface em máquinas mais lentas; a integração com histórico paginado/agregado deverá ser reavaliada na etapa 3.

O script geométrico confirmou duas partes de desenho para países e contornos, contra 576 no modelo anterior, mantendo 10.342 triângulos. A construção local levou cerca de 247 ms; atualizar as cores, cerca de 0,28 ms. Isso conta apenas os objetos dos países; a cena completa inclui outros elementos e seus próprios custos.

O globo já limita a resolução ao orçamento de pixels e reduz a resolução durante a interação. Vídeos inativos usam `preload="none"`; o vídeo ativo pausa fora da seção ou com a aba oculta. O globo pausa com a aba oculta e com seu espaço oculto. As preferências de movimento reduzido continuam respeitadas.

## Conferência visual ainda necessária

Nenhum navegador estava conectado às ferramentas nesta revisão. Verificar manualmente em `npm run dev` ou `npm run preview`:

1. Desktop em 1920×1080, 1366×768 e janela baixa: lista alcançável por rolagem, filtros abertos sem cortar o conteúdo, globo ancorado à esquerda.
2. Celular em 320, 390 e 680 px: cabeçalho e campos sem rolagem horizontal da página, alternância Serviços/Mapa e detalhes legíveis.
3. Zoom do navegador a 200%: controles e texto acessíveis, sem impedir o acesso às linhas finais.
4. Teclado: navegação principal, busca, filtros, abas por setas/Home/End, aplicações, retorno do foco à linha, comparação e regiões roláveis.
5. Preferência de movimento reduzido: sem animações de entrada, rotação automática ou vídeos em reprodução.
6. FPS: registrar 15 s parado e 15 s arrastando/zoom em pelo menos uma máquina com GPU integrada e um celular, usando o mesmo build e viewport. Conferir tarefas longas, memória e recuperação de contexto WebGL.
7. Rede lenta e falhas: preservar dados válidos, aviso visível, retomada automática e nenhuma falsa emissão zero.
8. Home, 404 e navegação de ida/volta: título atualizado, links corretos e transição sem bloquear o acesso.

Não é possível garantir uma taxa de FPS para todos os computadores apenas com os testes de código.

## Docker

A configuração do Compose pode ser validada sem iniciar os serviços. O Docker CLI está instalado, mas o mecanismo Linux do Docker Desktop estava indisponível nesta revisão. A imagem e o Nginx em execução ainda precisam ser verificados:

```powershell
docker compose -f compose.yaml up --build -d
curl.exe -I http://localhost:5173/dashboard
curl.exe -I http://localhost:5173/comparar
curl.exe -I http://localhost:5173/index.html
curl.exe -I http://localhost:5173/assets/inexistente.js
```

Os dois primeiros acessos devem entregar a SPA, o HTML deve exigir revalidação, e o asset inexistente deve retornar 404. Conferir também `/backend/services` com o backend real iniciado.

## Retomar após a correção da develop

- **Histórico:** acordar o contrato de consulta por aplicações e intervalo, fuso, paginação/agregação, unidades, cobertura e amostras incompletas. Substituir o histórico de sessão pelo persistido, sem duplicar cálculos ou consultas.
- **Login:** verificar o endpoint e o contrato de autenticação; integrar sessão, expiração, saída e tratamento de 401. A proteção real das operações deve estar no backend.
- **Configurações:** confirmar quais operações existem e quais exigem autenticação. Implementar apenas ações reais com respostas e erros verificáveis.
- **Integração final:** executar descoberta, remoção, retorno, falhas, fatores de carbono, histórico e comparação junto ao backend atualizado. Depois preparar o merge com `develop`.

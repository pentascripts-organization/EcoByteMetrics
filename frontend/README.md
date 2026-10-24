# Frontend EcoByteMetrics

Interface em React e TypeScript, compilada com Vite. Esta branch mantém o frontend separado da `develop` até a conclusão das melhorias e da integração com o backend atualizado.

## Executar

Use Node.js 24 e npm. Na pasta `frontend/`:

```powershell
npm ci
npm run dev
```

Se precisar configurar a conexão, crie `.env.local` a partir de `.env.example`, somente se ele ainda não existir. Não substitua configurações locais já existentes. O Vite usa a porta 5173; confira o endereço informado no terminal.

| Variável | Padrão | Uso |
| --- | --- | --- |
| `VITE_BACKEND_URL` | `/backend` | Endereço público da API no navegador |
| `BACKEND_PROXY_TARGET` | `http://127.0.0.1:3000` | Destino do proxy do Vite |
| `VITE_CARBON_URL` | `https://carbon.unilaunch.org` | Catálogo de fatores de carbono |

O proxy remove `/backend` antes de encaminhar a consulta. Reinicie o Vite após mudar o ambiente. Variáveis `VITE_` são públicas e incorporadas no build; não use senhas ou tokens nelas.

A home, a página 404 e as telas de acesso podem ser abertas sem o backend. Monitoramento e comparação precisam de respostas da API para mostrar aplicações reais; não existe modo de demonstração automático.

## Rotas

| Rota | Comportamento |
| --- | --- |
| `/` | Landing page com quatro vídeos, seções explicativas e acesso ao dashboard |
| `/dashboard` | Lista, filtros, estados, globo, resumo e evolução das amostras |
| `/dashboard?servico=ID` | Resumo, recursos e evolução da aplicação; globo permanece à esquerda no desktop |
| `/comparar` | Seleção de duas ou mais aplicações, tabela com o mesmo intervalo e cobertura por aplicação |
| `/login`, `/cadastro` | Telas existentes com envio desativado; aguardam integração real |
| `/gerenciamento` | Funcionalidade pendente do backend |
| `/pesquisa`, `/servicos` | Redirecionam ao dashboard preservando a consulta |
| `/servicos/:id` | Redireciona ao detalhe da aplicação |
| `/energia`, `/emissoes` | Redirecionam à evolução com a métrica correspondente |
| Outras | Página 404 |

Busca, estado, país, região, cidade, período e data são mantidos na URL. A navegação entre monitoramento e comparação preserva esses filtros e as seleções de comparação. Os estados do serviço são os da consulta atual, ou da observação selecionada explicitamente na linha do tempo; escolher uma data limite de amostras não reconstrói estados passados do servidor.

## Dados, cálculos e limites

O adaptador `src/features/monitoring/api/monitoring.ts` consulta:

| Consulta | Endpoint padrão |
| --- | --- |
| Descoberta de aplicações | `GET /backend/services` |
| Recursos da aplicação | `GET /backend/metrics/:id` |
| Fatores regionais | `GET https://carbon.unilaunch.org/regions` |

O transporte compartilhado fica em `src/shared/lib/http.ts`: solicita JSON, impede cache das consultas, admite cancelamento e aplica um limite de 10 segundos por requisição, incluindo a leitura do corpo. Distingue falha de conexão, tempo limite, status HTTP e resposta inválida. As consultas de métricas são feitas em grupos de até seis.

Contratos utilizados:

- Descoberta: `{ services: [...], lastUpdatedAt: "ISO com fuso" }`. Data nula indica descoberta ainda não concluída. Cada serviço tem `id`, nome e localização opcionais.
- Métricas em cache: `{ serviceId, metrics: { collection_interval_seconds, metrics: { cpu_percent, memory_gb, disk_gb, network_gb } }, updatedAt }`.
- Também é aceito o formato direto `{ collection_interval_seconds, metrics: { ... }, collectedAt }`.
- Horários precisam incluir o fuso. CPU deve ficar entre 0 e 100; recursos devem ser finitos e não negativos; o intervalo é um inteiro positivo.
- Dados ausentes não viram zero. Erros `service_not_found` e `metrics_missing` distinguem remoção e ausência de métricas.

As estimativas ainda são calculadas no frontend. O modelo em `domain/energy.ts` usa CPU de 100 W na utilização máxima, RAM de 0,375 W/GB, disco de 0,01 W/GB e rede de 0,02 W/GB, multiplicados pela duração da amostra. Energia é exibida em kWh; emissões em g CO₂e são a energia multiplicada pelo fator regional. São estimativas, não medições elétricas.

- A consulta é repetida a cada 30 s enquanto a aba está visível no dashboard ou no comparador. Retornar à aba dispara nova consulta. Não há consultas simultâneas do mesmo ciclo.
- Falhas preservam os dados válidos anteriores. Na falha individual, os recursos preservados têm aviso e horário da última coleta válida; eles não geram uma nova amostra no histórico.
- Uma descoberta incompleta não permite inferir remoções. Aplicações removidas ficam ao final do ranking, inclusive quando possuem estimativas históricas maiores.
- Amostras com mais de três intervalos de idade, com mínimo de 90 s, são sinalizadas como desatualizadas. Esse estado não confirma uma queda do serviço.
- Falta de coordenadas impede somente o marcador. Lista, recursos e estimativas continuam disponíveis. Aplicações nas mesmas coordenadas são agrupadas, inclusive ao abrir seus detalhes.
- Tabela, totais e gráficos usam a mesma seleção. Estimativas incompletas de emissão aparecem como “—” no ranking, detalhe e comparação. O resumo identifica totais parciais e informa a cobertura.
- O histórico fica **somente na memória desta sessão**. Recarregar a página o apaga. A retenção de amostras observadas é de até 30 dias; a linha do tempo guarda até 3.000 observações. Selecionar 7 dias não recupera coletas anteriores à abertura da página.
- A comparação usa o mesmo intervalo solicitado, mas informa a quantidade e a duração somada das amostras de cada aplicação. Um total menor não comprova maior eficiência.
- O gráfico usa [Recharts](https://github.com/recharts/recharts), versão 3.10.1, sob licença MIT. Por intervalo mostra barras; Acumulado mostra pontos sem linhas de ligação, representando somente amostras recebidas. O eixo inclui segundos na resolução de 30 s. Eixos, tooltips e navegação por teclado usam os componentes da biblioteca. Os valores continuam disponíveis na seção Coletas, com paginação.
- A evolução abre no gráfico. As seções Gráfico, Aplicações, Coletas, Lacunas e Detalhes substituem o conteúdo no mesmo espaço; os indicadores e a cobertura aparecem só em Detalhes. O histórico da sessão fica no painel Filtrar, abaixo dos campos, inclusive nos detalhes de uma aplicação. Selecionar um instante e voltar ao vivo continuam disponíveis ali; Limpar filtros também encerra a revisão do passado. As listas exibem cinco registros por página. As amostras são agrupadas em intervalos de 30 s (até uma hora observada), 5 min (até um dia) ou uma hora (acima de um dia). Mouse, toque e setas do teclado permitem explorar o gráfico, por intervalo ou acumulado. Não há rolagem vertical dentro do painel; em telas pequenas ou com zoom alto, o documento pode rolar para manter o conteúdo acessível. Nos detalhes de uma aplicação, o painel permanece à direita do globo no desktop.
- A adaptação insere marcadores nulos e faixas em âmbar nos trechos sem registros; não cria valores zero nem interpola coletas. No agrupamento de 30 s, aplicações próximas pertencem à mesma rodada e uma tolerância de 15 s evita lacunas falsas por variação dos horários. Animações de redesenho foram desativadas para que novas consultas não façam o gráfico piscar. `react-is` está na mesma versão instalada de React, conforme orientação da biblioteca.
- A seção Lacunas apresenta um trecho por página e distingue ausência de registros de estimativa de emissões incompleta. O frontend guarda até 3.000 eventos da sessão: pausas por aba oculta ou saída do monitoramento, falhas de consulta, respostas repetidas e aplicações indisponíveis/sem métricas. Os eventos são relacionados ao trecho, à aplicação e ao instante em revisão. Eles são contexto observado pela interface, não um diagnóstico do coletor. Não existe causa histórica fornecida pela API atual; trechos sem evidência ficam com motivo desconhecido. Recarregar a página reinicia esses registros junto com o histórico local.
- A biblioteca de gráficos é carregada separadamente ao abrir o gráfico da evolução. Os avisos de licença das duas dependências diretas adicionadas estão em `public/licenses/`.

Histórico persistido, autenticação e configurações administrativas continuam pendentes da integração com a `develop`. A interface não simula essas capacidades.

## Verificar

```powershell
npm test
npm run lint
npm run build
npm run preview
```

Os testes cobrem contratos HTTP com respostas controladas, erros, cancelamento, preservação de dados, agrupamento geográfico, filtros, ranking, comparação, gráficos, câmera, rotação, transição e reprodução de vídeos. Os testes de telas usam renderização React no servidor; não executam o navegador ou o WebGL.

Procedimentos e limites das verificações estão em [docs/VALIDATION.md](docs/VALIDATION.md). O andamento e as dependências estão em [FRONTEND-PLAN.md](FRONTEND-PLAN.md).

## Distribuir somente o frontend

```powershell
docker compose -f compose.yaml config --quiet
docker compose -f compose.yaml up --build -d
```

Este Compose inicia apenas o frontend na porta 5173 e encaminha `/backend/` para `http://host.docker.internal:3000`. Configure `BACKEND_PROXY_TARGET` no ambiente do Compose se o backend estiver em outro endereço. O backend precisa executar separadamente; esse arquivo não instala banco, migrações ou serviços do backend.

`VITE_BACKEND_URL` e `VITE_CARBON_URL` são argumentos de build; mudanças exigem reconstruir a imagem. `BACKEND_PROXY_TARGET` é aplicado ao iniciar o Nginx. O fallback de rotas entrega `index.html` nos acessos diretos à SPA. O HTML exige revalidação de cache; arquivos de `/assets/` ausentes retornam 404.

## Organização

`app/` compõe rotas, layouts e providers. `features/home`, `features/auth` e `features/monitoring` contêm as funcionalidades. `shared/` reúne componentes, HTTP, preferências, estilos e geografia independentes das funcionalidades. O alias `@/` aponta para `src/`.

Não coloque credenciais no frontend nem implemente histórico fictício para contornar a ausência de endpoints. Validação de permissões e operações administrativas pertence ao servidor.

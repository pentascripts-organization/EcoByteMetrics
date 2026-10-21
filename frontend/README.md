# Frontend EcoByteMetrics

Interface web em React, TypeScript, Vite e React Router, com pesquisa por região, dashboard e navegação responsiva.

O frontend consulta o backend para obter serviços e métricas e consulta diretamente a API de carbono para obter fatores regionais. Na implementação atual, as estimativas de energia e emissões são calculadas no frontend.

## Organização

```text
public/assets/          # Logo única do projeto, também usada como favicon
src/
  app/                  # Composição da aplicação
    App.tsx             # Definição das rotas e controle de foco entre páginas
    layouts/            # Estrutura das telas de pesquisa e monitoramento
    pages/              # Página não encontrada e telas em construção
    providers/          # Composição dos dados e das preferências compartilhadas
    routes/             # Lista de rotas das funcionalidades em construção
    styles/             # Composição do CSS, navegação, feedback e ajustes finais
  features/
    home/               # Página inicial, conteúdo, carrossel e seções de apresentação
    auth/               # Tela de entrada e cadastro, ainda sem autenticação integrada
    monitoring/
      api/              # Comunicação HTTP e validação dos contratos recebidos
      components/       # Ranking, coletas, filtros, alertas e mapa
      contexts/         # Definição dos dados compartilhados de monitoramento e análise
      domain/           # Cálculos, histórico, análise, regiões e ordenação
      hooks/            # Acesso aos contextos da funcionalidade
      pages/            # Pesquisa regional e dashboard
      providers/        # Atualização periódica dos dados e aplicação dos filtros
      styles/           # Estilos do monitoramento e da visualização geográfica
  shared/
    assets/             # Fotografias compartilhadas entre a home e a tela de acesso
    effects/            # Folhas e movimento do ponteiro
    geography/          # Cartografia, traduções e tipos geográficos
    lib/                # Formatação e períodos aceitos
    preferences/        # Preferências locais do navegador
    styles/             # Tokens, base e estilos de componentes genéricos
    ui/                 # Componentes visuais independentes do monitoramento
  main.tsx              # Inicialização do React
  vite-env.d.ts         # Tipos do Vite utilizados pelo TypeScript
```

Esse é um resumo das pastas e dos arquivos de entrada. As configurações de npm, TypeScript, Vite, ESLint e Docker permanecem na raiz de `frontend/`.

O alias `@/` aponta para `src/` no TypeScript e Vite. `app` compõe as funcionalidades; `features` reúne o código de cada área; `shared` contém código reutilizável e independente. O ESLint restringe imports pelo alias de `app` dentro de features e de `app` ou features dentro de shared. Não crie diretórios vazios para funcionalidades futuras.

Os estilos globais entram por `src/app/styles/index.css`, com os ajustes de acessibilidade por último para manter sua precedência. Os estilos específicos da home continuam carregados com a página. A origem da cartografia está em [src/shared/geography/README.md](src/shared/geography/README.md).

## Execução local

Use Node.js 24, a mesma versão principal adotada no Dockerfile, e npm. A partir da raiz do projeto:

```powershell
cd frontend
npm ci
```

`npm ci` instala as dependências nas versões registradas no `package-lock.json`. Execute novamente quando precisar reinstalá-las ou quando o lockfile for atualizado.

Por padrão, o frontend espera o backend em `http://127.0.0.1:3000`. Para ajustar a conexão, crie `frontend/.env.local` a partir do exemplo, caso ainda não exista. Dentro de `frontend/`:

```powershell
Copy-Item .env.example .env.local
```

Os valores padrão são:

```dotenv
VITE_BACKEND_URL=/backend
BACKEND_PROXY_TARGET=http://127.0.0.1:3000
```

O Vite encaminha as requisições de `/backend` para `BACKEND_PROXY_TARGET`, removendo o prefixo. Variáveis com prefixo `VITE_` são públicas no navegador e não devem conter credenciais.

Mantenha o backend em execução em outro terminal, com as próprias variáveis de ambiente configuradas, incluindo `API_METRIC`. As variáveis acima configuram a conexão do frontend com esse processo.

Para iniciar a interface, dentro de `frontend/`:

```powershell
npm run dev
```

O endereço padrão é `http://localhost:5173`; confira a URL informada no terminal. A página inicial e as telas de acesso podem ser abertas sem o backend. A pesquisa e o dashboard precisam dele e das APIs externas para exibir dados atuais. Reinicie o servidor de desenvolvimento após alterar o arquivo `.env.local`.

## Build e visualização local

Dentro de `frontend/`:

```powershell
npm run build
npm run preview
```

O build verifica os tipos e gera a pasta `dist/`. O preview serve esse resultado, por padrão em `http://localhost:4173`, e usa o mesmo proxy do Vite. Após mudar o código, gere o build novamente para conferir o resultado no preview.

Para publicação, o Dockerfile gera `dist/` e o Nginx serve seus arquivos e encaminha `/backend/` para `BACKEND_PROXY_TARGET`. O `frontend/compose.yaml` inicia apenas a interface; o backend precisa estar disponível separadamente. Nesse Compose, o destino padrão é `http://host.docker.internal:3000`, enquanto o desenvolvimento com Vite usa `http://127.0.0.1:3000`. As variáveis do Compose são configuradas separadamente das variáveis de desenvolvimento em `.env.local`.

## Integração

Com `VITE_BACKEND_URL=/backend`, as consultas realizadas pelo navegador são:

| Consulta | Endpoint |
| --- | --- |
| Serviços | `GET /backend/services` |
| Métricas por serviço | `GET /backend/metrics/:id` |
| Regiões e fatores de carbono | `GET https://carbon.unilaunch.org/regions` |

O adaptador `src/features/monitoring/api/monitoring.ts` valida as respostas e converte os campos para os tipos utilizados pela interface:

- A lista de serviços deve conter `services` e um `lastUpdatedAt` válido. Um valor nulo indica que a descoberta inicial do backend ainda não terminou.
- Nas métricas retornadas pelo backend, o formato é `{ serviceId, metrics: { collection_interval_seconds, metrics: { ... } }, updatedAt }`.
- Também é aceito o formato direto `{ collection_interval_seconds, metrics: { ... }, collectedAt }`.
- Os campos de recursos são `cpu_percent`, `memory_gb`, `disk_gb` e `network_gb`. O horário da amostra deve ser válido e incluir o fuso horário.

A fórmula de energia fica em `src/features/monitoring/domain/energy.ts`. Ela usa CPU, memória, disco, rede e duração da coleta para estimar energia em kWh. As emissões em gCO₂e resultam dessa energia multiplicada pelo fator de carbono da região.

Cada amostra é identificada pelo serviço e pelo horário informado pelo backend. Consultas repetidas à mesma amostra não duplicam o histórico. Campos de localização ausentes continuam sem valor; o estado exibido depende das informações retornadas pelo servidor.

## Telas e navegação

| Rota | Conteúdo |
| --- | --- |
| `/` | Apresentação do projeto com carrossel de quatro paisagens |
| `/login`, `/cadastro` | Telas de acesso com autenticação indisponível; campos e envio desativados |
| `/pesquisa` | Seleção de país e cidade, associada ao código da região monitorada |
| `/dashboard` | Indicadores, estado dos serviços, ranking, tabela da última coleta por serviço e mapa |
| `/energia`, `/comparar`, `/gerenciamento`, `/emissoes`, `/servicos`, `/servicos/:id` | Telas em construção |

Na tela de entrada, o link “Criar conta” abre a pesquisa sem realizar cadastro. A rota `/cadastro` pode ser acessada diretamente, mas o cadastro continua indisponível. A pesquisa atualiza os dados da região selecionada e encaminha para o dashboard quando a seleção permite continuar; situações de dados parciais ou indisponíveis geram avisos. O menu completo fica disponível no dashboard e nas telas em construção; na pesquisa, o cabeçalho é simplificado.

O mapa do dashboard permite rotação e zoom. A troca de região é feita pelo link “Pesquisar outra região”. Endereços sem uma rota definida, incluindo `/configuracoes`, exibem a página 404.

## Dados e atualização

- A pesquisa e o dashboard iniciam consultas ao entrar na área de monitoramento, repetem a atualização a cada 30 segundos enquanto a aba está visível e consultam novamente ao voltar para a aba. Uma consulta já em andamento impede outra atualização simultânea.
- Os filtros disponíveis são últimas 24 horas e últimos 7 dias. A data e hora opcionais definem o fim do intervalo; sem essa seleção, é usado o horário da última coleta válida.
- O histórico é formado pelas amostras recebidas enquanto a aplicação está aberta. Ele fica em memória, é perdido ao recarregar a página e mantém uma janela de até 30 dias relativa à última coleta válida. Selecionar 7 dias não recupera automaticamente dados anteriores à abertura da aplicação.
- Os filtros de período e data afetam os indicadores históricos e o ranking. A tabela “Localização e coleta”, o estado e a localização dos serviços seguem a última consulta, mesmo quando uma data histórica está selecionada.
- Amostras com idade superior a três intervalos de coleta, com tolerância mínima de 90 segundos, recebem o aviso “Dados desatualizados”. Seus valores e horários são preservados para consulta; esse aviso não confirma uma queda do serviço. A verificação ocorre ao receber as métricas e ao preservar dados após uma consulta malsucedida.
- Consultas repetidas à mesma amostra reaproveitam o índice e a lista do histórico. A limpeza dos registros antigos só percorre a lista quando há amostras fora da janela de retenção.
- Os totais somam as estimativas das amostras disponíveis no intervalo selecionado. A cobertura pode ser menor que o período escolhido.
- O ranking mostra até cinco serviços por energia ou emissões estimadas. Na ordenação por emissões, serviços com estimativas de emissão incompletas nas amostras do período são omitidos.
- Quando uma consulta falha, os dados anteriores são preservados com uma mensagem de erro. Valores sem dados válidos são apresentados como indisponíveis; a interface sinaliza resultados parciais.
- A interface respeita a preferência de movimento reduzido do dispositivo.

## Validação

Na pasta `frontend/`:

```powershell
npm run lint
npm run typecheck
npm run build
```

A conferência das telas é manual. Execute `npm run dev` e verifique no navegador:

- Página inicial: logo, fotografias e acesso à tela de login.
- Pesquisa: seleção de país e cidade, avisos e abertura do dashboard.
- Dashboard: indicadores, filtros e atualização dos dados, com o backend disponível.
- Falhas de conexão: mensagens visíveis quando o backend estiver indisponível.
- Amostras antigas: aviso de dados desatualizados, com os valores e horários preservados.
- Alertas: “Tentar novamente” volta a mostrar o aviso quando o problema persiste.
- Telas pequenas: navegação e conteúdo sem cortes ou rolagem horizontal indevida.

Lint, TypeScript e build verificam problemas no código e na compilação; não substituem essa conferência. Valide também o fluxo com o backend e as APIs externas disponíveis. Este frontend não possui uma suíte de testes automatizados configurada.

## Design

- [Protótipo Figma](https://www.figma.com/design/ePuzwzqJXWtU6scgxSYcAd?node-id=1-2)
- [FigJam](https://www.figma.com/board/2CB9smqpP1vdC1twg7oNSD)

# Frontend EcoByteMetrics

Interface web em React, TypeScript, Vite e React Router, com pesquisa por região, dashboard e navegação responsiva.

## Execução local

Requisitos: Node.js 24 e npm. Execute os comandos na pasta `frontend/`:

```powershell
npm ci
npm run dev
```

O frontend fica disponível em `http://localhost:5173`. A pesquisa e o dashboard dependem do backend.

Para configurar a conexão, copie `.env.example` para `.env.local`:

```dotenv
VITE_BACKEND_URL=/backend
BACKEND_PROXY_TARGET=http://127.0.0.1:3000
```

O Vite encaminha as requisições de `/backend` para `BACKEND_PROXY_TARGET`, removendo o prefixo. Variáveis com prefixo `VITE_` são públicas no navegador e não devem conter credenciais.

## Integração

| Consulta | Endpoint |
| --- | --- |
| Serviços | `GET /backend/services` |
| Métricas por serviço | `GET /backend/metrics/:id` |
| Regiões e fatores de carbono | `GET https://carbon.unilaunch.org/regions` |

O adaptador `src/services/monitoring.ts` valida as respostas e converte os campos para os tipos utilizados pela interface. Aceita métricas no formato `{ serviceId, metrics, updatedAt }` ou no formato direto com `collectedAt`.

Cada amostra é identificada pelo serviço e pelo horário informado pelo backend. Consultas repetidas à mesma amostra não duplicam o histórico. Campos de localização ausentes continuam sem valor; o estado exibido depende das informações retornadas pelo servidor.

## Telas e navegação

| Rota | Conteúdo |
| --- | --- |
| `/` | Apresentação do projeto com carrossel de quatro paisagens |
| `/login`, `/cadastro` | Telas de acesso com autenticação indisponível e formulários desativados |
| `/pesquisa` | Seleção de país e região |
| `/dashboard` | Indicadores, estado dos serviços, ranking, tabela de coletas e mapa |
| `/energia`, `/comparar`, `/gerenciamento`, `/emissoes`, `/servicos`, `/servicos/:id` | Telas em construção |

Na tela de entrada, o link “Criar conta” abre a pesquisa sem realizar cadastro. A pesquisa consulta a região selecionada e encaminha para o dashboard. O cabeçalho de navegação fica disponível no dashboard e nas telas em construção.

O mapa do dashboard permite rotação e zoom. A troca de região é feita pelo link “Pesquisar outra região”. Endereços sem uma rota definida, incluindo `/configuracoes`, exibem a página 404.

## Dados e atualização

- A pesquisa e o dashboard consultam as APIs a cada 30 segundos enquanto a aba está visível.
- Os filtros disponíveis são últimas 24 horas e últimos 7 dias, com seleção opcional de data e hora.
- O histórico fica na memória da sessão e é perdido ao recarregar a página.
- Energia, emissões e rankings são estimativas calculadas a partir das amostras recebidas.
- A interface respeita a preferência de movimento reduzido do dispositivo.

## Validação

Na pasta `frontend/`:

```powershell
npm run verify:backend
npm run lint
npm run build
npm run test:e2e
```

`verify:backend` compara os arquivos de fora de `frontend/` com a referência local `origin/develop` e identifica arquivos novos fora dessa pasta. Execute `git fetch origin develop` para atualizar a referência antes da comparação. O script apenas lê os arquivos.

Os testes Playwright utilizam respostas controladas e perfis desktop e mobile. A variável `PLAYWRIGHT_PORT` define uma porta alternativa para o servidor de testes. A integração completa deve ser conferida também com o backend, o PostgreSQL e as APIs externas em execução.

## Design

- [Protótipo Figma](https://www.figma.com/design/ePuzwzqJXWtU6scgxSYcAd?node-id=1-2)
- [FigJam](https://www.figma.com/board/2CB9smqpP1vdC1twg7oNSD)

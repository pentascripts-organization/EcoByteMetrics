# Frontend — EcoByteMetrics

Interface web em React, TypeScript, Vite e React Router, com pesquisa por região, dashboard e navegação responsiva.

## Executar o frontend

Com Node.js 24 e npm, dentro de frontend:

```powershell
npm ci
npm run dev
```

O comando inicia o Vite na porta 5173. A pesquisa e os indicadores dependem de um backend disponível no endereço configurado.

Copiar frontend/.env.example para frontend/.env.local caso seja necessário configurar os endereços:

```dotenv
VITE_BACKEND_URL=/backend
BACKEND_PROXY_TARGET=http://127.0.0.1:3000
```

O Vite encaminha /backend para o destino configurado, removendo esse prefixo. Variáveis VITE_ são públicas no cliente; credenciais pertencem ao ambiente do backend, configurado pelos responsáveis.

## Integração

O frontend consome a descoberta em GET /backend/services e as métricas em GET /backend/metrics/:id. O adaptador aceita o envelope existente na develop com serviceId, metrics e updatedAt e mantém compatibilidade com o formato anterior com collectedAt. Carbono é consultado em https://carbon.unilaunch.org/regions.

O adaptador em src/services/monitoring.ts normaliza as respostas do backend para os componentes. Alterações no contrato da API devem ser acompanhadas por ajustes no adaptador e nos testes de integração do frontend.

Os horários da amostra vêm do backend. O frontend não fabrica uma nova amostra ao reler o mesmo cache. Cidade e coordenadas ausentes são preservadas como ausentes. A capacidade de sinalizar uma falha atual depende do contrato enviado pelo backend: a interface não consegue inferir uma falha ocultada pelo cache do servidor.

## Telas e regras mantidas

| Rota | Conteúdo |
| --- | --- |
| / | Apresentação com quatro paisagens e movimento reduzido |
| /login, /cadastro | Formulários desativados; “Criar conta” na entrada conduz à pesquisa sem cadastrar usuário |
| /pesquisa | Seleção de país e região, sem atalhos para outras páginas no cabeçalho |
| /dashboard | Visão geral da região e retorno para “Pesquisar outra região” |
| /energia, /comparar, /gerenciamento, /emissoes, /servicos, /servicos/:id | Nome da página e “Em construção”, sem iniciar coleta |
| /configuracoes | Tela removida; rota não encontrada |

No dashboard, o globo permite girar e aproximar, mas não trocar a região ou abrir serviços. Os serviços não aparecem como botões abaixo do mapa. O usuário retorna à pesquisa para escolher outra região.

Os períodos visíveis são últimas 24 horas e últimos 7 dias. O histórico permanece na memória da sessão do navegador e é perdido ao recarregar a página. As estimativas e os rankings da interface são calculados a partir das amostras recebidas do backend.

## Validação

Dentro de frontend:

```powershell
npm run verify:backend
npm run lint
npm run build
npm run test:e2e
```

Apesar do nome legado, verify:backend confere todos os arquivos compartilhados contra origin/develop e rejeita adições fora de frontend. A verificação é somente de leitura. Atualizar a referência com git fetch origin develop antes de conferir uma entrega; o comando não restaura arquivos nem faz fetch automaticamente.

Os testes Playwright usam respostas controladas em desktop/mobile. PLAYWRIGHT_PORT permite escolher outra porta. A validação do ambiente completo requer também um teste integrado com o backend, o PostgreSQL e as APIs externas.

## Design

- [Protótipo Figma](https://www.figma.com/design/ePuzwzqJXWtU6scgxSYcAd?node-id=1-2)
- [FigJam](https://www.figma.com/board/2CB9smqpP1vdC1twg7oNSD)

Pendência da Sprint 1: concluir e revisar o protótipo mobile no Figma.

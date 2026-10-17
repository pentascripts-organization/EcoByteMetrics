# Frontend — EcoByteMetrics

React, TypeScript, Vite e React Router. Esta pasta contém o trabalho de interface. A responsabilidade deste trabalho é exclusivamente o frontend; backend, banco, infraestrutura da raiz e documentação compartilhada seguem a branch develop da equipe.

## Executar o frontend

Com Node.js 24 e npm, dentro de frontend:

```powershell
npm ci
npm run dev
```

O comando inicia somente o Vite. Não instala, inicia ou altera o backend. O backend mantido pelos colegas deve estar disponível no endereço configurado. A interface pode abrir sem ele, mas pesquisa e indicadores dependem das respostas das APIs.

Copiar frontend/.env.example para frontend/.env.local caso seja necessário configurar os endereços:

```dotenv
VITE_BACKEND_URL=/backend
BACKEND_PROXY_TARGET=http://127.0.0.1:3000
```

O Vite encaminha /backend para o destino configurado, removendo esse prefixo. Variáveis VITE_ são públicas no cliente; credenciais pertencem ao ambiente do backend, configurado pelos responsáveis.

## Integração

O frontend consome a descoberta em GET /backend/services e as métricas em GET /backend/metrics/:id. O adaptador aceita o envelope existente na develop com serviceId, metrics e updatedAt e mantém compatibilidade com o formato anterior com collectedAt. Carbono é consultado em https://carbon.unilaunch.org/regions.

Atualizações na develop podem alterar o contrato. Ajustes necessários devem ser feitos no adaptador e nos testes do frontend. Problemas no código, build, coleta ou persistência do backend devem ser comunicados aos responsáveis; não devem ser corrigidos nesta entrega de frontend.

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

Os períodos visíveis são últimas 24 horas e últimos 7 dias. O histórico permanece na sessão do navegador. Os cálculos e rankings existentes na interface usam as amostras conhecidas e não comprovam um motor ambiental ou histórico implementados no backend.

## Verificar sem alterar o trabalho dos colegas

Dentro de frontend:

```powershell
npm run verify:backend
npm run lint
npm run build
npm run test:e2e
```

Apesar do nome legado, verify:backend confere todos os arquivos compartilhados contra origin/develop e rejeita adições fora de frontend. A verificação é somente de leitura. Atualizar a referência com git fetch origin develop antes de conferir uma entrega; o comando não restaura arquivos nem faz fetch automaticamente.

Os testes Playwright usam respostas controladas em desktop/mobile. PLAYWRIGHT_PORT permite escolher outra porta. Esses testes não comprovam execução do backend da equipe. As evidências anteriores que usavam alterações próprias no backend foram retiradas do projeto junto com essas alterações.

## Design

- [Protótipo Figma fornecido](https://www.figma.com/design/ePuzwzqJXWtU6scgxSYcAd?node-id=1-2)
- [FigJam fornecido](https://www.figma.com/board/2CB9smqpP1vdC1twg7oNSD)

O único frame mobile da cópia fornecida está em branco e o usuário confirmou que não existe outra versão preenchida. Essa pendência de interface continua aberta. Nenhum arquivo do Figma foi alterado.

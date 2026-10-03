# Frontend · EcoByteMetrics

Interface em React com TypeScript, Vite e React Router. A apresentação usa paisagem com luz solar; a área de monitoramento usa céu azul e painéis claros. A logo é a fornecida pela equipe.

## Executar com Docker

Na raiz do repositório, com Docker e Docker Compose instalados:

```sh
docker compose -f frontend/compose.yaml up --build -d
```

Acesse **http://localhost:5173**. Para encerrar:

```sh
docker compose -f frontend/compose.yaml down
```

O Dockerfile compila os arquivos e o Nginx serve a aplicação. O fallback para `index.html` permite acessar e recarregar diretamente qualquer rota. Este Compose executa apenas o frontend; a infraestrutura completa será integrada quando o backend estiver implementado.

## Desenvolvimento local

Para trabalhar na interface sem Docker, use Node.js 24 e npm:

```sh
cd frontend
npm ci
npm run dev
```

Comandos de verificação:

```sh
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Os testes de navegador verificam navegação, estados vazios, persistência de preferências, formulário de login, parallax, movimento reduzido e layout em desktop e celular. Para usar um Chrome já instalado, defina `PLAYWRIGHT_CHANNEL=chrome`; por padrão é usado o Chromium do Playwright.

## Telas disponíveis

| Rota | Conteúdo |
| --- | --- |
| `/` | Apresentação, proposta, funcionamento e propósito |
| `/dashboard` | Indicadores, histórico, estado do monitoramento e localização |
| `/servicos` | Lista, busca, filtro por estado e ordenação |
| `/emissoes` | Estrutura de análise de emissões e explicação do cálculo |
| `/energia` | Estrutura de análise de consumo e explicação do cálculo |
| `/comparar` | Seleção e estrutura de comparação de dois a quatro serviços |
| `/login` | Formulário visual de acesso com mostrar/ocultar senha |
| `/configuracoes` | Preferências locais de parallax e período padrão |

Rotas inexistentes apresentam uma página 404 com retorno ao início. O menu se adapta a telas menores, e cada página tem título próprio.

## Estado dos dados e autenticação

**Esta etapa implementa o frontend. Ainda não há conexão com o backend ou com as APIs auxiliares.**

- As listas e o histórico começam vazios. Energia, emissões e data da coleta são `null`, exibidos como `—`; contagens são `0`.
- A atualização manual e o seletor de período passam pelo adaptador de dados, que atualmente retorna uma estrutura vazia. Não há coleta periódica, métricas demonstrativas ou timestamps inventados.
- A busca e os filtros trabalham sobre a lista de serviços; a seleção de comparação fica desabilitada enquanto ela estiver vazia.
- O login não autentica nem cria tokens. Ao enviar, informa que a integração ainda está pendente e limpa os campos. A aplicação não envia ou salva as credenciais.
- As configurações atuais são somente de visualização. Elas ficam no `localStorage` deste navegador e não configuram a coleta. A proteção JWT das configurações de monitoramento será responsabilidade do backend.
- Falhas de armazenamento das preferências são informadas; falhas de carregamento de indicadores também têm tratamento visual.

## Organização e integração futura

```text
src/
  components/  Marca, cenas decorativas, layout e elementos compartilhados
  contexts/    Contratos de contexto de monitoramento e preferências
  hooks/       Acesso aos contextos e comportamento do parallax
  pages/       Telas acessíveis por rota
  providers/   Estado compartilhado, preferências e carregamento
  services/    Adaptador de dados para a integração futura
  types/       Serviços, estados, coletas e configurações tipados
  utils/       Formatação dos indicadores
  App.tsx      Rotas, títulos e navegação de página
  styles.css   Identidade visual, responsividade e animação
```

O ponto de integração é `src/services/monitoring.ts`, cujo contrato está em `src/types/monitoring.ts`. Definir as respostas reais do backend antes de substituir o adaptador por chamadas HTTP e configurar a coleta e a atualização. O frontend não consome diretamente as APIs auxiliares.

O parallax usa eventos de ponteiro e `requestAnimationFrame`, com profundidade diferente para cada folha, sem renderizações React a cada movimento. Pode ser desativado nas preferências. Telas de toque e a preferência `prefers-reduced-motion` evitam o movimento decorativo.

As fontes estão instaladas no projeto, sem chamadas a Google Fonts. As imagens também são locais; sua origem e os prompts estão em [public/assets/README.md](public/assets/README.md).

Referências de implementação: [React](https://react.dev/learn), [Vite](https://vite.dev/guide/) e [React Router](https://reactrouter.com/start/declarative/installation).

# Frontend EcoByteMetrics

Interface em React e TypeScript, com Vite e React Router.

## Executar

Para desenvolvimento local, use Node.js 24:

```sh
cd frontend
npm ci
npm run dev
```

O Vite usa a porta 5173. Se ela estiver ocupada, execute `npm run dev -- --port 5174`.

Para executar somente o frontend em um container, na raiz do repositório:

```sh
docker compose -f frontend/compose.yaml up --build -d
```

Acesse `http://localhost:5173`. Para encerrar, execute `docker compose -f frontend/compose.yaml down`.

## Telas

| Rota | Conteúdo |
| --- | --- |
| `/` | Página inicial, seletor PT/EN e folhas que acompanham o mouse |
| `/dashboard` | Indicadores, histórico e estado do monitoramento |
| `/servicos` | Busca, filtros e localização dos serviços |
| `/emissoes` | Indicadores e explicação do cálculo de CO₂e |
| `/energia` | Indicadores e explicação do consumo energético |
| `/comparar` | Comparação entre serviços |
| `/login` | Formulário de acesso |
| `/configuracoes` | Preferências locais de movimento e período de análise |

O menu adapta-se a dispositivos móveis. Rotas desconhecidas apresentam uma página 404. No container, o Nginx permite acessar diretamente as rotas da aplicação.

## Integração

Esta entrega contém a interface. A conexão com o backend e a autenticação ainda não estão implementadas.

`src/services/monitoring.ts` é o ponto de integração dos dados. Atualmente retorna listas vazias e valores nulos, exibidos como estados de espera. O contrato está em `src/types/monitoring.ts`.

O login informa que o acesso está pendente; não envia nem salva credenciais. As preferências de visualização ficam no armazenamento local do navegador e não configuram a coleta no servidor.

O valor de 0,072 gCO₂e na página inicial é o exemplo de cálculo da atividade, identificado como ilustrativo. O fundo é fixo, e as folhas usam uma camada transparente separada. Movimento reduzido e preferências de pausa são respeitados por padrão; a home permite ativação temporária explícita.

## Verificações

```sh
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Os testes verificam rotas, layout em desktop e celular, estados vazios, idioma, navegação, formulário de login, preferências e movimento das folhas.

Para usar outra porta nos testes, defina `PLAYWRIGHT_PORT`. Os arquivos de resultado, dependências instaladas e builds não fazem parte do código versionado.

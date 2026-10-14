# Integração do frontend

## Código do time preservado

Origem: pentascripts-organization/EcoByteMetrics, develop, commit 219a0ec2df4b2c02bcad002d54fe8822d147b731 (10/10/2026).

A base contém 39 arquivos versionados fora de frontend/. Com a alteração autorizada da #52, 36 permanecem byte a byte iguais à referência develop. As três exceções são backend/src/app.ts, backend/src/integrations/metrics-api.ts e backend/tests/services.service.test.ts. [Manifesto original](backend-origin.json) e [exceções autorizadas](backend-authorized-changes.json).

~~~powershell
cd frontend
npm run verify:backend
~~~

Instalações e compilações criam arquivos locais ignorados, sem alterar os arquivos versionados do time. A documentação adicional desta entrega foi mantida dentro de frontend/.

## Mudanças no frontend

Descoberta consome GET /services com { services, lastUpdatedAt }. Proxy /backend em Vite/Nginx; endereço público configurável. Métricas agora consomem GET /metrics/:serviceId do backend, com timestamp do recebimento validado. Carbono e cálculos permanecem no frontend até existirem contratos correspondentes no backend.

Foram corrigidos isolamento de dados inválidos, cobertura parcial, ranking por período, comparação normalizada, precisão numérica, seleção por código regional, mapa de serviços, distâncias temporais do gráfico, acessibilidade, carregamento de imagens e polling.

Nesta revisão, o contexto de região/período/data acompanha a navegação. A página de detalhes reúne recursos e histórico individual. A pesquisa invalida respostas atrasadas; comparação usa serviços válidos; login/cadastro são prévias desabilitadas; a aba de requisições mostra somente chamadas reais desta sessão. [Revisão](revisao-frontend.md) e [tour](tour-do-site.md).

Totais são soma de estimativas por coleta, com aviso de possível sobreposição. Histórico permanece em memória.

## Partes que faltam no backend

| Parte | Situação | Contrato necessário para o frontend |
|---|---|---|
| Métricas | Somente descoberta implementada | Métricas atuais e estados por serviço |
| Carbono | Integração vazia | Catálogo e fatores regionais |
| Cálculos | Não implementados | Indicadores calculados e unidades |
| Histórico | Módulos de coletas vazios | Consulta persistente por serviço/região/data |
| Autenticação | Sem login ou cadastro | Sessão e respostas de erro |
| Administração | Sem gestão de usuários/perfis | Autorização e operações |
| Configurações protegidas | Sem rotas/JWT | Consulta e alteração autorizada |

Nenhuma dessas funcionalidades foi acrescentada ao backend. Login, cadastro e gerenciamento permanecem identificados como prévias.

## Docker: alteração pendente de autorização

O compose.yaml original não envia API_METRIC ao backend, embora a descoberta exija essa variável. O .env de interpolação do Compose não entra automaticamente no container; o Dockerfile copia somente a pasta backend.

O script frontend/scripts/start-local.mjs inicia o backend local existente com API_METRIC definida no processo, instalando dependências ausentes. O código do backend permanece igual. Para Docker integrado, a proposta é acrescentar uma variável ao Compose principal:

~~~diff
 backend:
   environment:
     PORT: ${PORT}
+    API_METRIC: ${API_METRIC:-https://metrics.unilaunch.org}
~~~

A proposta não foi aplicada. Variáveis e credenciais PostgreSQL também precisam ser configuradas pelo responsável pela infraestrutura. /health confirma HTTP, não conexão com banco.

## Limites

A entrega anterior verificou build e testes originais do backend e integração HTTP real em /health, /services e no proxy /backend/services. A revisão atual mantém o backend e amplia os testes de navegação, filtros, cancelamento, detalhes e diagnósticos em desktop e celular. Os resultados atuais estão registrados em revisao-frontend.md.

- O agregador informa duração, sem início/fim do intervalo ou ID de amostra. Não permite comprovar cobertura contínua sem sobreposição.
- Ranking por soma depende da quantidade e duração das observações. Taxas normalizadas não medem eficiência por transação.
- Histórico e filtros abrangem somente esta sessão. Estados e renováveis permanecem referentes à última consulta.
- O mapa da pesquisa mostra referências do carbono; dashboard usa coordenadas dos serviços.
- Docker e PostgreSQL não foram executados nesta máquina, que não dispõe de Docker.

## Interface simplificada

Modo de demonstração, controle Ver todas as regiões e simulação de destino removidos. Indicadores consultam automaticamente as APIs a cada 30 segundos e ao retomar uma aba visível, sem botão de atualização no cabeçalho. Nenhuma alteração no backend.

## Inicialização em outro computador

npm run dev no frontend prepara e inicia o backend da equipe se não houver um servidor local ativo; npm run dev:frontend mantém a execução separada. BACKEND_PROXY_TARGET escolhe o destino no servidor. AUTO_START_BACKEND=false desativa a inicialização automática. O script não modifica o código ou o .env do backend.

O catálogo de regiões é preservado quando a descoberta falha, permitindo escolher cidades enquanto o monitoramento recupera a conexão. A API externa de carbono ainda precisa estar acessível. Não há fallback de descoberta que ignore o backend da equipe.

Verificado com uma cópia sem .env e sem dependências do backend: instalação automática, descoberta real, escolha de São Paulo e dashboard com emissões. Build/lint aprovados e 44 cenários de API, conexão e pesquisa aprovados considerando a reexecução dos dois casos adaptados ao catálogo independente. Docker não foi executado nesta máquina; o template e a configuração do frontend foram ajustados, mantendo o Compose compartilhado intacto.


## Contrato da #52

GET /metrics/:serviceId consulta o agregador e acrescenta collectedAt em UTC somente a uma resposta com métricas válidas. 404 e 500 do agregador são preservados; invalid_metrics e falhas de conexão retornam 502; timeout retorna 504. Não representa o instante da medição na origem. O frontend guarda timestamps por serviço e preserva o último horário válido em caso de falha. O agrupamento por ciclo usa o maior timestamp válido do ciclo, mantendo o timestamp individual de cada registro.

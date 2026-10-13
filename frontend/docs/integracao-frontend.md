# Integração do frontend

## Código do time preservado

Origem: pentascripts-organization/EcoByteMetrics, develop, commit 219a0ec2df4b2c02bcad002d54fe8822d147b731 (10/10/2026).

Os 39 arquivos versionados fora de frontend/ correspondem byte a byte à develop, incluindo backend, banco, documentação compartilhada, modelos MER/DER, README e infraestrutura. [Manifesto e hashes Git](backend-origin.json).

~~~powershell
cd frontend
npm run verify:backend
~~~

Instalações e compilações criam arquivos locais ignorados, sem alterar os arquivos versionados do time. A documentação adicional desta entrega foi mantida dentro de frontend/.

## Mudanças no frontend

Descoberta consome GET /services com { services, lastUpdatedAt }. Proxy /backend em Vite/Nginx; endereço público configurável. Métricas, carbono e cálculos continuam provisórios até existirem contratos no backend.

Foram corrigidos isolamento de dados inválidos, cobertura parcial, ranking por período, comparação normalizada, precisão numérica, seleção por código regional, mapa de serviços, distâncias temporais do gráfico, acessibilidade, carregamento de imagens e polling.

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

A execução local foi verificada com API_METRIC definida no processo. Para Docker integrado, a proposta é acrescentar uma variável ao Compose principal:

~~~diff
 backend:
   environment:
     PORT: ${PORT}
+    API_METRIC: ${API_METRIC:-https://metrics.unilaunch.org}
~~~

A proposta não foi aplicada. Variáveis e credenciais PostgreSQL também precisam ser configuradas pelo responsável pela infraestrutura. /health confirma HTTP, não conexão com banco.

## Limites

Verificações realizadas: build e lint do frontend; 71 testes Playwright aprovados em desktop/celular, com um teste de parallax ignorado no celular; build e três testes originais do backend aprovados; hashes dos 39 arquivos fora de frontend/ conferidos. Integração HTTP real validada em /health, /services e no proxy /backend/services.

- O agregador informa duração, sem início/fim do intervalo ou ID de amostra. Não permite comprovar cobertura contínua sem sobreposição.
- Ranking por soma depende da quantidade e duração das observações. Taxas normalizadas não medem eficiência por transação.
- Histórico e filtros abrangem somente esta sessão. Estados e renováveis permanecem referentes à última consulta.
- O mapa da pesquisa mostra referências do carbono; dashboard usa coordenadas dos serviços.
- Docker e PostgreSQL não foram executados nesta máquina, que não dispõe de Docker.

# Task #52 — horário das coletas

Implementação autorizada em 14/10/2026.

## Alterações

- Backend: 49 linhas adicionadas em src/integrations/metrics-api.ts e 19 em src/app.ts; 68 linhas de produção ao todo, sem remoções.
- GET /metrics/:serviceId valida a resposta externa e retorna collectedAt em UTC. O horário representa recebimento validado pelo backend, não medição na origem.
- Teste do contrato acrescentado a backend/tests/services.service.test.ts, cobrindo sucesso, 404/500, métricas inválidas, JSON inválido, falha de rede e timeout.
- Frontend usa a rota do backend, valida o timestamp, mantém horários por serviço e preserva a última coleta válida e o histórico em falhas.
- Gráficos, ranking e comparação mantêm agrupamento por ciclo, preservando horários individuais das observações.
- Consulta automática de 30 segundos enquanto a página está visível; intervalo de amostragem continua separado.

## Verificação

Build backend/frontend, lint frontend e verificação dos arquivos do time aprovados. Quatro testes do backend aprovados. Suíte frontend: 91 cenários aprovados inicialmente; 10 cenários com mocks da rota externa antiga corrigidos e aprovados na reexecução; um teste de parallax ignorado em dispositivos móveis por usar decoração estática. Total: 101 cenários aprovados, 1 ignorado.

Consulta real: descoberta de 8 serviços, resposta HTTP 200 com timestamp e intervalo. Navegação real no navegador: oito chamadas de métricas pelo backend, sem chamadas diretas ao agregador de métricas e sem erros JavaScript; horário visível no cabeçalho e detalhe individual.

Manifesto original preservado em backend-origin.json. Exceções autorizadas dos dois arquivos de produção e do teste registradas em backend-authorized-changes.json.

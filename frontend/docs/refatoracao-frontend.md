# Revisão e otimização do frontend — 14/10/2026

## Mudanças

- Validação de datas locais pelo calendário; datas inexistentes não são normalizadas silenciosamente.
- Identificação independente dos ciclos de consulta. Gráficos e ranking usam o maior horário dos registros incluídos no filtro, mantendo timestamps individuais.
- Formatação numérica reutiliza dois Intl.NumberFormat.
- Análises memorizadas; índices de serviços, regiões e histórico evitam buscas aninhadas.
- Contexto de requisições separado do contexto de monitoramento.
- Tabela de coletas montada apenas quando aberta, com paginação de 50 registros. A retenção de 30 dias permanece completa, sem novo limite por quantidade de registros.
- Máximos calculados por redução, sem espalhar históricos como argumentos de funções.
- CSS de componentes removidos excluído; declarações sobrescritas e regras adjacentes consolidadas preservando a cascata.
- JSX formatado, rótulos de status compartilhados e conteúdo sem uso retirado.
- Páginas e layout carregados sob demanda; globo montado perto da área visível.
- Fotos para celular de 960 px.
- Proxy /backend também funciona em npm run preview.

## Resultados

Arquivo JavaScript principal: aproximadamente 557 KB para 271 KB antes da compressão (51% menor). Quatro fotos de celular: 718 KB contra 2.559 KB das versões maiores (72% menos bytes). O módulo do globo continua com aproximadamente 1,77 MB, carregado somente quando necessário. Dependências da aplicação não foram alteradas.

## Validação

Build, lint e verificação dos arquivos do time aprovados. Suíte frontend: 108 cenários aprovados inicialmente; dois testes móveis atualizados para rolar até o mapa antes de esperar o carregamento e aprovados na reexecução. Total de 110 cenários aprovados e dois ignorados por serem específicos de outro dispositivo.

Verificação da versão compilada: proxy de preview HTTP 200, descoberta real de oito serviços, globo sem download antes de rolar e carregado ao visualizar o mapa, somente fotos móveis no celular e nenhum erro JavaScript. Capturas visuais conferidas. Todos os arquivos fora de frontend/ preservados byte a byte em relação ao início desta revisão.

Firefox, Safari e celulares físicos não foram executados.

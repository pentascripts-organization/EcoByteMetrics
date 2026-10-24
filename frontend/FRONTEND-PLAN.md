# Plano do frontend — Dashboardsp2

Trabalho exclusivo em `frontend/`, sem merge com `develop` nesta fase. As partes que exigem o backend atualizado ficam pendentes. A validação com respostas controladas não substitui a integração real.

| Etapa | Entrega | Situação |
| --- | --- | --- |
| 1 | Comunicação HTTP, contratos e erros consistentes | Implementada e testada com respostas controladas |
| 2 | Atualização, cancelamento e preservação dos últimos dados válidos | Implementada; testes de transporte e transições de dados |
| 3 | Histórico persistido via API | Pendente do backend atualizado |
| 4 | Período, cobertura, totais, estados e última atualização | Implementada em resumo expansível e nas aplicações |
| 5 | Filtros e ranking coerentes | Implementada e testada: mesma seleção, remoções ao final, valores incompletos explícitos |
| 6 | Detalhes, localização e gráficos | Implementada e testada por domínio/renderização; aparência a conferir no navegador |
| 7 | Comparação de aplicações no mesmo intervalo | Implementada para amostras desta sessão; histórico persistido depende da etapa 3 |
| 8 | Login, expiração e sessão reais | Pendente do backend atualizado |
| 9 | Configurações do sistema pela API | Pendente do backend atualizado |
| 10 | Navegação e rotas consistentes | Implementada: comparador, filtros preservados e rotas antigas redirecionadas |
| 11 | Responsividade e acessibilidade | Ajustes implementados; conferência visual, teclado e zoom pendentes de navegador conectado |
| 12 | Desempenho e medição reproduzível | CPU e geometria medidas; séries otimizadas e desenho limitado; FPS entre dispositivos pendente |
| 13 | Testes dos fluxos e das falhas | Suíte ampliada com HTTP, contratos, transições, comparação, navegação e renderização |
| 14 | Distribuição e documentação do frontend | Build e configuração Compose verificados; execução da imagem pendente do Docker Desktop |

Não serão simulados login, persistência ou operações administrativas. O histórico observado no navegador será identificado como dados desta sessão.

## O que mudou e por quê

1. Transporte HTTP compartilhado e validação na entrada: distinguem indisponibilidade, demora, resposta inválida e cancelamento sem confiar no conteúdo recebido.
2. Recursos da última coleta válida são preservados nas falhas individuais e identificados como antigos. Cancelamento impede que consultas abandonadas alterem os dados; a finalização de uma consulta antiga não encerra o indicador de outra em andamento.
4. Resumo expansível mostra período solicitado, totais, cobertura, estados, consulta concluída e última coleta. Essas informações ajudam a interpretar os números sem transformar o dashboard em uma tela de cartões.
5. Busca e estado agora entram na análise compartilhada, mantendo gráfico, lista e totais coerentes. Navegar entre telas não descarta a seleção.
6. Detalhes continuam com o globo à esquerda; coordenadas ausentes têm aviso. Emissões incompletas não parecem completas, inclusive no gráfico acumulado.
7. A tabela de comparação mostra energia, emissões, quantidade, duração e datas das amostras no mesmo intervalo, sem concluir eficiência a partir de totais diferentes.
10. O comparador tem navegação própria. Endereços antigos levam à funcionalidade correspondente no dashboard, preservando os filtros.
11. Regiões de tabela admitem foco e rolagem por teclado. Cabeçalho e seleção do comparador se reorganizam em telas estreitas; o conteúdo tem altura mínima para permanecer alcançável em janelas baixas.
12. A evolução usa Recharts carregado sob demanda, com barras por intervalo e pontos no acumulado. Períodos longos são agrupados em 5 minutos ou 1 hora; cálculos de totais preservam as amostras originais. Lacunas e estimativas incompletas têm explicações próprias, sem interpolar valores.
13. Testes cobrem falhas e dados parciais, não apenas respostas ideais. Testes React no servidor não substituem teste visual ou WebGL.
14. README, ambiente e Docker descrevem o que funciona e o que depende do backend. O HTML da distribuição exige revalidação para reduzir a chance de servir uma versão antiga após atualização.

Procedimentos, evidências e pendências de integração: [docs/VALIDATION.md](docs/VALIDATION.md).

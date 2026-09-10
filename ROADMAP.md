# Roadmap — Painel Analítico

## Estrutura analisada

Projeto estático com index.html e app.js (painel e edição), login.html e login.js (autenticação), config.js (Supabase), style.css e supabase-schema.sql. Bibliotecas: Tailwind na tela clássica, Chart.js, Lucide, SheetJS e supabase-js. Tabelas: profiles e sample_records. Não há registros individuais de pessoas, hooks, componentes React ou modelos TypeScript.

## Etapas desta versão

| Etapa | Resultado |
| --- | --- |
| 1. Centralizar fórmulas, validação, grupos e formatação | Concluído |
| 2. Criar os seis KPIs | Concluído |
| 3. Criar funil dinâmico | Concluído |
| 4. Evoluir a matriz, detalhes e edição | Concluído |
| 5. Mostrar desempenho e seleção de coordenador | Concluído |
| 6. Consolidar e ordenar líderes | Concluído |
| 7. Integrar gráficos à mesma base filtrada | Concluído |
| 8. Integrar filtros por atualização e coordenador | Concluído |
| 9. Responsividade | Implementada; conferência visual no navegador pendente |
| 10. Labels, foco, mensagens e diálogos acessíveis | Implementados; conferência no navegador pendente |
| 11. Verificar código, métricas, relatórios e fluxos simulados | 9 testes aprovados |
| 12. Conferir login, gravação e exclusão no ambiente publicado | Pendente após implantação |

## Arquitetura preservada

A tela clássica permanece no endereço original, com um link para painel-analitico.html. A página nova preserva autenticação, banco, dependências e permissões. Componentes são funções JavaScript por responsabilidade, sem mudança de framework.

analytics-service.js concentra o acesso aos registros. A apresentação usa registros e consolidações; um adaptador futuro poderá transformar pessoas individuais em agregados compatíveis com as métricas atuais.

## Evolução futura — não executada nesta entrega

1. **Verificar publicação:** conferir contas, totais reais, edição, exclusão autorizada, exportações e apresentação em celular e desktop.
2. **Integridade no banco:** revisar registros inconsistentes, depois adicionar restrições de soma em migração SQL específica. Revisar concorrência caso várias pessoas editem o mesmo registro simultaneamente.
3. **Pessoas:** definir tabela com id, nome, cpfOuIdentificador, telefone, empresa, coordenador, líder, status, dataContato, observacao, responsavel, createdAt e updatedAt. Definir políticas de acesso antes da migração.
4. **Status e transições:** especificar PENDENTE, CONTATADO, CONFIRMADO, NAO_CONFIRMADO, NAO_CONHECE, CAIXA_POSTAL, RECONTATO e FINALIZADO. Separar eventos de contato de status atual, evitando dupla contagem.
5. **Histórico operacional:** armazenar eventos e responsáveis; só então oferecer período por data real do contato, evolução diária e comparação histórica.
6. **Migrar agregados:** reconciliar os totais atuais com os futuros registros individuais antes de substituir a digitação manual.
7. **Metas:** definir valores e persistência caso a equipe deseje metas por coordenador, líder ou período.

Não foram criadas páginas vazias de Pessoas ou Configurações. Operação e Relatórios levam a seções funcionais do painel.

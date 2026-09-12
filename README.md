# Controle de Amostragem — correção V2

## Publicação
1. Use este pacote em lugar de Gestao-Call-Center-Lancamentos-Diarios.zip.
2. No Supabase → SQL Editor, execute o arquivo inteiro **ATUALIZACAO-DIARIA-V2.sql**. Faça isso também se executou a migração anterior: a V2 completa a ligação entre o histórico e as bases. Ela pode ser repetida sem duplicar os lançamentos.
3. Não execute novamente supabase-schema.sql em um projeto existente.
4. Envie todos os arquivos desta pasta à raiz da branch publicada. As bibliotecas PDF e Excel continuam na raiz; não há dependência de subpastas.
5. Aguarde a publicação e atualize o navegador. O endereço principal abre index.html.

## O que foi preservado
O painel usa o index.html, analytics.css e componentes do ZIP original: títulos, seis indicadores, funil, desempenho do coordenador, matriz completa, ranking e gráficos. O botão Adicionar registro mantém o formato original e abre o formulário de cadastro. O formulário acrescenta a data.

A central de relatórios saiu do painel, e o menu da antiga Amostragem passou a abrir Registros diários. Os endereços antigos amostragem.html e dashboard.html apenas encaminham ao painel para que atalhos antigos continuem funcionando.

## Como registrar
- **Adicionar registro**, na página inicial: cadastra novo coordenador/líder e sua base, com os resultados iniciais e a data. Os nomes podem ser digitados livremente. O cadastro e seu primeiro lançamento são salvos juntos.
- **Registros diários**: selecione um líder existente e informe somente a produção nova daquela data. A base não é somada novamente.
- Para corrigir resultados já lançados, use Editar no histórico diário. A correção substitui aquele lançamento, sem criar outra cópia.
- A opção Editar na matriz principal altera nomes e tamanho da base. A produção é editada pelo histórico, preservando sua data.
- Somente administradores podem excluir registros. Excluir uma base exclui também seu histórico relacionado.
- O sistema rejeita produção acima da base, inclusive no banco. Contatos repetidos da mesma pessoa não devem ser lançados como pessoas novas.

## Dados existentes
A V2 preserva os registros anteriores. Bases ainda sem histórico são importadas para 11/09/2026. Se o histórico já foi criado pela versão anterior, suas datas são mantidas. A base continua em sample_records; daily_records mantém a produção de cada dia. Triggers atualizam o acumulado de sample_records a cada alteração diária.

Se a migração encontrar nomes ambíguos ao conectar a versão anterior, ela cancela a transação e explica o problema, sem aplicar parcialmente a atualização.

## Relatórios
PDF, Excel, gráficos incorporados, rankings, tabelas e resumo copiável respeitam as seleções. Hoje, ontem, últimos 5 dias, semana (segunda a domingo), mês, datas personalizadas e todo o período estão disponíveis.
Contatados e confirmados mostram a produção do período; pendentes e cobertura consideram o acumulado até a data final. O filtro por coordenador/líder também restringe a base.
Os relatórios são gerados para download no navegador. O backup JSON integral inclui bases e histórico, independentemente dos filtros.

## Verificação
Execute `npm run check` e `npm test`.
A correção também foi verificada em navegador desktop/móvel, com dados simulados, e em PostgreSQL isolado: cadastro inicial, lançamentos, edição, saldo, migração repetida, permissões, PDF e Excel.
Os arquivos baixados foram lidos por ferramentas independentes. Os testes não acessaram nem alteraram o Supabase de produção.

# Controle de Amostragem — Painel Analítico

Projeto completo atualizado, preservando HTML/JavaScript, login, Supabase, Chart.js, Lucide e SheetJS. Não houve migração para React, Next.js ou TypeScript nem alteração do banco.

## Atualizar no GitHub e na Vercel

1. Extraia o ZIP e abra a pasta Amostragem.
2. Envie o conteúdo da pasta para a raiz do repositório existente. Não envie somente o ZIP e não crie uma subpasta Amostragem.
3. Inclua todos os arquivos desta versão, especialmente index.html, amostragem.html e painel-analitico.html, além dos arquivos analytics e app.js.
4. Preserve a configuração atual de publicação da Vercel. Este pacote não adiciona nem substitui vercel.json.
5. Confirme o commit na branch de publicação e aguarde a implantação.
6. Ao abrir o site ou concluir o login, o **Painel Analítico** será a página principal (index.html). A tela anterior está no menu **Amostragem** (amostragem.html). O endereço antigo painel-analitico.html redireciona para a página principal.

config.js foi preservado da cópia local. Se a configuração no GitHub foi atualizada depois dela, preserve a versão atualmente publicada.

Não é necessário executar SQL. supabase-schema.sql é a referência original: não execute novamente em um banco já funcionando.

Se houver uma regra existente redirecionando / ou /index.html para dashboard.html, ela continuará apontando para esse arquivo. A página principal deste pacote é index.html (Painel Analítico); não use o vercel.json da proposta anterior que redirecionava para o dashboard alternativo.

## Implementado

- Página Painel Analítico com sidebar, seis indicadores, funil, desempenho por coordenador, matriz, ranking e dois gráficos.
- Cobertura e confirmação separadas, consolidadas por soma dos dados.
- Filtros de coordenador e período de atualização, compartilhados por indicadores, tabela e gráficos.
- Menu de ações: detalhes, edição em formulário e exclusão confirmada para administrador.
- Validação de inteiros não negativos e contatos menores ou iguais à base, no painel novo e na edição da tela anterior.
- Excel e XML filtrados, JSON integral e resumo em Excel de toda a base.
- Estados de carregamento, vazio, erro, sucesso e aviso de inconsistências antigas.
- Layout adaptável: seis cards em telas amplas, três/dois em telas intermediárias e um em celulares pequenos. Tabela com rolagem horizontal, labels, foco e diálogos nativos.
- Leitura paginada no painel novo para não truncar bases acima do limite de uma consulta.

## Arquivos

Alterados:
- index.html: Painel Analítico como página inicial do site e destino após o login.
- app.js: fórmulas compartilhadas, validação e correção da atualização do filtro quando um coordenador deixa de existir.
- package.json: comandos opcionais de teste e verificação, sem novas dependências.
- README.md: instruções atualizadas.

Adicionados:
- amostragem.html: tela anterior preservada, acessível pelo menu Amostragem.
- painel-analitico.html: redirecionamento de compatibilidade para index.html.
- analytics.css: aparência e responsividade.
- analytics-metrics.js: cálculos, consolidação, grupos, validação, filtros e formatação.
- analytics-service.js: consultas ao Supabase isoladas da apresentação.
- analytics-components.js: KPIs, funil, matriz, desempenho, ranking e gráficos.
- analytics-exports.js: relatórios.
- analytics.js: autenticação da página, filtros e ações.
- ROADMAP.md: etapas, decisões e evolução futura.
- tests/analytics.test.cjs: testes automatizados com dados e serviço simulados.
- scripts/check.cjs: verificação de sintaxe e referências locais.

Preservados: login.html, login.js, config.js, style.css e supabase-schema.sql.

## Regras preservadas e decisões

Contatados = confirmados + não confirmados + não conhece + caixa postal.
Cobertura = contatados / total da base × 100.
Taxa de confirmação = confirmados / contatados × 100.
Pendentes = total da base − contatados.
Divisão por zero retorna zero. Percentuais são formatados em pt-BR.

Líderes são agrupados por coordenador e nome do líder, sem misturar equipes. Metas não foram inventadas: elas não existem no modelo atual.

O período usa updated_at, com fallback para created_at. Não representa a data de cada contato nem produção diária. O resumo do dia é um retrato atual de toda a base, preservando o escopo anterior.

Registros antigos inconsistentes são destacados, sem alteração automática dos dados. A rosca é omitida enquanto houver inconsistências no conjunto filtrado. As validações de soma estão na interface; aplicar essa regra também a outras integrações exige migração SQL separada, após revisar dados antigos.

A exclusão continua protegida pela política RLS existente. Nenhuma conta ou permissão foi criada.

## Verificações desta entrega

Comandos executados com Node.js:

    node scripts/check.cjs
    node --test tests/analytics.test.cjs

Resultado: sintaxe dos JavaScripts, referências locais e IDs dos HTMLs aprovados; **9 testes passaram**. Cobrem o exemplo 223/117/65, zeros e valores inválidos, filtros, ranking, proteção de texto, paginação acima de 1.000 registros, exportações, dados dos gráficos e fluxos de criação, edição e exclusão simulados.

Os atalhos npm run check e npm test estão disponíveis em ambientes com npm. Aqui npm não estava no PATH; os mesmos scripts foram executados diretamente com Node.

- Lint: não há ferramenta configurada no projeto original; não foi apresentado como aprovado.
- TypeScript check: não se aplica ao projeto JavaScript.
- Build: não se aplica; projeto estático, sem compilação. Sintaxe e referências verificadas.
- Navegador e Supabase de produção: não testados nesta preparação. Os testes usam simulações e não alteram dados reais.

Após publicar, confira login, filtros, exportações e salvamento de um registro de teste, incluindo a política de exclusão do administrador e a apresentação no celular.

As bibliotecas externas continuam usando os CDNs existentes e dependem de conexão à internet.
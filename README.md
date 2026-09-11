# Controle de Amostragem — Relatórios de fechamento

## Publicar esta atualização

1. Extraia o ZIP.
2. Envie todos os arquivos da pasta Amostragem para a raiz da branch publicada pela Vercel, incluindo `jszip.min.js`, `pdf-lib.min.js` e todos os arquivos `report-*.js`. Esta versão não depende de subpastas.
3. Preserve sua configuração de publicação e a conexão Supabase atualmente utilizada. config.js no pacote é a cópia local preservada.
4. Confirme o commit e aguarde a implantação.
5. Entre no sistema e abra **Relatórios**, no Painel Analítico. A central está abaixo dos gráficos.

Não execute SQL. Não é necessário mudar o banco, contratar Pro ou sair da Vercel para esta atualização.

## Páginas

- index.html: Painel Analítico, página principal e destino do login.
- amostragem.html: tela clássica preservada.
- painel-analitico.html: compatibilidade com o endereço anterior.

## Novidades

PDF executivo com gráficos, indicadores, rankings e matriz paginada. Excel com seis abas, gráficos incorporados, filtros e percentuais numéricos. Seleção de escopo, observações, mínimo para rankings percentuais e resumo copiável para envio. XML e backup JSON preservados.

Os relatórios são baixados no computador, sem armazenamento no banco e sem envio automático. Representam a situação dos dados carregados, não a produção exclusiva do dia. Gráficos do Excel são imagens estáticas.

Consulte **RELATORIOS.md** para uso, arquivos alterados, testes, limitações e planejamento de uma futura contratação do Supabase Pro. Consulte **ROADMAP.md** para as próximas etapas.

## Verificação

    node scripts/check.cjs
    node --test tests/*.test.cjs

12 testes automatizados, testes de downloads no navegador com dados simulados e leitura independente dos arquivos. Não foram alterados dados de produção. O aplicativo Microsoft Excel não foi testado. Sem build ou TypeScript no projeto estático; lint não configurado.

O login, o esquema SQL, a conexão e as permissões existentes foram preservados. Se houver regras antigas apontando a raiz do site para dashboard.html, revise-as: a página principal atual é index.html.

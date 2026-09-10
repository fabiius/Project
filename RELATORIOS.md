# Relatórios de fechamento

## Como usar

1. Abra o Painel Analítico e aguarde os dados.
2. No menu Relatórios, acesse a Central de relatórios, abaixo dos gráficos.
3. Escolha os filtros atuais ou toda a base. Confira a prévia dos totais.
4. Opcionalmente informe um mínimo de contatos para os rankings percentuais e observações do fechamento.
5. Baixe PDF ou Excel. Use Copiar resumo para preparar a mensagem de e-mail ou WhatsApp; nenhum envio é automático.

Para um fechamento geral do dia, selecione **Toda a base**. O arquivo representa a situação atual, não somente os contatos realizados naquele dia.

## Conteúdo

- PDF: indicadores, funil, distribuição, gráficos de equipes, seis rankings (coordenadores e líderes por confirmação, cobertura e volume), matriz e observações.
- Excel: seis abas, filtros, cabeçalhos congelados, percentuais numéricos e três gráficos incorporados como imagens, não editáveis. Os dados são um retrato estático; alterações manuais na planilha não atualizam os gráficos ou rankings.
- XML: respeita o escopo escolhido.
- JSON: sempre inclui todos os registros carregados.

O mínimo de contatos afeta somente os rankings percentuais. Totais e matriz não são reduzidos. Grupos inconsistentes são identificados e não participam dos rankings; a distribuição não é desenhada com dados inconsistentes. Gráficos apresentam até 10 coordenadores, com ranking completo nas tabelas.

## Implementação

Novos módulos: report-model.js, report-charts.js, report-excel.js, report-pdf.js e report-center.js. index.html, analytics.js e analytics.css integram a central. A tela clássica e as exportações anteriores continuam disponíveis.

PDF-lib 1.17.1 e JSZip 3.10.1 estão incluídos em vendor/ com licenças. Não há instalação necessária após extrair o ZIP. O Excel é gerado em OOXML, com textos armazenados explicitamente como texto; valores iniciados por = não se tornam fórmulas. Os gráficos de relatório usam canvases próprios para preservar o conjunto capturado enquanto o painel continua funcionando. Chart.js continua nos gráficos do painel.

PDF usa fontes padrão com suporte aos acentos portugueses; caracteres fora do conjunto da fonte são substituídos por ?. Os relatórios são gerados no navegador e o volume suportado depende também da memória do dispositivo. Evite relatórios muito grandes em celulares; use os filtros.

## Validação

- Verificações de sintaxe e referências locais.
- 12 testes automatizados de dados, filtros, gráficos, exportações, serviço e modelo de relatório.
- Navegador Edge com dados simulados: downloads reais PDF/Excel, resumo, mínimo inválido e layout móvel de 390 pixels.
- Arquivos com base de 223/117/65, relatório de 65 registros com nomes longos, conjunto vazio e inconsistências.
- Excel reaberto por leitor independente: seis abas, três imagens, congelamento, tipos numéricos e textos sem fórmulas executáveis.
- PDF convertido em imagens para revisão; texto e paginação também verificados.
- Não houve teste com dados de produção nem no aplicativo Microsoft Excel. A tentativa de prévia pelo renderizador de planilhas deste ambiente não concluiu; a estrutura do XLSX foi validada pelo leitor independente.

Comandos: node scripts/check.cjs e node --test tests/*.test.cjs. Projeto estático, sem build ou TypeScript; não foi adicionada ferramenta de lint.

## Supabase Pro — decisão futura

Esta versão não adiciona tabelas, histórico nem arquivos ao banco. Não exige Supabase Pro e não precisa sair da Vercel.

Se o cliente desejar contratar o Pro, conferir antes: organização e projeto corretos, titular da cobrança, uso atual, previsão de crescimento, plano/instância, franquias, excedentes e backups. Confirmar os preços vigentes na página oficial https://supabase.com/pricing.

Manter o mesmo projeto evita uma migração de dados para outro projeto. Após qualquer mudança de plano, conferir conexão, login, permissões e gravação. A contratação e a cobrança devem ser autorizadas pelo cliente. Supabase Pro e Vercel Pro são assinaturas diferentes; contratar Vercel Pro não aumenta o espaço do banco Supabase.

Histórico de fechamentos, pessoas individuais e envio automático permanecem como evoluções futuras, com planejamento próprio.

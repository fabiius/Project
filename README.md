# Gestão Call Center — lançamentos diários e relatórios

## Antes de publicar

1. No Supabase, abra **SQL Editor** e execute uma única vez o arquivo `MIGRACAO-LANCAMENTOS-DIARIOS.sql`.
2. Esse passo cria a tabela de lançamentos por data e migra os registros existentes para **11/09/2026**. A migração não repete os dados se for executada novamente.
3. Envie todos os arquivos desta pasta para a raiz da branch publicada na Vercel e confirme o commit.

## Páginas

- `index.html`: painel inicial, mantido como página principal. O botão **Adicionar registro** continua disponível.
- `registros.html`: lançamento diário com escolha de data e prévia do acumulado antes de salvar.
- `relatorios.html`: central separada com períodos rápidos, filtros, seleção do conteúdo e exportação.

## Regras dos cálculos

A base de cada líder fica em `sample_records` e é contada apenas uma vez. Os contatos e confirmações de cada data ficam em `daily_records`. Ao salvar uma produção diária, os dados são somados ao histórico; os pendentes diminuem e cobertura e confirmação são recalculadas. O sistema bloqueia um lançamento que ultrapasse o saldo pendente do líder.

O Excel é baixado diretamente. Para o PDF, use o botão **Preparar PDF** e escolha **Salvar como PDF** na janela de impressão; ela respeita os indicadores, gráficos e rankings selecionados na tela.

# Controle de Amostragem — atualização

Esta pasta contém o projeto completo para manutenção, com o painel novo consolidado em index.html e app.js. Inclui exportações de Excel, XML e JSON e o resumo em Excel.

## Atualizar o site existente

1. Extraia o ZIP.
2. No repositório GitHub já conectado à Vercel, envie o conteúdo desta pasta na mesma raiz dos arquivos atuais. Não crie uma subpasta Amostragem dentro do repositório.
3. Os arquivos de código alterados nesta atualização são index.html e app.js. Os demais arquivos do sistema foram preservados da cópia local.
4. Mantenha a configuração atual da Vercel. O novo vercel.json da proposta anterior não faz parte deste pacote.
5. Se houver um vercel.json no GitHub direcionando / ou /index.html para dashboard.html, essa configuração precisa ser revisada antes de publicar: o painel atualizado deste pacote está em index.html.
6. Confirme o commit na branch usada pela publicação e acompanhe a implantação na Vercel.
7. Após publicar, confira login, carregamento dos registros, edição e exportações. Teste exclusão somente com um registro de teste e uma conta administradora.

## Arquivos

- index.html: painel atualizado e botões de exportação.
- app.js: lógica do painel, acesso ao Supabase e exportações.
- login.html e login.js: acesso ao sistema.
- config.js: conexão ao Supabase preservada da cópia local.
- style.css: estilos existentes.
- package.json: execução local.
- supabase-schema.sql: referência do esquema existente. Não execute novamente para esta atualização.

O pacote não modifica o banco de dados nem cria contas. Se config.js foi atualizado diretamente no GitHub depois desta cópia local, preserve a versão atualmente publicada.

Esta preparação verifica os arquivos locais; a autenticação e as operações no ambiente publicado precisam ser conferidas após a implantação.
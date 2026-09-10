# Publicação do Controle de Amostragem

## 1. Criar o banco gratuito

1. Crie um projeto em https://supabase.com.
2. No menu **SQL Editor**, execute todo o conteúdo de `supabase-schema.sql`.
3. Em **Authentication > Users**, crie as quatro contas abaixo. Marque o e-mail como confirmado ao criar cada conta.

| Nome | E-mail inicial | Papel |
| --- | --- | --- |
| Admin | admin@amostragem.app | administrador |
| User1 | user1@amostragem.app | usuário |
| User2 | user2@amostragem.app | usuário |
| User3 | user3@amostragem.app | usuário |

4. Rode no SQL Editor, após criar as contas:

```sql
update public.profiles p
set display_name = u.raw_user_meta_data->>'display_name'
from auth.users u
where p.id = u.id and u.raw_user_meta_data ? 'display_name';

update public.profiles set display_name = 'Admin', role = 'admin'
where id = (select id from auth.users where email = 'admin@amostragem.app');
update public.profiles set display_name = 'User1' where id = (select id from auth.users where email = 'user1@amostragem.app');
update public.profiles set display_name = 'User2' where id = (select id from auth.users where email = 'user2@amostragem.app');
update public.profiles set display_name = 'User3' where id = (select id from auth.users where email = 'user3@amostragem.app');
```

Os e-mails acima são identificadores iniciais. Troque-os pelos e-mails reais antes do uso. Não use endereços que não sejam da equipe.

## 2. Conectar o site

No Supabase, abra **Project Settings > API**, copie a URL e a chave `anon` (pública), e preencha `config.js`. Não use a chave `service_role` no site.

## 3. Publicar na Vercel

Envie esta pasta para um repositório GitHub e importe-o na Vercel; como é HTML estático, não precisa configurar build. Alternativamente, envie a pasta pelo painel da Vercel. O endereço público será fornecido ao final da publicação.

## Permissões

Todos os quatro acessos podem consultar, criar e editar registros. Só o Admin pode excluir registros. Essas regras são aplicadas também pelo banco, não apenas pela tela.

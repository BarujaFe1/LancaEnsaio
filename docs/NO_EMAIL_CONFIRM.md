# Maestro — Cadastro sem confirmar e-mail (evitar limite de e-mails)

Este pacote adiciona no app:
- Botão **"Entrar sem e-mail (convidado)"** (Supabase Auth Anônimo)
- Mensagens melhores no cadastro
- Evita ficar preso no limite de e-mails ao criar várias contas

## Opção 1 (RECOMENDADO para o GEM): desativar confirmação de e-mail
Se você desativar **Confirm email**, o Supabase não exige confirmação e o signup não fica preso em e-mail.
Caminho (Supabase Dashboard):
1) Authentication → Providers
2) Email
3) Desligue:
   - Confirm email (OFF)
   - (Opcional) Secure email change (OFF)

Referência: Supabase explica que "Confirm Email disabled" não exige verificação para login. (Docs Supabase)

## Opção 2: Entrar sem e-mail (Convidado) — NÃO envia e-mails
1) Supabase Dashboard → Authentication → Settings → General configuration
2) Ligue: **Allow anonymous sign-ins**
3) No app, na tela de login:
   - Digite seu nome
   - Clique **Entrar sem e-mail (convidado)**

Referência: Supabase docs de Anonymous sign-ins.

⚠️ Importante:
- Usuário anônimo é um usuário real, mas se desinstalar o app/limpar dados pode perder acesso (porque não tem e-mail/senha).
- Para instrutores, o ideal é: usar anônimo para começar rápido e depois migrar para conta e-mail/senha quando o SMTP estiver ok.

## Por que dá “limite de e-mails”?
O Supabase tem rate limits para endpoints que enviam e-mails (ex.: signup/recover).
O padrão citado na doc é **2 e-mails por hora** para endpoints que enviam e-mail.
Para alterar esse limite você precisa configurar **SMTP próprio** no Supabase.

## Opção 3 (produção): configurar SMTP próprio
Supabase Dashboard → Authentication → Settings → SMTP
Com SMTP próprio você controla envio e evita o limite padrão.


# Painel administrativo e-SUS

Frontend administrativo em React, TypeScript e Vite. O painel consome a API FastAPI e não acessa o banco diretamente.

## Desenvolvimento

1. Instale o Node.js (20.19+ ou 22.12+).
2. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em `.env.local`. O endereço da API também pode ser ajustado ali.
3. Instale dependências com `npm install`.
4. Inicie o servidor com `npm run dev`.
5. Gere o build de produção com `npm run build`.

O painel implementa sessão administrativa, visão geral, cadastros de usuários/pacientes/profissionais/especialidades/serviços, escalas e disponibilidade, consultas e regras de notificações. O build exige as chaves públicas do Supabase somente em tempo de execução para o login.

Variáveis `VITE_*` são públicas e fazem parte do bundle do cliente. Use somente URL pública e chave anon/publishable do Supabase; nunca inclua `service_role`, credenciais de servidor ou senha de banco.


## Estrutura

- `src/app`: roteamento, providers e layout protegido.
- `src/lib`: cliente HTTP e integração Supabase.
- `src/features`: módulos por área da API.
- `src/components`: componentes compartilhados.
- `src/types`: tipos da API.


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

Para criar administradores pela aba Usuários, configure `SUPABASE_SERVICE_ROLE_KEY` no `.env` do backend com a chave de servidor do Supabase. Essa chave é usada somente pela API no endpoint protegido `POST /users/admins`; nunca a coloque no `.env.local` do frontend.

## Estrutura

- `src/app`: roteamento, providers e layout protegido.
- `src/lib`: cliente HTTP e integração Supabase.
- `src/features`: módulos por área da API.
- `src/components`: componentes compartilhados.
- `src/types`: tipos da API.

## Limites da API atual

- Criar um perfil de paciente exige `user_id` local já existente; a API não cria a conta Supabase.
- Usuários locais precisam corresponder a identidades Supabase existentes.
- O painel combina listas para compor os indicadores da visão geral porque a API não oferece um endpoint agregado de dashboard.
- As notificações ficam persistidas para consulta no app; não há envio push quando o app está fechado.
- As listas da API não têm paginação.

# e-SUS — aplicativo do paciente

Aplicativo Expo/React Native para cadastro de pacientes, consulta ao catálogo da unidade, agendamento e gestão de consultas e leitura de notificações. Os dados e as regras de negócio vêm da API FastAPI; o app não mantém catálogo nem agenda locais.

## Configuração

1. Instale Node.js e as dependências com `npm install`.
2. Copie `.env.example` para `.env` e configure:
   - `EXPO_PUBLIC_API_URL`: URL HTTPS do backend.
   - `EXPO_PUBLIC_SUPABASE_URL`: URL pública do projeto Supabase.
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: chave pública anon/publishable.
3. No Supabase, permita `esus://esqueci-senha` como URL de redirecionamento para recuperação de senha.
4. Inicie com `npm start`. Use um development build para validar as funcionalidades nativas em Android/iOS.

As variáveis `EXPO_PUBLIC_` são incluídas no app. Use somente a chave anon/publishable do Supabase. Nunca inclua `service_role`, `SUPABASE_KEY` de servidor, senha de banco ou outro segredo.

No Android/iOS, os tokens da sessão são guardados com SecureStore (Keystore/Keychain). Na web, ficam apenas em memória e são descartados ao recarregar a página. A renovação de access token usa o endpoint de refresh do Supabase. Se URL ou chave anon não estiverem configuradas, a sessão precisará de novo login quando expirar.

Na primeira inicialização após atualizar uma versão antiga, o app apaga o banco SQLite local legado e remove os tokens que estavam no AsyncStorage. Essa etapa precisa concluir para liberar a navegação; gere um novo build nativo para entregar a migração aos aparelhos.

## Fluxos disponíveis

- Cadastro e login de pacientes, confirmação de e-mail e recuperação de senha.
- Criação e edição do perfil do próprio paciente.
- Catálogo de especialidades, serviços e profissionais habilitados.
- Consulta de dias e janelas de disponibilidade, confirmação da reserva pelo servidor.
- Lista de consultas próximas e histórico, detalhe, cancelamento e remarcação.
- Caixa de notificações e marcação de leitura.

Push não está integrado: as notificações são carregadas quando o usuário abre a caixa no app.

## Comandos

- `npm start`: inicia o Expo.
- `npm run android`: inicia no emulador Android.
- `npm run ios`: inicia no simulador iOS (macOS).
- `npm run lint`: executa o ESLint.
- `npx tsc --noEmit`: verifica os tipos TypeScript.

Veja `BRIEFING_APP_PACIENTE_REACT_NATIVE.md` para os contratos e regras de negócio do cliente.

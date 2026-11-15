# Briefing — Aplicativo do Paciente em React Native

Este documento pode ser copiado para o repositório separado do app. Define a integração do cliente móvel com o backend e-SUS existente. O app atende pacientes; não substitui a lógica de negócio nem acessa o banco diretamente.

## 1. Objetivo

Permitir que um paciente crie conta, complete seu perfil, encontre serviços e profissionais, consulte disponibilidade, agende/gerencie suas consultas e leia notificações.

Sugestão de stack: React Native + TypeScript. Expo é uma opção para acelerar o primeiro app; confirme o runtime escolhido antes de adotar bibliotecas específicas. Supabase Auth é a identidade e login; a API FastAPI fornece os dados e regras de domínio.

## 2. Ambiente e configuração

Exemplo de configuração pública do app (ajuste os nomes ao bundler usado):

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.4:8000
EXPO_PUBLIC_SUPABASE_URL=<URL pública do projeto Supabase>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<chave pública anon/publishable>
```

A URL acima é a configuração de desenvolvimento atual do backend; use a URL mostrada no terminal ao iniciá-lo. Para celular físico, o telefone e computador precisam alcançar o servidor pela rede. Endereços usuais de emulador variam: Android Emulator costuma acessar o host por `10.0.2.2`; iOS Simulator costuma acessar o host pela rede local do Mac. Confirme conforme seu ambiente.

As variáveis incluídas no app são públicas. Nunca coloque nelas `SUPABASE_KEY` de servidor, `service_role`, senha do banco ou outras credenciais privilegiadas.

## 3. Autenticação e sessão

O app deve tratar o usuário como paciente. O backend só reconhece tokens Supabase associados a um registro local `User` com papel `PATIENT`.

### Cadastro

Use `POST /auth/signup` para criar a conta Supabase e, na mesma operação de aplicação, o `User` local. Payload:

```json
{
  "user_name": "Ana Silva",
  "email": "ana@example.com",
  "password": "senha escolhida pelo usuário"
}
```

O signup público não recebe nem permite escolher `role`; o backend cria `PATIENT`. A resposta contém `access_token`, `refresh_token`, `user_id` (UUID Supabase), `email` e `message`. Se confirmação de e-mail estiver habilitada no Supabase, os tokens podem vir `null`; mostre instrução para confirmar o e-mail e depois faça login.

### Login e renovação

1. Envie e-mail e senha para `POST /auth/login`.
2. Receba `access_token` e `refresh_token`.
3. Guarde/gerencie a sessão pelo SDK Supabase para renovar tokens. Se usar o SDK, estabeleça a sessão com os tokens retornados pelo backend.
4. Armazene tokens com armazenamento seguro da plataforma (Keychain/Keystore ou wrapper seguro do runtime), não em texto em logs nem em armazenamento sem proteção.
5. Chame `GET /auth/me` com `Authorization: Bearer <access_token>` para verificar a identidade local e papel.
6. Ao logout, encerre também a sessão local do SDK.

O backend valida o access token em cada rota. Ele não expõe endpoint próprio de refresh. Se `/auth/me` retorna `404`, a identidade Supabase não tem vínculo local reconhecido e o app deve mostrar erro de conta/suporte; não deve tentar criar ou alterar `role`.

## 4. Perfil do paciente

Após autenticar, verifique `GET /patients/me`. Se não houver perfil, solicite os dados obrigatórios e envie `POST /patients/me`:

```json
{
  "phone": "+55 11 99999-0000",
  "cpf": "529.982.247-25",
  "birth_date": "1990-05-20",
  "address": "Rua Exemplo, 10",
  "sex": null
}
```

`phone`, `cpf` e `birth_date` são obrigatórios; `address` e `sex` são opcionais. O CPF é validado e normalizado no backend para 11 dígitos. Nome e e-mail vêm da conta User, não devem ser reenviados no perfil. CPF e dados pessoais não devem ser registrados em logs de analytics ou console.

O perfil pode ser consultado/atualizado nas rotas `GET/PATCH /patients/me`. O app não envia `user_id`: o backend usa o usuário do token. Um perfil inativo não pode fazer novos agendamentos.

## 5. Navegação e telas sugeridas

1. **Boas-vindas/cadastro/login** — validação local amigável; erros finais continuam sendo validados pelo servidor.
2. **Completar perfil** — telefone, CPF, nascimento e campos opcionais.
3. **Início/catálogo** — serviços ativos.
4. **Detalhe do serviço** — descrição, duração, especialidade e profissionais habilitados.
5. **Escolher profissional** — exibir somente profissionais ativos cujo ID aparece em `professional_ids` do serviço.
6. **Escolher data e horário** — dias disponíveis e janelas do dia.
7. **Confirmar agendamento** — revisar serviço, profissional, data e horário antes de enviar.
8. **Minhas consultas** — próximas e histórico; detalhe com mudanças registradas.
9. **Notificações** — caixa de entrada e marcação de leitura.
10. **Conta** — perfil e logout.

## 6. Catálogo e escolha de serviço

Catálogo exige login. `GET /services/` retorna serviços ativos com `id`, `name`, `description`, `duration_minutes`, `buffer_minutes`, `specialty_id`, `professional_ids` e situação. Não há preço.

O app pode buscar `GET /specialties/` para mostrar nomes de especialidade e `GET /professionals/` para obter profissionais ativos. Um profissional só deve aparecer para o serviço quando seu ID estiver incluído em `professional_ids` daquele serviço.

## 7. Consultar disponibilidade

### Buscar dias

```http
GET /availability/days?professional_id=12&service_id=4&start=2030-01-01&end=2030-01-31
Authorization: Bearer <access_token>
```

### Buscar janelas de uma data

```http
GET /availability/windows?professional_id=12&service_id=4&date=2030-01-07
Authorization: Bearer <access_token>
```

A API considera escala vigente, fuso horário, períodos, exceções, bloqueios, consultas `SCHEDULED`, duração e buffer. A resposta `windows` contém intervalos de **inícios possíveis**: `start_at` é o primeiro início e `end_at` é o último início que ainda cabe na janela, já descontando duração e buffer. `end_at` da janela não é a hora de término da consulta.

Não existe grade/intervalo fixo de slots no backend. Não invente uma cadência como regra clínica; até a definição de um intervalo de seleção, use um seletor de horário limitado às janelas e deixe que o backend valide a escolha.

Os períodos são horários locais da escala, normalmente `America/Sao_Paulo`. Ao criar reserva, envie timestamp ISO 8601 com offset, por exemplo `2030-01-07T09:00:00-03:00`. A disponibilidade é informativa: consulte novamente ou trate `409` ao confirmar, pois outro paciente pode reservar antes.

## 8. Agendar uma consulta

Antes de agendar, o usuário precisa estar autenticado e ter perfil ativo em `/patients/me`. Envie:

```http
POST /appointments/
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "professional_id": 12,
  "service_id": 4,
  "start_at": "2030-01-07T09:00:00-03:00"
}
```

Não envie `patient_id`: para PATIENT, o backend identifica o paciente pelo token. O servidor valida novamente perfil, profissional/serviço ativos, habilitação do profissional, escala, exceção, bloqueio, duração, buffer e conflitos de paciente/profissional. Se aceito, o status inicial será `SCHEDULED`; consulta, histórico e notificações geradas são gravados na mesma transação.

## 9. Consultas do usuário

| Método | Caminho | Uso |
|---|---|---|
| GET | `/appointments/me/upcoming` | Próximas consultas agendadas |
| GET | `/appointments/me/history` | Consultas passadas e não agendadas |
| GET | `/appointments/{appointment_id}` | Detalhe e histórico de alterações |
| POST | `/appointments/{appointment_id}/cancel` | Cancelar consulta futura própria |
| POST | `/appointments/{appointment_id}/reschedule` | Remarcar consulta futura própria |

Cancelamento recebe `{"reason":"..."}` com motivo opcional. Remarcação recebe `start_at` com offset e `reason` opcional. O backend permite ao paciente alterar apenas consulta própria ainda futura. Não existe prazo mínimo configurado além do início da consulta.

Status retornados:

- `SCHEDULED`: consulta ocupa a agenda.
- `CANCELLED`: cancelada e deixa de ocupar a disponibilidade.
- `COMPLETED`: atendimento finalizado pelo ADMIN.

O detalhe traz `history` com ação, status/horário anterior e novo, ator e motivo quando aplicável. Não existe exclusão física de consultas.

## 10. Notificações

As notificações são persistidas para o usuário local ligado à identidade Supabase. O app busca:

```http
GET /notifications/me
GET /notifications/me?unread_only=true
PATCH /notifications/{notification_id}/read
```

Somente notificações do próprio usuário podem ser lidas/marcadas. `available_at` indica quando o aviso deve aparecer; uma remarcação/cancelamento invalida lembretes futuros antigos.

O ADMIN configura globalmente os eventos `BOOKED`, `CANCELLED`, `RESCHEDULED`, `REMINDER` e `COMPLETED`. O lembrete vem ativo em 1440 minutos (24 horas). O app não altera essas regras.

**Push ainda não implementado:** nesta versão, a notificação aparece quando o app consulta a caixa depois de `available_at`. Se o aplicativo estiver fechado, não haverá alerta de sistema. Push exigirá permissão, token do dispositivo, endpoint seguro para registrar/remover token e integração backend com Expo Push/FCM/APNs e worker de envio. Não simule recebimento push usando apenas o registro no banco.

## 11. Cliente HTTP e tratamento de erros

Crie uma camada API única que receba a sessão atual e inclua `Authorization` automaticamente. Não espalhe URLs ou tokens pelo código das telas. Trate a resposta FastAPI (`detail`) com mensagens adequadas:

| HTTP | Comportamento recomendado |
|---|---|
| `401` | Renovar sessão pelo SDK; se falhar, limpar sessão e voltar ao login |
| `403` | Mostrar permissão insuficiente |
| `404` | Mostrar que o recurso não foi encontrado/não pode ser acessado |
| `409` | Mostrar conflito e atualizar disponibilidade/consulta |
| `422` | Mostrar erro de campo/entrada inválida |
| Falha de rede | Manter dados não enviados em estado editável; não afirmar que a reserva foi criada |

Após `POST /appointments/`, use a resposta confirmada da API para mostrar sucesso. Não atualize a interface como se houvesse reserva antes de resposta `201`.

## 12. Estrutura sugerida do app

```text
src/
  app/                 # navegação, providers e proteção de sessão
  lib/                 # cliente Supabase, armazenamento de sessão e HTTP
  features/
    auth/
    patient-profile/
    catalog/
    availability/
    appointments/
    notifications/
    account/
  components/          # botões, campos, estados de carregamento e feedback
  types/               # tipos derivados do OpenAPI
```

## 13. Ordem sugerida de implementação

1. Inicializar React Native/TypeScript e configurar URL da API e Supabase público.
2. Criar persistência segura de sessão, signup/login/logout e fluxo de confirmação de e-mail.
3. Fazer guardas de autenticação e carregamento de `/auth/me`.
4. Criar cadastro/edição do próprio perfil.
5. Criar catálogo e seleção de profissional habilitado.
6. Implementar seleção de dia/janela e confirmação de reserva.
7. Implementar próximas consultas, histórico, detalhe, cancelamento e remarcação.
8. Implementar caixa de notificações e leitura.
9. Testar em simulador e aparelho real: renovação, rede indisponível, CORS não aplicável ao cliente nativo, conflitos e token expirado.
10. Planejar push após definir Expo vs bare React Native e provider.

## 14. Referências e limitações

- Contratos e corpos de requisição completos: [API.md](API.md).
- Regras e arquitetura: [GUIA_DO_SISTEMA.md](GUIA_DO_SISTEMA.md).
- OpenAPI em execução: `/openapi.json`; Swagger: `/docs`.
- Paginação não está implementada nos endpoints de lista.
- Reset de senha não tem rota própria no backend; integrar o fluxo apropriado do Supabase Auth no app.
- A suíte atual usa provider Supabase simulado; valide login/signup contra o projeto Supabase real.
- SQLite é o banco usado em desenvolvimento; valide PostgreSQL no ambiente escolhido antes de produção.

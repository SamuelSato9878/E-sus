# E-SUS Backend

API FastAPI para gestão do atendimento e agendamento. A aplicação mantém módulos separados e a autenticação de pacientes/admins é delegada ao Supabase Auth.

## Desenvolvimento

Requisitos: Python 3.14+ e `uv`.

```bash
uv sync
uv run dev
```

Swagger e OpenAPI ficam disponíveis em `/docs` e `/openapi.json`.

## Testes

```bash
uv run test
```

Os testes usam SQLite temporário e simulam o provider Supabase. Eles validam os contratos da aplicação, mas não substituem testes de integração com um projeto Supabase real.

## Autenticação e papéis

- `PATIENT`: usuário autenticado pelo Supabase. Pode consultar seu próprio perfil e consultar o catálogo ativo.
- `ADMIN`: usuário autenticado pelo Supabase com acesso às operações administrativas.
- `PROFESSIONAL` permanece no enum legado para compatibilidade de banco, mas a API não o atribui e bloqueia seu acesso autenticado.

O signup público não aceita papel. Para provisionar o primeiro administrador, use o comando local interativo descrito em [docs/API.md](docs/API.md#provisionamento-do-primeiro-administrador), após verificar a identidade e o cadastro Supabase da pessoa.

## Módulos disponíveis

- Auth e Users: autenticação Supabase e gestão administrativa de identidades locais.
- Patients: perfil vinculado um a um a User, CPF validado e desativação lógica.
- Professionals: profissionais sem login e identificação de conselho profissional.
- Specialties: catálogo e associação muitos-para-muitos com profissionais.
- Services: serviços médicos, duração, especialidade e profissionais habilitados. Preço não faz parte do escopo atual.
- Schedules: jornadas recorrentes, vigência, exceções, bloqueios e horários calculados dinamicamente.
- Appointments: agendamento, consulta, cancelamento, remarcação, finalização e histórico.
- Notifications: caixa de entrada no app e regras configuráveis pelo administrador.

O funcionamento geral está em [docs/GUIA_DO_SISTEMA.md](docs/GUIA_DO_SISTEMA.md); endpoints, contratos e exemplos estão em [docs/API.md](docs/API.md). Para iniciar os clientes, use o [briefing do painel React](docs/BRIEFING_PAINEL_ADMIN_REACT.md) ou o [briefing do app React Native do paciente](docs/BRIEFING_APP_PACIENTE_REACT_NATIVE.md). Disponibilidade considera consultas agendadas. O backend ainda não envia push ou e-mail externo.

## Banco e migrations

O SQLAlchemy usa `DATABASE_URL`. O SQLite tem verificação de chaves estrangeiras habilitada pelo engine. PostgreSQL também é suportado pelo SQLAlchemy, mas ainda requer validação de integração específica. Configure `ALLOWED_ORIGINS` com as origens exatas do painel web; no desenvolvimento, há fallback para localhost nas portas 3000, 5173 e 8081.

Comandos informativos:

```bash
uv run alembic current
uv run alembic history
```

Novas migrations devem ser revisadas antes de aplicação. Este repositório não aplica migrations durante a inicialização da API.

# E-sus
Sistema de agendamento mobile de consultas do SUS  


## 🚀 Primeiros Passos

Antes de executar os utilitários, certifique-se de que todas as dependências estão instaladas:
Esse projeto utiliza o gerenciador de pacotes uv do python

```bash
# Sincroniza dependências do projeto
uv sync    # Sincroniza as dependências do projeto com o arquivo de bloqueio (uv.lock)
uv lock    #Atualiza o arquivo de bloqueio de dependências.
```

---

## 🖥️ Comandos de Desenvolvimento

| Comando | Descrição | Ambiente |
| :--- | :--- | :--- |
| `uv run dev` | Inicia o servidor de desenvolvimento local | Local |

---

## 🧪 Testes e Qualidade

Use estes comandos para garantir a estabilidade do código

* **Executar todos os testes:**
  ```bash
  uv run test #Exucata os teste unitários da aplicação
  ```

---

## 🗄️ Banco de Dados (Migrations)

Utilitários para gerenciar o ciclo de vida do banco de dados local: 
Este projeto utiliza a ferramento de migrações Alembic, escrita para o SqlAlchemy

* **Criar uma nova migration:**
  ```bash
  alembic revision --autogenerate -m "mensagem": #Cria um arquivo de migração detectando automaticamente as mudanças nos seus modelos do SQLAlchemy

  alembic revision -m "mensagem"  #Cria um arquivo de migração vazio para você escrever as alterações manualmente.
  ```
* **Comandos principais da migração:**
  ```bash
  alembic upgrade head #Aplica todas as migrações pendentes até a versão mais recente (topo).

  alembic downgrade -1 ou alembic downgrade <revisão> # Reverte a última migração aplicada ou volta para uma revisão específica.

  alembic current #Mostra a qual versão o banco de dados está conectado no momento.

  alembic history #Lista todas as migrações criadas em ordem cronológica.

  alembic merge <rev1> <rev2> #Une duas ramificações (branches) de migração em uma única revisão
  ```


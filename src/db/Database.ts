import * as SQLite from 'expo-sqlite';
import { seedDatabase } from './seed';

/**
 * Banco local (SQLite) usado só para validar o fluxo de cadastro/login
 * ENQUANTO o backend de verdade não chega. Quando a outra equipe entregar
 * a API, essas funções devem ser trocadas por chamadas HTTP — a assinatura
 * (parâmetros e formato de retorno) foi pensada pra ficar parecida com o
 * que uma API normalmente devolveria, pra facilitar a troca depois.
 *
 * IMPORTANTE: a senha aqui é salva em TEXTO PURO só pra validar o fluxo.
 * Isso não pode ir pra produção — quando o backend chegar, o hash de senha
 * é responsabilidade dele (bcrypt/argon2 no servidor).
 */

export type User = {
  id: number;
  email: string;
  senha: string;
};

export type AuthResult = { success: true } | { success: false; error: string };

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('app.db').then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          senha TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS medicos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          crm TEXT NOT NULL,
          especialidade_id TEXT NOT NULL,
          foto_url TEXT
        );
        -- Horários fixos de atendimento de cada médico por dia da semana.
        -- dia_semana segue Date.getDay(): 0 = domingo ... 6 = sábado.
        CREATE TABLE IF NOT EXISTS agenda_semanal (
          medico_id INTEGER NOT NULL REFERENCES medicos(id),
          dia_semana INTEGER NOT NULL,
          hora TEXT NOT NULL,
          PRIMARY KEY (medico_id, dia_semana, hora)
        );
        -- O UNIQUE impede que o mesmo horário seja reservado duas vezes.
        CREATE TABLE IF NOT EXISTS agendamentos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          medico_id INTEGER NOT NULL REFERENCES medicos(id),
          data TEXT NOT NULL,
          hora TEXT NOT NULL,
          nome TEXT NOT NULL,
          cpf TEXT NOT NULL,
          motivo TEXT,
          status TEXT NOT NULL DEFAULT 'pendente',
          criado_em TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE (medico_id, data, hora)
        );
      `);
      await seedDatabase(db);
      return db;
    });
  }
  return dbPromise;
}

export async function createUser(email: string, senha: string): Promise<AuthResult> {
  const db = await getDb();
  const emailNormalizado = email.trim().toLowerCase();

  try {
    await db.runAsync('INSERT INTO users (email, senha) VALUES (?, ?);', [
      emailNormalizado,
      senha,
    ]);
    return { success: true };
  } catch (e: any) {
    if (String(e?.message).includes('UNIQUE')) {
      return { success: false, error: 'Esse email já está cadastrado.' };
    }
    return { success: false, error: 'Não foi possível cadastrar. Tente novamente.' };
  }
}

export async function validateLogin(email: string, senha: string): Promise<AuthResult> {
  const db = await getDb();
  const emailNormalizado = email.trim().toLowerCase();

  const user = await db.getFirstAsync<User>('SELECT * FROM users WHERE email = ?;', [
    emailNormalizado,
  ]);

  if (!user) {
    return { success: false, error: 'Email não encontrado.' };
  }
  if (user.senha !== senha) {
    return { success: false, error: 'Senha incorreta.' };
  }
  return { success: true };
}
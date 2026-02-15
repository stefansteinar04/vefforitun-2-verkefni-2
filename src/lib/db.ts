import pg from 'pg';
import type { Todo } from '../types.js';

function getPool(): pg.Pool {
  const { DATABASE_URL } = process.env;
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });

  pool.on('error', (err: Error) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

  return pool;
}

async function query<T extends pg.QueryResultRow>(
  q: string,
  values: unknown[] = [],
): Promise<pg.QueryResult<T> | null> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    return await client.query<T>(q, values);
  } catch (err) {
    console.error('Database query error', err);
    return null;
  } finally {
    client.release();
  }
}

export async function init(): Promise<boolean> {
  const res = await query(
    `
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      finished BOOLEAN NOT NULL DEFAULT false,
      created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    `,
  );
  return res !== null;
}

type TodoRow = {
  id: number;
  title: string;
  finished: boolean;
  created: Date;
};

export async function listTodos(): Promise<Todo[] | null> {
  const res = await query<TodoRow>(
    `
    SELECT id, title, finished, created
    FROM todos
    ORDER BY finished ASC, created DESC, id DESC
    `,
  );
  if (!res) return null;
  return res.rows;
}

export async function createTodo(title: string): Promise<Todo | null> {
  const res = await query<TodoRow>(
    `
    INSERT INTO todos (title)
    VALUES ($1)
    RETURNING id, title, finished, created
    `,
    [title],
  );
  if (!res) return null;
  return res.rows[0] ?? null;
}

export async function updateTodo(id: number, title: string, finished: boolean): Promise<Todo | null> {
  const res = await query<TodoRow>(
    `
    UPDATE todos
    SET title = $1, finished = $2
    WHERE id = $3
    RETURNING id, title, finished, created
    `,
    [title, finished, id],
  );
  if (!res) return null;
  return res.rows[0] ?? null;
}

export async function deleteTodo(id: number): Promise<boolean | null> {
  const res = await query(`DELETE FROM todos WHERE id = $1`, [id]);
  if (!res) return null;
  return res.rowCount === 1;
}

export async function deleteFinishedTodos(): Promise<number | null> {
  const res = await query(`DELETE FROM todos WHERE finished = true`);
  if (!res) return null;
  return res.rowCount ?? 0;
}

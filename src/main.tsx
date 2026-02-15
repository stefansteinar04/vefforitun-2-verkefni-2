import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';

import { TodoPage, ErrorPage, NotFoundPage } from './components/TodoPage.js';
import { createTodo, deleteFinishedTodos, deleteTodo, init, listTodos, updateTodo } from './lib/db.js';
import { parseFinished, parseIdParam, validateTitle } from './lib/validation.js';

export const app = new Hono();

app.use('/static/*', serveStatic({ root: process.cwd() }));

let didInit = false;
async function ensureInit(): Promise<boolean> {
  if (didInit) return true;
  const ok = await init();
  didInit = ok;
  return ok;
}

app.get('/', async (c) => {
  const ok = await ensureInit();
  if (!ok) return c.html(<ErrorPage message="Tókst ekki að tengjast gagnagrunni." />, 500);

  const todos = await listTodos();
  if (!todos) return c.html(<ErrorPage message="Villa við að sækja verkefni úr gagnagrunni." />, 500);

  return c.html(<TodoPage todos={todos} />);
});

app.post('/add', async (c) => {
  const ok = await ensureInit();
  if (!ok) return c.html(<ErrorPage message="Tókst ekki að tengjast gagnagrunni." />, 500);

  const form = await c.req.formData();
  const { value, error } = validateTitle(form.get('title'));

  const todos = (await listTodos()) ?? [];

  if (error || !value) return c.html(<TodoPage todos={todos} error={error ?? 'Ógild gögn.'} />, 400);

  const created = await createTodo(value);
  if (!created) return c.html(<ErrorPage message="Villa við að búa til verkefni." />, 500);

  return c.redirect('/');
});

app.post('/update/:id', async (c) => {
  const ok = await ensureInit();
  if (!ok) return c.html(<ErrorPage message="Tókst ekki að tengjast gagnagrunni." />, 500);

  const { id, error: idError } = parseIdParam(c.req.param('id'));
  if (idError || !id) return c.html(<ErrorPage message={idError ?? 'Ógilt auðkenni.'} />, 400);

  const form = await c.req.formData();
  const { value, error } = validateTitle(form.get('title'));
  const finished = parseFinished(form.get('finished'));

  const todos = (await listTodos()) ?? [];
  if (error || !value) return c.html(<TodoPage todos={todos} error={error ?? 'Ógild gögn.'} />, 400);

  const updated = await updateTodo(id, value, finished);
  if (!updated) return c.html(<ErrorPage message="Villa við að uppfæra verkefni." />, 500);

  return c.redirect('/');
});

app.post('/delete/finished', async (c) => {
  const ok = await ensureInit();
  if (!ok) return c.html(<ErrorPage message="Tókst ekki að tengjast gagnagrunni." />, 500);

  const deleted = await deleteFinishedTodos();
  if (deleted === null) return c.html(<ErrorPage message="Villa við að eyða kláruðum verkefnum." />, 500);

  return c.redirect('/');
});

app.post('/delete/:id', async (c) => {
  const ok = await ensureInit();
  if (!ok) return c.html(<ErrorPage message="Tókst ekki að tengjast gagnagrunni." />, 500);

  const { id, error: idError } = parseIdParam(c.req.param('id'));
  if (idError || !id) return c.html(<ErrorPage message={idError ?? 'Ógilt auðkenni.'} />, 400);

  const deleted = await deleteTodo(id);
  if (deleted === null) return c.html(<ErrorPage message="Villa við að eyða verkefni." />, 500);

  return c.redirect('/');
});

app.notFound((c) => c.html(<NotFoundPage />, 404));

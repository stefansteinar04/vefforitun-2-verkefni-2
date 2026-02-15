import type { FC } from 'hono/jsx';
import type { Todo } from '../types.js';

export const Layout: FC<{ title?: string; children: unknown }> = ({ title = 'Verkefnalisti', children }) => (
  <html lang="is">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title}</title>
      <link rel="stylesheet" href="/static/styles.css" />
    </head>
    <body>
      <main class="container">{children}</main>
    </body>
  </html>
);

export const TodoForm: FC<{ error?: string }> = ({ error }) => (
  <section class="card">
    <h1>Verkefnalisti</h1>

    {error ? (
      <p class="error" role="alert">
        {error}
      </p>
    ) : null}

    <form method="post" action="/add" class="row">
      <label class="sr-only" for="title">
        Titill
      </label>
      <input id="title" name="title" type="text" placeholder="Nýtt verkefni..." required />
      <button type="submit">Bæta við</button>
    </form>
  </section>
);

export const TodoItem: FC<{ todo: Todo }> = ({ todo }) => (
  <li class={`todo ${todo.finished ? 'finished' : ''}`}>
    <form method="post" action={`/update/${todo.id}`} class="todo-main">
      <input type="checkbox" name="finished" defaultChecked={todo.finished} aria-label="Lokið" />
      <input type="text" name="title" defaultValue={todo.title} maxLength={255} aria-label="Titill" />
      <button type="submit">Vista</button>
    </form>

    <form method="post" action={`/delete/${todo.id}`} class="todo-delete">
      <button type="submit" class="danger" aria-label="Eyða verkefni">
        Eyða
      </button>
    </form>
  </li>
);

export const TodoList: FC<{ todos: Todo[] }> = ({ todos }) => {
  if (todos.length === 0) {
    return (
      <section class="card">
        <p class="muted">Engin verkefni til staðar. Bættu við nýju verkefni hér að ofan.</p>
      </section>
    );
  }

  const anyFinished = todos.some((t) => t.finished);

  return (
    <section class="card">
      <ul class="todos">
        {todos.map((t) => (
          <TodoItem todo={t} />
        ))}
      </ul>

      {anyFinished ? (
        <form method="post" action="/delete/finished" class="row end">
          <button type="submit" class="danger">
            Eyða öllum kláruðum
          </button>
        </form>
      ) : null}
    </section>
  );
};

export const TodoPage: FC<{ todos: Todo[]; error?: string }> = ({ todos, error }) => (
  <Layout>
    {error ? <TodoForm error={error} /> : <TodoForm />}
    <TodoList todos={todos} />
  </Layout>
);

export const ErrorPage: FC<{ title?: string; message: string }> = ({ title = 'Villa', message }) => (
  <Layout title={title}>
    <section class="card">
      <h1>{title}</h1>
      <p class="error" role="alert">
        {message}
      </p>
      <p>
        <a href="/">Til baka</a>
      </p>
    </section>
  </Layout>
);

export const NotFoundPage: FC = () => (
  <Layout title="404">
    <section class="card">
      <h1>404 – Síða fannst ekki</h1>
      <p class="muted">Slóðin sem þú opnaðir er ekki til.</p>
      <p>
        <a href="/">Fara á forsíðu</a>
      </p>
    </section>
  </Layout>
);

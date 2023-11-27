import { Elysia, t } from "elysia";
import { lucia } from "lucia";
import { elysia } from "lucia/middleware";
import { env } from "./env";
import { createConnection as createPGConnection } from "./drivers/pg";
import { createConnection as createSqliteConnection } from "./drivers/sqlite";
import { createConnection as createMySqlConnection } from "./drivers/mysql";
const app = new Elysia();

const createConnection = () => {
  switch (env.DB_DRIVER) {
    case "postgres":
      return createPGConnection();
    case "mysql":
      return createMySqlConnection();
    // Use bun:sqlite as default or libsql as specified in env
    default:
      return createSqliteConnection();
  }
};

const { db, adapter } = createConnection();

export const auth = lucia({
  env: process.env.NODE_ENV === "production" ? "PROD" : "DEV",
  middleware: elysia(),
  adapter,
});

const bookmarks = new Elysia({ prefix: "/bookmarks" })
  .state("db", db)
  .post("/", ({ body, store: { db } }) => {}, {
    body: t.Object({
      title: t.String({
        maxLength: env.MAX_BOOKMARK_TITLE_LENGTH || 255,
      }),
      description: t.String({
        maxLength: env.MAX_BOOKMARK_DESC_LENGTH || 300,
      }),
    }),
  });

app.use(bookmarks);

app.listen(3000, () => {
  console.log("Listening on port 3000");
});

import { Type, Static } from "@sinclair/typebox";
import { TObject } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";

export const envSchema = Type.Object({
  MAX_BOOKMARK_TITLE_LENGTH: Type.Number(),
  MAX_BOOKMARK_DESC_LENGTH: Type.Number(),
  // https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
  HASH_ALGORITHM: Type.Union([
    Type.Literal("argon2i"),
    Type.Literal("argon2d"),
    Type.Literal("argon2id")
  ], {
    default: "argon2id"
  }),
  HASH_MEM: Type.Number({ 
    default: 19456 // 19 MiB in KiB
  }),
  HASH_ITERATIONS: Type.Number({
    default: 2
  }),
  DB_DRIVER: Type.Union([
    Type.Literal("sqlite"),
    Type.Literal("libsql"),
    Type.Literal("mysql"),
    Type.Literal("postgres")
  ], {
    default: "sqlite"
  }),
  DB_URI: Type.String({
    // TODO: Change to name
    default: "bookmarks.db"
  }),
  DB_AUTH_TOKEN: Type.Optional(Type.String()),
});

export type EnvSchemaType = Static<typeof envSchema>; 

interface ValidatorFactoryReturn<T> {
  schema: TObject;
  verify: (data: unknown) => T;
}

export const validatorFactory = <T extends unknown>(
  schema: TObject
): ValidatorFactoryReturn<T> => {
  const C = TypeCompiler.Compile(schema);

  const verify = (data: unknown): T => {
    const isValid = C.Check(data);
    if (isValid) {
      return data as T;
    }
    throw new Error(
      JSON.stringify(
        [...C.Errors(data)].map(({ path, message }) => ({ path, message }))
      )
    );
  };

  return { schema, verify };
};

const envValidator = validatorFactory<EnvSchemaType>(envSchema);
export const env = envValidator.verify(Bun.env)


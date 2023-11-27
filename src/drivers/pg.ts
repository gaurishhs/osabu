import { eq, relations } from "drizzle-orm";
import { bigint, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import { nanoid } from "nanoid";
import { env } from "@/env";
import postgres from "postgres";
import { postgres as luciaPgAdapter } from "@lucia-auth/adapter-postgresql"

export const createConnection = () => {
    const client = postgres(env.DB_URI)
    return {
        db: drizzle(client),
        client,
        adapter: luciaPgAdapter(client, {
            user: "users",
            key: "keys",
            session: "sessions",
        })
    }
}

export const users = pgTable("users", {
	id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => nanoid()),
    createdAt: timestamp('created_at').notNull().defaultNow()
});

export const sessions = pgTable("sessions", {
	id: varchar("id", {
		length: 128
	}).primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	activeExpires: bigint("active_expires", {
		mode: "number"
	}).notNull(),
	idleExpires: bigint("idle_expires", {
		mode: "number"
	}).notNull()
});

export const keys = pgTable("keys", {
	id: varchar("id", {
		length: 255
	}).primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	hashedPassword: varchar("hashed_password", {
		length: 255
	})
});

export const bookmarks = pgTable("bookmarks", {
    id: text("id")
        .primaryKey()
        .notNull()
        .$defaultFn(() => nanoid()),
    url: text("url").notNull(),
    tags: text("tags").array(),
    collection: text("collection"),
    userId: text("user_id"),
});

export const tags = pgTable("tags", {
    id: text("id")
        .primaryKey()
        .notNull()
        .$defaultFn(() => nanoid()),
    name: text("name").notNull(),
});

const bookmarksToTags = pgTable("bookmarksToTags", {
    bookmarkId: text("bookmark_id")
        .notNull()
        .references(() => bookmarks.id),
    tagId: text("tag_id")
        .notNull()
        .references(() => tags.id),
});

export const usersRelations = relations(users, ({ many }) => ({
    bookmarks: many(bookmarks),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
    user: one(users, {
        fields: [bookmarks.userId],
        references: [users.id],
    }),
}));

type InsertBookmarkSchema = typeof bookmarks.$inferInsert;
type SelectBookmarkSchema = typeof bookmarks.$inferSelect;

export const createBookmark = (
    db: PostgresJsDatabase<Record<string, never>>,
    data: InsertBookmarkSchema
) => {
    return db.insert(bookmarks).values(data).execute();
};

export const updateBookmark = (
    db: PostgresJsDatabase<Record<string, never>>,
    id: string,
    data: Partial<SelectBookmarkSchema>
) => {
    return db.update(bookmarks).set(data).where(eq(bookmarks.id, id)).execute()
};

export const deleteBookmark = (
    db: PostgresJsDatabase<Record<string, never>>,
    id: string
) => {
    return db.delete(bookmarks).where(eq(bookmarks.id, id)).execute()
};

// TODO: Implement pagination
export const getAllBookmarks = (
    db: PostgresJsDatabase<Record<string, never>>
) => {
    return db.select().from(bookmarks).execute();
}
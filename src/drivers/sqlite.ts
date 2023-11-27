import { env } from "@/env";
import { createClient } from "@libsql/client";
import Database from "bun:sqlite";
import { eq, relations, sql } from "drizzle-orm";
import { BunSQLiteDatabase, drizzle as bunSqlDrizzle } from "drizzle-orm/bun-sqlite";
import { LibSQLDatabase, drizzle as libSqlDrizzle } from "drizzle-orm/libsql";
import { blob, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";
import { libsql as lucialibSqlAdapter } from "@lucia-auth/adapter-sqlite";

export const createConnection = () => {
    // bun:sqlite implementation when lucia supports
    const client = createClient({ url: env.DB_URI, authToken: env.DB_AUTH_TOKEN })
    const db = libSqlDrizzle(client)
    const adapter = lucialibSqlAdapter(client, {
        user: "users",
        key: "keys",
        session: "sessions",
    }) 
    return {
        db,
        client,
        adapter
    }
}

export const users = sqliteTable("users", {
    id: text("id")
        .primaryKey()
        .notNull()
        .$defaultFn(() => nanoid()),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable("sessions", {
    id: text("id", {
        length: 128
    }).primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id),
    activeExpires: blob("active_expires", {
        mode: "bigint"
    }).notNull(),
    idleExpires: blob("idle_expires", {
        mode: "bigint"
    }).notNull()
});

export const keys = sqliteTable("keys", {
    id: text("id", {
        length: 255
    }).primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id),
    hashedPassword: text("hashed_password", {
        length: 255
    })
});

export const bookmarks = sqliteTable('bookmarks', {
    id: text('id').primaryKey().notNull().$defaultFn(() => nanoid()),
    url: text('url').notNull(),
    tags: text('tags').$type<string[]>(),
    collection: text('collection'),
    userId: text('user_id')
})

export const tags = sqliteTable('tags', {
    id: text('id').primaryKey().notNull().$defaultFn(() => nanoid()),
    name: text('name').notNull(),
})

const bookmarksToTags = sqliteTable('bookmarksToTags', {
    bookmarkId: text('bookmark_id').notNull().references(() => bookmarks.id),
    tagId: text('tag_id').notNull().references(() => tags.id),
})

export const usersRelations = relations(users, ({ many }) => ({
    bookmarks: many(bookmarks)
}))

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
    user: one(users, {
        fields: [bookmarks.userId],
        references: [users.id]
    })
}))

type InsertBookmarkSchema = typeof bookmarks.$inferInsert;
type SelectBookmarkSchema = typeof bookmarks.$inferSelect;

export const createBookmark = (
    db: BunSQLiteDatabase<Record<string, never>> | LibSQLDatabase<Record<string, never>>,
    data: InsertBookmarkSchema
) => {
    return db.insert(bookmarks).values(data).execute();
};

export const updateBookmark = (
    db: BunSQLiteDatabase<Record<string, never>> | LibSQLDatabase<Record<string, never>>,
    id: string,
    data: Partial<SelectBookmarkSchema>
) => {
    return db.update(bookmarks).set(data).where(eq(bookmarks.id, id)).execute()
};

export const deleteBookmark = (
    db: BunSQLiteDatabase<Record<string, never>> | LibSQLDatabase<Record<string, never>>,
    id: string
) => {
    return db.delete(bookmarks).where(eq(bookmarks.id, id)).execute()
};

// TODO: Implement pagination
export const getAllBookmarks = (
    db: BunSQLiteDatabase<Record<string, never>> | LibSQLDatabase<Record<string, never>>,
) => {
    return db.select().from(bookmarks).all();
}
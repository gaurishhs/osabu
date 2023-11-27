import { eq, relations } from "drizzle-orm";
import { nanoid } from 'nanoid'
import { mysqlTable, text, json, timestamp, varchar, bigint } from "drizzle-orm/mysql-core";
import { MySql2Database, drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "@/env";
import { mysql2 as luciaMysqlAdapter } from "@lucia-auth/adapter-mysql";

export const createConnection = () => {
    const client = mysql.createPool({ uri: env.DB_URI })
    return {
        db: drizzle(client),
        client,
        adapter: luciaMysqlAdapter(client, {
            user: "users",
            key: "keys",
            session: "sessions",
        })
    }
}

export const users = mysqlTable("users", {
	id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => nanoid()),
    createdAt: timestamp('created_at').notNull().defaultNow()
});

export const sessions = mysqlTable("sessions", {
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

export const keys = mysqlTable("keys", {
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

export const bookmarks = mysqlTable('bookmarks', {
    id: text('id').primaryKey().notNull().$defaultFn(() => nanoid()),
    url: text('url').notNull(),
    tags: json('tags').$type<string[]>(),
    collection: text('collection'),
    userId: text('user_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const tags = mysqlTable('tags', {
    id: text('id').primaryKey().notNull().$defaultFn(() => nanoid()),
    name: text('name').notNull(),
})

const bookmarksToTags = mysqlTable('bookmarksToTags', {
    bookmarkId: text('bookmark_id').notNull().references(() => bookmarks.id),
    tagId: text('tag_id').notNull().references(() => tags.id),
})

export const usersRelations = relations(users, ({ many}) => ({
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
    db: MySql2Database<Record<string, never>>,
    data: InsertBookmarkSchema
) => {
    return db.insert(bookmarks).values(data).execute();
};

export const updateBookmark = (
    db: MySql2Database<Record<string, never>>,
    id: string,
    data: Partial<SelectBookmarkSchema>
) => {
    return db.update(bookmarks).set(data).where(eq(bookmarks.id, id)).execute()
};

export const deleteBookmark = (
    db: MySql2Database<Record<string, never>>,
    id: string
) => {
    return db.delete(bookmarks).where(eq(bookmarks.id, id)).execute()
};

// TODO: Implement pagination
export const getAllBookmarks = (
    db: MySql2Database<Record<string, never>>
) => {
    return db.select().from(bookmarks).execute();
}
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	age: integer('age')
});

export const markdownFiles = sqliteTable("markdown_files", {
    id: integer("id").primaryKey(),
    file_name: text("file_name").unique(),
    content: text("content"),
    created_at: text("created_at")
});

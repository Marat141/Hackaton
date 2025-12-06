import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	age: integer('age')
});
// In your db/schema.ts file
export const markdownFiles = sqliteTable('markdown_files', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    file_name: text('file_name').notNull(),
    file_path: text('file_path').notNull().unique(),  // Unique path identifier
    content: text('content').notNull(),               // Store actual content
    subject: text('subject').notNull(),
    unit: text('unit'),
    full_path: text('full_path'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at'),
});

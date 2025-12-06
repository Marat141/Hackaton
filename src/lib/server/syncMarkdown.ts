import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { db } from './db';
import { markdownFiles } from './db/schema';
import { eq } from 'drizzle-orm';

export async function syncMarkdownToDB() {
	// Najde všechny MD soubory v src/content/
	const files = await glob('src/content/**/*.md');

	console.log(`🔍 Nalezeno ${files.length} .md souborů`);

	for (const file of files) {
		const content = fs.readFileSync(file, 'utf-8');
		const fileName = path.basename(file);

		const exists = await db
			.select()
			.from(markdownFiles)
			.where(eq(markdownFiles.file_name, fileName));

		if (exists.length === 0) {
			await db.insert(markdownFiles).values({
				file_name: fileName,
				content,
				created_at: new Date().toISOString()
			});
			console.log(`🆕 INSERT: ${fileName}`);
		} else {
			await db
				.update(markdownFiles)
				.set({
					content,
					created_at: new Date().toISOString()
				})
				.where(eq(markdownFiles.file_name, fileName));
			console.log(`♻️ UPDATE: ${fileName}`);
		}
	}

	console.log('✅ Hotovo! Markdown soubory jsou v databázi.');
}

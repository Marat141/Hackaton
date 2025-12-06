import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { db } from './db';
import { markdownFiles } from './db/schema';
import { eq } from 'drizzle-orm';

export async function syncMarkdownToDB() {
	const projectRoot = process.cwd();
	const sourceDir = path.join(projectRoot, 'uploads/markdown');
	const backupDir = path.join(projectRoot, 'backup/uploads/markdown');

	console.log('📁 Project root:', projectRoot);
	console.log('📁 Source directory:', sourceDir);
	console.log('📁 Backup directory:', backupDir);

	// Create backup directory
	if (!fs.existsSync(backupDir)) {
		fs.mkdirSync(backupDir, { recursive: true });
	}

	// FIX 1: Use forward slashes for glob patterns, even on Windows
	// Convert Windows path to forward slashes for glob
	const sourceDirForGlob = sourceDir.replace(/\\/g, '/');

	// FIX 2: Use proper glob pattern with forward slashes
	const searchPattern = `${sourceDirForGlob}/**/*.md`;
	console.log('🔍 Searching for files with pattern:', searchPattern);

	// FIX 3: Add Windows path handling options
	const files = await glob(searchPattern, {
		windowsPathsNoEscape: true, // Important for Windows
		absolute: true // Get absolute paths
	});

	console.log(`🔍 Nalezeno ${files.length} .md souborů`);

	// DEBUG: Manually find files if glob fails
	if (files.length === 0) {
		console.log('⚠️  Trying manual file search...');
		const manualFiles = findAllMarkdownFiles(sourceDir);
		console.log(`🔍 Manually found ${manualFiles.length} files`);

		if (manualFiles.length > 0) {
			await processFiles(manualFiles, sourceDir, backupDir);
			return;
		}

		console.log('❌ No markdown files found!');
		return;
	}

	await processFiles(files, sourceDir, backupDir);
	console.log('✅ Hotovo! Markdown soubory jsou v databázi.');
}

// Helper function to manually find all markdown files
function findAllMarkdownFiles(dir: string): string[] {
	const files: string[] = [];

	function traverse(currentDir: string) {
		const items = fs.readdirSync(currentDir, { withFileTypes: true });

		for (const item of items) {
			const fullPath = path.join(currentDir, item.name);

			if (item.isDirectory()) {
				traverse(fullPath);
			} else if (item.isFile() && item.name.endsWith('.md')) {
				files.push(fullPath);
			}
		}
	}

	traverse(dir);
	return files;
}

// Process files helper
async function processFiles(files: string[], sourceDir: string, backupDir: string) {
	for (const file of files) {
		console.log('📄 Processing:', file);

		try {
			const content = fs.readFileSync(file, 'utf-8');
			const fileName = path.basename(file);

			// Get relative path from source directory
			const relativePath = path.relative(sourceDir, file);
			const pathParts = relativePath.split(path.sep);

			const subject = pathParts[0] || 'unknown';
			const unit = pathParts[1] || 'unknown';
			const fileIdentifier = relativePath.replace(/\\/g, '/');

			// Create backup
			const backupSubjectDir = path.join(backupDir, subject, unit);
			if (!fs.existsSync(backupSubjectDir)) {
				fs.mkdirSync(backupSubjectDir, { recursive: true });
			}

			const backupFilePath = path.join(backupSubjectDir, fileName);
			fs.writeFileSync(backupFilePath, content);

			// Check if file exists in database
			const exists = await db
				.select()
				.from(markdownFiles)
				.where(eq(markdownFiles.file_path, fileIdentifier));

			if (exists.length === 0) {
				await db.insert(markdownFiles).values({
					file_name: fileName,
					file_path: fileIdentifier,
					content: content,
					subject: subject,
					unit: unit,
					full_path: `${subject}/${unit}`,
					created_at: new Date().toISOString()
				});
				console.log(`🆕 INSERT: ${fileIdentifier}`);
			} else {
				await db
					.update(markdownFiles)
					.set({
						content: content,
						updated_at: new Date().toISOString()
					})
					.where(eq(markdownFiles.file_path, fileIdentifier));
				console.log(`♻️ UPDATE: ${fileIdentifier}`);
			}
		} catch (error) {
			console.error(`❌ Error processing ${file}:`, error);
		}
	}
}

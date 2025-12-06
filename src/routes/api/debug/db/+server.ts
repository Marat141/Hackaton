// src/routes/api/debug/db/+server.ts
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { markdownFiles } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';
import { count } from 'drizzle-orm';

// Definice typu pro searchTest
interface SearchTestResult {
	id: number;
	file_name: string;
	subject: string;
}

interface SearchTest {
	query: string;
	results: number;
	sample: SearchTestResult[];
	error?: string;
}

export async function GET() {
	try {
		console.log('🔍 Debug: Checking database state (LibSQL/Turso)...');

		// Metoda 1: Získejte počet záznamů
		const markdownCountResult = await db.select({ count: count() }).from(markdownFiles);
		const totalFiles = markdownCountResult[0]?.count || 0;

		console.log(`📊 Total markdown files in DB: ${totalFiles}`);

		// Metoda 2: Získejte ukázkové soubory
		const sampleFiles = await db
			.select({
				id: markdownFiles.id,
				file_name: markdownFiles.file_name,
				file_path: markdownFiles.file_path,
				subject: markdownFiles.subject,
				unit: markdownFiles.unit,
				created_at: markdownFiles.created_at
			})
			.from(markdownFiles)
			.limit(5);

		console.log(`📄 Sample files retrieved: ${sampleFiles.length}`);

		// Metoda 3: Pro LibSQL/Turso použijte client přímo
		let tables: any[] = [];
		try {
			// Pro LibSQL client
			const client = (db as any).$client;
			if (client) {
				// Pro SQLite kompatibilní syntaxi
				const result = await client.execute('SELECT name FROM sqlite_master WHERE type="table"');
				tables = result.rows || [];
				console.log(
					'📋 Tables found via client:',
					tables.map((t) => t.name)
				);
			}
		} catch (tableError: any) {
			console.warn('Could not fetch tables via client:', tableError?.message);

			// Fallback: Zkuste přímý SQL dotaz přes Drizzle
			try {
				const result = await db.run(sql`SELECT name FROM sqlite_master WHERE type='table'`);
				tables = result.rows || [];
			} catch (fallbackError: any) {
				console.warn('Fallback table query also failed:', fallbackError?.message);
			}
		}

		// Získejte obsah prvních souborů pro preview
		const filesWithContent = await Promise.all(
			sampleFiles.map(async (file) => {
				try {
					const contentResult = await db
						.select({ content: markdownFiles.content })
						.from(markdownFiles)
						.where(sql`${markdownFiles.id} = ${file.id}`)
						.limit(1);

					const content = contentResult[0]?.content || '';
					return {
						...file,
						content_length: content.length,
						content_preview:
							content.length > 0
								? content.substring(0, 200).replace(/\n/g, ' ') + '...'
								: 'No content'
					};
				} catch (error) {
					return {
						...file,
						content_length: 0,
						content_preview: 'Error fetching content',
						error: error instanceof Error ? error.message : 'Unknown error'
					};
				}
			})
		);

		// Otestujte full-text search
		let searchTest: SearchTest = {
			query: '',
			results: 0,
			sample: []
		};

		try {
			const searchResults = await db
				.select({
					id: markdownFiles.id,
					file_name: markdownFiles.file_name,
					subject: markdownFiles.subject
				})
				.from(markdownFiles)
				.where(
					sql`${markdownFiles.content} LIKE ${'%grammar%'} OR ${markdownFiles.content} LIKE ${'%vocabulary%'}`
				)
				.limit(3);

			searchTest = {
				query: "LIKE '%grammar%' OR LIKE '%vocabulary%'",
				results: searchResults.length,
				sample: searchResults
			};
		} catch (searchError: any) {
			console.warn('Search test failed:', searchError?.message);
			searchTest = {
				query: 'LIKE test failed',
				results: 0,
				sample: [],
				error: searchError?.message
			};
		}

		// Zkontrolujte strukturu databáze
		let dbInfo = {
			clientType: 'LibSQL/Turso',
			hasClient: !!(db as any).$client,
			sampleQueryWorks: sampleFiles.length > 0,
			countQueryWorks: totalFiles >= 0
		};

		const response = {
			success: true,
			database: {
				totalFiles,
				tables: tables.map((t) => t?.name).filter(Boolean),
				tableCount: tables.length,
				info: dbInfo
			},
			sampleFiles: filesWithContent,
			searchTest,
			syncStatus: totalFiles > 0 ? 'DATABASE_POPULATED' : 'DATABASE_EMPTY',
			recommendations:
				totalFiles === 0
					? [
							'🚨 No files found in database!',
							'1. Run: npm run sync-markdown',
							'2. Check: uploads/markdown directory exists',
							'3. Verify: .md files are in uploads/markdown/english/Unit-1/ etc.'
						]
					: [
							'✅ Database is ready for AI context',
							`Found ${totalFiles} markdown files`,
							'Chat API can now access these files'
						],
			fileStructureExample: {
				expected: 'uploads/markdown/subject/unit/filename.md',
				example: 'uploads/markdown/english/Unit-1/unit-1-notes.md',
				databasePath: 'english/Unit-1/unit-1-notes.md'
			}
		};

		console.log('✅ Debug endpoint complete');
		console.log('Response:', JSON.stringify(response, null, 2));

		return json(response);
	} catch (error: any) {
		console.error('❌ Database debug error:', error);

		return json(
			{
				success: false,
				error: 'Database debug failed',
				message: error?.message || 'Unknown error',
				stack: error?.stack,
				possibleIssues: [
					'LibSQL client not configured properly',
					'Database URL incorrect in .env',
					'Turso authentication failed',
					'Network connection issue'
				],
				immediateActions: [
					'Check .env file for DATABASE_URL and AUTH_TOKEN',
					'Verify Turso database is running: turso db show',
					'Test connection: turso db shell your-db-name'
				],
				drizzleConfig: {
					using: 'LibSQL (Turso)',
					shouldUse: 'db.select() or db.run(sql`...`)',
					avoid: 'db.execute() - not available in LibSQL'
				}
			},
			{ status: 500 }
		);
	}
}

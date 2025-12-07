//src\lib\server\syncMarkdown.ts
import fs from 'fs';
import * as path from 'path';
import { db } from './db';
import { markdownFiles } from './db/schema';
import { eq } from 'drizzle-orm';

export async function syncMarkdownToDB() {
    const projectRoot = process.cwd();
    
    // Vytvoření cesty k souborům ve static
    const sourceDir = path.join(projectRoot, 'static', 'books');
    const backupDir = path.join(projectRoot, 'backup', 'static', 'books');

    console.log('📁 Project root:', projectRoot);
    console.log('📁 Source directory:', sourceDir);
    console.log('📁 Backup directory:', backupDir);

    // Nejprve zkontrolujeme, zda zdrojový adresář existuje
    if (!fs.existsSync(sourceDir)) {
        console.error(`❌ Source directory does not exist: ${sourceDir}`);
        console.log('💡 Creating directory structure...');
        
        // Vytvoření adresářové struktury
        fs.mkdirSync(sourceDir, { recursive: true });
        
        // Vytvoření příkladové struktury
        const exampleDir = path.join(sourceDir, 'english', 'Unit-1');
        fs.mkdirSync(exampleDir, { recursive: true });
        
        // Vytvoření příkladového markdown souboru
        const exampleFile = path.join(exampleDir, 'unit-1-english-notes.md');
        fs.writeFileSync(exampleFile, '# Example Markdown\n\nThis is an example file.');
        
        console.log(`✅ Created example structure at: ${exampleFile}`);
        console.log('👉 Please add your actual markdown files to:', sourceDir);
        return;
    }

    // Vytvoření záložního adresáře
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    // Hledání všech .md souborů pomocí rekurzivního hledání
    console.log('🔍 Searching for markdown files...');
    const files = findAllMarkdownFiles(sourceDir);
    console.log(`🔍 Found ${files.length} .md files`);

    if (files.length === 0) {
        console.log('📁 Listing directory contents:');
        listDirectoryContents(sourceDir, 0);
        return;
    }

    await processFiles(files, sourceDir, backupDir);
    console.log('✅ Hotovo! Markdown soubory jsou v databázi.');
}

// List directory contents with indentation
function listDirectoryContents(dir: string, depth: number = 0) {
    const indent = '  '.repeat(depth);
    
    try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            console.log(`${indent}${item.isDirectory() ? '📁' : '📄'} ${item.name}`);
            
            if (item.isDirectory()) {
                listDirectoryContents(fullPath, depth + 1);
            }
        }
    } catch (error) {
        const err = error as Error;
        console.log(`${indent}❌ Cannot read directory: ${err.message}`);
    }
}

// Simple recursive file finder
function findAllMarkdownFiles(dir: string): string[] {
    const files: string[] = [];

    function traverse(currentDir: string) {
        try {
            const items = fs.readdirSync(currentDir, { withFileTypes: true });

            for (const item of items) {
                const fullPath = path.join(currentDir, item.name);

                if (item.isDirectory()) {
                    traverse(fullPath);
                } else if (item.isFile() && item.name.toLowerCase().endsWith('.md')) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            const err = error as Error;
            console.error(`❌ Error reading directory ${currentDir}:`, err.message);
        }
    }

    traverse(dir);
    return files;
}

// Process files helper
async function processFiles(files: string[], sourceDir: string, backupDir: string) {
    for (const file of files) {
        console.log('📄 Processing:', path.relative(sourceDir, file));

        try {
            const content = fs.readFileSync(file, 'utf-8');
            const fileName = path.basename(file);

            // Get relative path
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
            const err = error as Error;
            console.error(`❌ Error processing ${file}:`, err.message);
        }
    }
}

const fs = require('fs');
const path = require('path');
const { Database } = require('@turso/client');
const glob = require('glob');

// Připoj se k Turso databázi pomocí URL a tokenu
const db = new Database({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

// Definuj název tabulky pro ukládání souborů
const markdownTable = 'markdown_files';

// Pomocná funkce pro uložení Markdown souborů do databáze
async function saveMarkdownToDB(fileName, content) {
  try {
    await db.table(markdownTable).insert({
      file_name: fileName,
      content: content,
      created_at: new Date(),
    });
    console.log(`Soubor ${fileName} byl úspěšně nahrán do databáze.`);
  } catch (error) {
    console.error(`Chyba při ukládání souboru ${fileName}:`, error);
  }
}

// Funkce pro zpracování souborů v konkrétní složce
async function processFiles() {
  // Vyhledej všechny soubory .md v content/english/Unit-*
  glob('content/english/Unit-*/**/*.md', async (err, files) => {
    if (err) {
      console.error('Chyba při hledání souborů:', err);
      return;
    }

    for (let file of files) {
      const content = fs.readFileSync(file, 'utf-8');  // Načti obsah souboru
      const fileName = path.basename(file);  // Získáme název souboru

      await saveMarkdownToDB(fileName, content);  // Ulož soubor do databáze
    }
  });
}

// Spusť zpracování souborů
processFiles();

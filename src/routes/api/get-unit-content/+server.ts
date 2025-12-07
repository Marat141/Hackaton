import { json } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import type { RequestHandler } from '@sveltejs/kit';
import { getSubjectDir, getSubjectFilePrefix, isValidSubject } from '$lib/constants/subjects';

export const GET: RequestHandler = async ({ url }) => {
    const subject = url.searchParams.get('subject');
    const unit = url.searchParams.get('unit');

    if (!subject || !unit) {
        return json({ 
            error: 'Missing subject or unit parameter',
            received: { subject, unit }
        }, { status: 400 });
    }

    // Validace předmětu
    if (!isValidSubject(subject)) {
        return json({
            error: 'Invalid subject',
            subject,
            validSubjects: ['english', 'cestina', 'dejepis', 'matematika']
        }, { status: 400 });
    }

    try {
        // Normalize unit format
        let unitNumber: string;
        
        if (unit.toLowerCase().startsWith('unit-')) {
            unitNumber = unit.split('-')[1] || unit.replace(/^unit-/i, '');
        } else {
            unitNumber = unit;
        }
        
        // Validace čísla jednotky
        if (!unitNumber || isNaN(parseInt(unitNumber))) {
            return json({
                error: 'Invalid unit number',
                unit
            }, { status: 400 });
        }
        
        // Získání správných názvů
        const subjectDir = getSubjectDir(subject);
        const filePrefix = getSubjectFilePrefix(subject);
        
        // Vytvoření cesty k souboru
        const filePath = path.join(
            'static', 
            'books', 
            subjectDir, 
            `Unit-${unitNumber}`, 
            `unit-${unitNumber}-${filePrefix}-notes.md`
        );

        console.log('Looking for file at:', filePath);
        
        // Zkontrolujte, zda soubor existuje
        if (!fs.existsSync(filePath)) {
            // Zkuste najít alternativní formáty
            const alternativePaths = [
                path.join('static', 'books', subjectDir, `Unit-1`, `unit-1-dejepis-notes.md`), // Fallback pro dejepis
                path.join('static', 'books', subjectDir, `Unit-${unitNumber}`, `notes.md`), // Jednodušší název
                path.join('static', 'books', subjectDir, `unit-${unitNumber}`, `notes.md`), // Malé písmeno
            ];
            
            let foundPath = null;
            for (const altPath of alternativePaths) {
                if (fs.existsSync(altPath)) {
                    foundPath = altPath;
                    break;
                }
            }
            
            if (!foundPath) {
                throw new Error(`File not found. Tried: ${filePath}`);
            }
            
            // Načtěte z alternativní cesty
            const markdownContent = await readFile(foundPath, 'utf-8');
            const htmlContent = marked(markdownContent);
            
            return json({
                subject,
                unit: `Unit-${unitNumber}`,
                content: htmlContent,
                found: true,
                note: 'Loaded from alternative path',
                filePath: foundPath,
                timestamp: new Date().toISOString()
            });
        }
        
        // Načítání souboru
        const markdownContent = await readFile(filePath, 'utf-8');
        const htmlContent = marked(markdownContent);

        return json({
            subject,
            unit: `Unit-${unitNumber}`,
            content: htmlContent,
            found: true,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Error fetching unit content:', error);

        // Vraťte demo obsah pokud soubor neexistuje
        const demoContent = `
# Demo obsah pro ${subject} Unit ${unit}

Toto je demo obsah, protože skutečné poznámky nebyly nalezeny.

## Co můžete dělat:
1. Přidejte své poznámky do složky static/books/
2. Formát souboru: unit-${unit}-${subject}-notes.md
3. Umístění: static/books/${getSubjectDir(subject)}/Unit-${unit}/

## Ukázka formátování:

**Tučně** a *kurzíva*

- Seznam
- Bodů

> Citace

\`\`\`javascript
// Kód
console.log("Hello World");
\`\`\`
        `;

        return json({
            subject,
            unit,
            content: marked(demoContent),
            found: false,
            error: error.message,
            isDemo: true,
            timestamp: new Date().toISOString()
        }, { status: 404 });
    }
};
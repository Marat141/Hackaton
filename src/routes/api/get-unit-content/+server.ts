// src/routes/api/get-unit-content/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getNotesByUnit } from '$lib/server/content';

export const GET: RequestHandler = async ({ url }) => {
    const subject = url.searchParams.get('subject');
    const unit = url.searchParams.get('unit');

    // Validace vstupů
    if (!subject || !unit) {
        return json({ error: 'Missing subject or unit parameter' }, { status: 400 });
    }

    try {
        // Získání skutečného obsahu z databáze
        const notes = await getNotesByUnit(subject, `Unit-${unit}`);
        
        if (notes.length === 0) {
            return json({
                subject,
                unit,
                content: `No notes found for ${subject} Unit ${unit}.`,
                found: false,
                timestamp: new Date().toISOString()
            });
        }

        // Kombinuj obsah všech poznámek pro daný unit
        let combinedContent = '';
        notes.forEach((note, index) => {
            combinedContent += `=== Note ${index + 1}: ${note.file_name} ===\n`;
            combinedContent += note.content + '\n\n';
        });

        return json({
            subject,
            unit,
            content: combinedContent,
            found: true,
            notesCount: notes.length,
            fileNames: notes.map(n => n.file_name),
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Error fetching unit content:', error);
        
        return json({
            subject,
            unit,
            content: `Error loading content for ${subject} Unit ${unit}: ${error.message}`,
            found: false,
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
};
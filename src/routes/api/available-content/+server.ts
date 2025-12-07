import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
    const basePath = path.join(process.cwd(), 'static', 'books');
    
    try {
        if (!fs.existsSync(basePath)) {
            return json({
                message: 'Static books directory not found',
                path: basePath,
                subjects: []
            });
        }

        const subjects = fs.readdirSync(basePath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        const availableContent = subjects.map(subject => {
            const subjectPath = path.join(basePath, subject);
            const units = fs.readdirSync(subjectPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory() && 
                      (dirent.name.startsWith('Unit-') || dirent.name.startsWith('unit-')))
                .map(dirent => dirent.name);

            return {
                subject,
                units: units.map(unit => {
                    const unitPath = path.join(subjectPath, unit);
                    const files = fs.readdirSync(unitPath)
                        .filter(file => file.endsWith('.md') || file.endsWith('.txt'));
                    
                    return {
                        unit,
                        hasNotes: files.some(file => file.includes('notes')),
                        files
                    };
                })
            };
        });

        // Filtrujeme pouze předměty, které mají alespoň jednu jednotku s poznámkami
        const contentWithNotes = availableContent.filter(subject => 
            subject.units.some(unit => unit.hasNotes)
        );

        return json({
            totalSubjects: subjects.length,
            subjectsWithContent: contentWithNotes.length,
            availableContent: contentWithNotes
        });

    } catch (error: any) {
        return json({
            error: error.message,
            path: basePath
        }, { status: 500 });
    }
};
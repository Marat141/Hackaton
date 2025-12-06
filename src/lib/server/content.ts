// src/lib/server/content.ts
import { marked } from 'marked';
import { db } from './db';
import { markdownFiles } from './db/schema';
import { eq, like, or, and } from 'drizzle-orm';

// Typ pro výsledky vyhledávání
export interface SearchResult {
  id: number;
  file_name: string;
  file_path: string;
  subject: string;
  unit: string | null;
  content: string;
  created_at: string;
  excerpt: string;
}

export async function fetchMarkdownFromDB(path: string) {
  const normalizedPath = path.replace(/\\/g, '/').toLowerCase();
  
  try {
    const file = await db
      .select()
      .from(markdownFiles)
      .where(
        or(
          eq(markdownFiles.file_path, normalizedPath),
          like(markdownFiles.file_path, `%${path.split('/').pop()}`)
        )
      )
      .limit(1);

    if (file.length === 0) {
      console.error(`File not found in database: ${path}`);
      throw new Error('CONTENT_NOT_FOUND');
    }

    const markdown = file[0].content;
    const html = marked(markdown);

    return { 
      markdown, 
      html,
      metadata: {
        fileName: file[0].file_name,
        subject: file[0].subject,
        unit: file[0].unit
      }
    };
  } catch (error) {
    console.error('Error fetching from database:', error);
    throw error;
  }
}

export async function fetchMarkdownFromContent(path: string) {
  return fetchMarkdownFromDB(path);
}

export async function searchRelevantNotes(query: string, limit: number = 5): Promise<SearchResult[]> {
  try {
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    if (words.length === 0) {
      return [];
    }

    const conditions = words.map(word => 
      like(markdownFiles.content, `%${word}%`)
    );

    const results = await db
      .select({
        id: markdownFiles.id,
        file_name: markdownFiles.file_name,
        file_path: markdownFiles.file_path,
        subject: markdownFiles.subject,
        unit: markdownFiles.unit,
        content: markdownFiles.content,
        created_at: markdownFiles.created_at
      })
      .from(markdownFiles)
      .where(or(...conditions))
      .limit(limit);

    // Transformujte výsledky na SearchResult typ
    return results.map(file => ({
      ...file,
      excerpt: file.content.substring(0, 200) + '...'
    }));
  } catch (error) {
    console.error('Error searching notes:', error);
    return [];
  }
}

// Typ pro poznámky podle unit
interface UnitNote {
  id: number;
  file_name: string;
  file_path: string;
  subject: string;
  unit: string | null;
  content: string;
  full_path: string | null;
  created_at: string;
  updated_at: string | null;
}

export async function getNotesByUnit(subject: string, unit: string): Promise<UnitNote[]> {
  try {
    const results = await db
      .select()
      .from(markdownFiles)
      .where(
        and(
          eq(markdownFiles.subject, subject.toLowerCase()),
          eq(markdownFiles.unit, unit)
        )
      );

    return results;
  } catch (error) {
    console.error('Error fetching notes by unit:', error);
    return [];
  }
}
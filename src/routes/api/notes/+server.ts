// src/routes/api/notes/+server.ts
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { markdownFiles } from '$lib/server/db/schema';
import { eq, like, desc, and } from 'drizzle-orm';

// GET: Získání seznamu poznámek
export async function GET({ url }) {
  try {
    const subject = url.searchParams.get('subject');
    const unit = url.searchParams.get('unit');
    const search = url.searchParams.get('search');
    
    // Vytvořte základní query builder
    let whereConditions = [];
    
    if (subject) {
      whereConditions.push(eq(markdownFiles.subject, subject));
    }
    
    if (unit) {
      whereConditions.push(eq(markdownFiles.unit, unit));
    }
    
    if (search) {
      whereConditions.push(like(markdownFiles.content, `%${search}%`));
    }
    
    // Sestavte finální query
    const notes = await db
      .select()
      .from(markdownFiles)
      .where(
        whereConditions.length > 0 
          ? and(...whereConditions)
          : undefined
      )
      .orderBy(desc(markdownFiles.created_at));
    
    return json({
      success: true,
      data: notes,
      count: notes.length
    });
    
  } catch (error) {
    console.error('Error fetching notes:', error);
    return json(
      { success: false, error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

// POST: Vytvoření nové poznámky
export async function POST({ request }) {
  try {
    const body = await request.json();
    
    const { file_name, file_path, content, subject, unit } = body;
    
    if (!file_name || !content) {
      return json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const [note] = await db
      .insert(markdownFiles)
      .values({
        file_name,
        file_path: file_path || `${subject}/${unit}/${file_name}`,
        content,
        subject: subject || 'unknown',
        unit: unit || null,
        full_path: `${subject}/${unit}`,
        created_at: new Date().toISOString()
      })
      .returning();
    
    return json({
      success: true,
      data: note,
      message: 'Note created successfully'
    });
    
  } catch (error) {
    console.error('Error creating note:', error);
    return json(
      { success: false, error: 'Failed to create note' },
      { status: 500 }
    );
  }
}
// src/routes/api/chat/+server.ts - FINÁLNÍ FUNKČNÍ VERZE
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from '@google/genai';
import { searchRelevantNotes, getNotesByUnit } from '$lib/server/content';

const GEMINI_API_KEY = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('⚠️ Gemini API key is missing');
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function getRelevantContext(query: string, currentUnit?: string): Promise<string> {
  try {
    console.log(`🔍 AI Context search for: "${query.substring(0, 50)}..."`);
    
    // 1. Vyhledej relevantní poznámky
    const relevantNotes = await searchRelevantNotes(query, 3);
    console.log(`📚 Found ${relevantNotes.length} relevant notes from search`);
    
    // 2. Pokud máme currentUnit, přidej její poznámky
    let unitNotes: any[] = [];
    if (currentUnit) {
      console.log(`📖 Getting notes for Unit ${currentUnit}`);
      const notes = await getNotesByUnit('english', `Unit-${currentUnit}`);
      unitNotes = notes;
      console.log(`📖 Found ${notes.length} notes for Unit ${currentUnit}`);
    }
    
    // 3. Kombinuj výsledky bez duplicit
    const allNotes = [...relevantNotes];
    const addedIds = new Set(relevantNotes.map(n => n.id));
    
    unitNotes.forEach(unitNote => {
      if (!addedIds.has(unitNote.id)) {
        allNotes.push({
          ...unitNote,
          excerpt: unitNote.content?.substring(0, 200) + '...' || ''
        });
        addedIds.add(unitNote.id);
      }
    });

    if (allNotes.length === 0) {
      console.log('📭 No relevant notes found in database');
      return '';
    }

    console.log(`📋 Using ${allNotes.length} total notes for context`);
    
    // 4. Sestav kontext pro AI
    let context = "STUDENT'S NOTES FROM DATABASE (Use this information to answer):\n\n";
    
    allNotes.forEach((note, index) => {
      context += `=== NOTE ${index + 1}: ${note.subject} - ${note.unit} ===\n`;
      context += `📄 File: ${note.file_name}\n`;
      
      // Použij content nebo excerpt
      const content = note.content || '';
      const contentPreview = content.length > 800 
        ? content.substring(0, 800) + '...' 
        : content;
      
      context += `${contentPreview}\n\n`;
    });

    context += "INSTRUCTIONS FOR AI:\n";
    context += "1. Use the notes above to answer the student's question\n";
    context += "2. Reference specific sections when possible\n";
    context += "3. Keep answers clear and educational\n";
    context += "4. Respond in Czech if the question is in Czech\n\n";
    
    return context;
    
  } catch (error: any) {
    console.error('❌ Error getting context:', error.message);
    return '';
  }
}

export async function POST({ request }) {
  try {
    if (!GEMINI_API_KEY) {
      return json(
        { 
          error: 'API key not configured',
          message: '⚠️ API klíč není nastavený'
        }, 
        { status: 500 }
      );
    }

    const { messages, currentUnit }: { 
      messages: { role: string; content: string }[],
      currentUnit?: string 
    } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Získej poslední zprávu uživatele
    const lastUserMessage = messages
      .filter(msg => msg.role === 'user')
      .pop()?.content || '';
    
    console.log(`💬 Chat request - Unit: ${currentUnit || 'none'}, Message: "${lastUserMessage.substring(0, 50)}..."`);

    // Získej kontext z databáze
    const dbContext = await getRelevantContext(lastUserMessage, currentUnit);
    
    // System prompt s kontextem
    const systemMessage = dbContext 
      ? `Jsi AI učitel angličtiny. Máš přístup k poznámkám studenta:\n\n${dbContext}\n\nOdpovídej na základě těchto poznámek.`
      : `Jsi AI učitel angličtiny. Pomáhej studentům s učením angličtiny.`;

    // Formátování pro Gemini API
    const contents = [
      {
        role: 'user',
        parts: [{ text: systemMessage }]
      },
      {
        role: 'model',
        parts: [{ text: 'Rozumím. Jsem připraven odpovídat na otázky o angličtině.' }]
      },
      ...messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    ];

    // Volání Gemini API
    console.log('🤖 Calling Gemini API...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: contents,
      config: {
        temperature: 0.3,
        maxOutputTokens: 1500,
        topP: 0.8,
        topK: 40
      }
    });

    const assistantMessage = response.text;

    if (!assistantMessage) {
      throw new Error('Gemini API returned empty response');
    }

    console.log('✅ AI response generated');
    
    return json({
      message: assistantMessage,
      role: 'assistant',
      metadata: {
        usedContext: dbContext.length > 0,
        contextLength: dbContext.length,
        notesUsed: dbContext.length > 0 ? 'From database' : 'No context'
      }
    });

  } catch (error: any) {
    console.error('❌ Chat API error:', error);
    
    let errorMessage = 'Došlo k chybě při zpracování požadavku';
    if (error.message.includes('API key')) {
      errorMessage = 'Chybějící API klíč. Zkontrolujte GEMINI_API_KEY v .env';
    } else if (error.message.includes('quota')) {
      errorMessage = 'Překročen limit API. Zkontrolujte quota v Google AI Studio.';
    }
    
    return json(
      {
        error: errorMessage,
        message: `⚠️ ${errorMessage}`
      },
      { status: 500 }
    );
  }
}
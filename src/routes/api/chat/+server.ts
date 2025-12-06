// src/routes/api/chat/+server.ts
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from '@google/genai'; // Official library[citation:1][citation:3]

// Initialize Google GenAI with your API key
const GEMINI_API_KEY = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('⚠️ Gemini API key is missing. Please set GEMINI_API_KEY or GOOGLE_API_KEY in .env file');
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function POST({ request }) {
  try {
    // Check for API key
    if (!GEMINI_API_KEY) {
      return json(
        { 
          error: 'API key not configured. Please set GEMINI_API_KEY in .env file.',
          message: '⚠️ API klíč není nastavený. Zkontrolujte prosím konfiguraci v .env souboru.'
        }, 
        { status: 500 }
      );
    }

    // Parse request body
    const { messages }: { messages: { role: string; content: string }[] } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return json({ error: 'Messages array is required' }, { status: 400 });
    }

    // System message for the assistant
    const systemMessage = {
      role: 'system',
      content: `Jsi užitečný AI asistent pro studenty, který pomáhá s učením a porozuměním učebnicím a pracovním sešitům. 
      Odpovídej stručně, přehledně a zaměřuj se na klíčové informace. 
      Pomáhej studentům pochopit složité koncepty jednoduchým způsobem.
      Odpovídej v češtině, pokud student píše česky.`
    };

    // Format messages for Gemini API
    // Gemini expects contents as an array where each item is a complete turn in conversation
    const contents = [
      // First content: system message as user role (this is how Gemini handles system prompts)
      {
        role: 'user',
        parts: [{ text: systemMessage.content }]
      },
      // Second content: assistant's initial response
      {
        role: 'model',
        parts: [{ text: 'Rozumím. Jsem AI asistent připravený pomoci s učením. Jakou otázku máš?' }]
      },
      // Add all conversation messages
      ...messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    ];

    // Make API call to Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite', // You can change this to gemini-2.0-flash or gemini-1.5-flash
      contents: contents,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 0.8,
        topK: 40
      }
    });

    // Extract response text
    const assistantMessage = response.text;

    if (!assistantMessage) {
      throw new Error('Gemini API returned empty response');
    }

    // Return success response
    return json({
      message: assistantMessage,
      role: 'assistant'
    });

  } catch (error: unknown) {
    console.error('Chat API error:', error);

    // Handle specific error types
    let errorMessage = 'Došlo k chybě při zpracování požadavku';
    let statusCode = 500;

    if (error instanceof Error) {
      // Check for API key errors
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        errorMessage = 'Neplatný nebo chybějící API klíč. Zkontrolujte GEMINI_API_KEY v .env souboru.';
      } 
      // Check for quota/limit errors
      else if (error.message.includes('quota') || error.message.includes('limit') || error.message.includes('rate limit')) {
        errorMessage = 'Překročen limit API. Zkontrolujte prosím svůj billing a quota v Google AI Studio.';
      }
      // Check for model availability errors
      else if (error.message.includes('model') || error.message.includes('not found')) {
        errorMessage = 'Model není dostupný. Zkuste změnit model na gemini-1.5-flash nebo gemini-1.0-pro.';
      } else {
        errorMessage = error.message;
      }
    }

    return json(
      {
        error: errorMessage,
        message: `⚠️ ${errorMessage}`
      },
      { status: statusCode }
    );
  }
}
import Groq from 'groq-sdk';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import dotenv from 'dotenv';
dotenv.config();

// Inicializace Groq API klienta
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY // Používáme pouze Groq API klíč
});

// Typy pro zprávy v chatu
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  message: string;
}

// Hlavní POST request handler
export const POST: RequestHandler = async ({ request }) => {
  try {
    // Načítání zpráv z těla requestu
    const body = await request.json();
    const messages: ChatMessage[] = body.messages ?? [];

    // Kontrola, jestli obsahuje alespoň nějaké zprávy
    if (!messages || messages.length === 0) {
      return json({ error: 'Chybí zprávy ke zpracování.' }, { status: 400 });
    }

    // Předání zpráv do systému (tady přidáváme default systémovou zprávu)
    const finalMessages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'Jsi AI asistent zaměřený na vysvětlování učiva studentům. Odpovídej česky, jasně a stručně.'
      },
      ...messages // Přidání uživatelských zpráv
    ];

    // Použití Groq SDK (pro rychlejší řešení s Mixtral modelem)
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Model, který chceš použít, můžeš změnit dle potřeby
      messages: finalMessages
    });

    const reply = completion.choices?.[0]?.message?.content ?? 'Omlouvám se, nerozumím.';

    const response: ChatResponse = { message: reply };

    return json(response); // Vrátí odpověď zpět na frontend
  } catch (error: unknown) {
    let errMsg = 'Neznámá chyba';

    // Ošetření neznámé chyby
    if (error instanceof Error) {
      errMsg = error.message;
    }

    // Logování chyby na server
    console.error('CHAT API ERROR:', errMsg);

    return json({ error: errMsg }, { status: 500 });
  }
};

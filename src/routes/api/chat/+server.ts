// src/routes/api/chat/+server.ts
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import Groq from 'groq-sdk';
import { getNotesByUnit, searchRelevantNotes } from '$lib/server/content';

/** @type {import('./$types').RequestHandler} */
console.log('Env keys', { GROQ: !!env.GROQ_API_KEY, OPENAI: !!env.OPENAI_API_KEY });

// Funkce pro získání relevantního kontextu na základě předmětu a unity
// Vrací jak kontext, tak seznam poznámek pro metadata
async function getRelevantContext(
    query: string, 
    subject?: string, 
    currentUnit?: string
): Promise<{ context: string; notes: any[] }> {
    try {
        console.log(`🔍 AI Context search - Subject: ${subject || 'any'}, Unit: ${currentUnit || 'any'}, Query: "${query.substring(0, 50)}..."`);

        let allNotes: any[] = [];

        // 1. Pokud máme konkrétní předmět a unit, načti její poznámky
        if (subject && currentUnit) {
            console.log(`📖 Getting notes for ${subject} - Unit ${currentUnit}`);
            const unitNotes = await getNotesByUnit(subject, `Unit-${currentUnit}`);
            allNotes = unitNotes;
            console.log(`📖 Found ${unitNotes.length} notes for ${subject} Unit ${currentUnit}`);
        }

        // 2. Pokud máme query, vyhledej relevantní poznámky (napříč všemi předměty)
        if (query.trim().length > 0) {
            console.log(`🔎 Searching relevant notes for query: "${query.substring(0, 50)}..."`);
            const relevantNotes = await searchRelevantNotes(query, 3);
            console.log(`📚 Found ${relevantNotes.length} relevant notes from search`);
            
            // Přidej relevantní poznámky, ale odstraň duplicity
            const addedIds = new Set(allNotes.map((n) => n.id));
            relevantNotes.forEach((note) => {
                if (!addedIds.has(note.id)) {
                    allNotes.push({
                        ...note,
                        excerpt: note.content?.substring(0, 200) + '...' || ''
                    });
                    addedIds.add(note.id);
                }
            });
        }

        if (allNotes.length === 0) {
            console.log('📭 No relevant notes found in database');
            return { context: '', notes: [] };
        }

        console.log(`📋 Using ${allNotes.length} total notes for context`);

        let context = "STUDENT'S NOTES FROM DATABASE (Use this information to answer):\n\n";

        // Seskup poznámky podle předmětu
        const notesBySubject: Record<string, any[]> = {};
        allNotes.forEach((note) => {
            if (!notesBySubject[note.subject]) {
                notesBySubject[note.subject] = [];
            }
            notesBySubject[note.subject].push(note);
        });

        // Přidej obsah podle předmětů
        Object.entries(notesBySubject).forEach(([subject, notes]) => {
            context += `=== ${subject.toUpperCase()} ===\n`;
            
            notes.forEach((note, index) => {
                context += `--- Note ${index + 1}: ${note.unit} ---\n`;
                context += `📄 File: ${note.file_name}\n`;

                const content = note.content || '';
                const contentPreview = content.length > 600 ? content.substring(0, 600) + '...' : content;

                context += `${contentPreview}\n\n`;
            });
            context += '\n';
        });

        context += 'INSTRUCTIONS FOR AI:\n';
        context += "1. Use the notes above to answer the student's question\n";
        context += '2. Focus on the relevant subject if specified\n';
        context += '3. Reference specific sections when possible\n';
        context += '4. Keep answers clear and educational\n';
        context += '5. Respond in Czech if the question is in Czech\n\n';

        return { context, notes: allNotes };
    } catch (error: any) {
        console.error('❌ Error getting context:', error.message);
        return { context: '', notes: [] };
    }
}

export async function POST({ request }) {
    try {
        const { messages, action, subject, currentUnit } = await request.json();

        if (!messages || !Array.isArray(messages)) {
            return json({ error: 'Messages array is required' }, { status: 400 });
        }

        // Získej poslední zprávu uživatele
        const lastUserMessage = messages.filter((msg) => msg.role === 'user').pop()?.content || '';

        console.log(`💬 Chat request - Subject: ${subject || 'any'}, Unit: ${currentUnit || 'any'}, Action: ${action || 'chat'}, Message: "${lastUserMessage.substring(0, 50)}..."`);

        // Získej kontext z databáze na základě předmětu a unity
        const { context: dbContext, notes: allNotes } = await getRelevantContext(lastUserMessage, subject, currentUnit);

        // System prompt s kontextem
        const systemContent = dbContext
            ? `Jsi AI učitel. ${
                subject ? `Uživatel se aktuálně učí ${subject}. ` : ''
            }${
                currentUnit ? `Nachází se v Unit ${currentUnit}. ` : ''
            }Vždy si načti relevantní data a čerpej exluzivně z nich data:\n\n${dbContext}\n\nOdpovídej na základě těchto poznámek. Odpovídej v češtině.`
            : `Jsi užitečný AI asistent pro studenty, který pomáhá s učením. 
               Odpovídej stručně, přehledně a zaměřuj se na klíčové informace. 
               Pomáhej studentům pochopit složité koncepty jednoduchým způsobem.
               Odpovídej v češtině, pokud student píše češtinou.`;

        const systemMessage = {
            role: 'system',
            content: systemContent
        };

        // Přidej system message na začátek konverzace
        const conversationMessages = [systemMessage, ...messages];

        let assistantMessage = null;

        // Groq model
        const groqModel = env.GROQ_MODEL || 'llama-3.3-70b-versatile';

        // Zkus nejdřív Groq
        if (env.GROQ_API_KEY) {
            try {
                const groq = new Groq({
                    apiKey: env.GROQ_API_KEY
                });

                const completion = await groq.chat.completions.create({
                    model: groqModel,
                    messages: conversationMessages,
                    temperature: 0.3,
                    max_tokens: 2000
                });

                assistantMessage = completion.choices[0]?.message?.content;
                
                console.log(`✅ Groq response generated with model: ${groqModel}`);

            } catch (groqError: any) {
                console.warn('Groq API error:', groqError?.message || groqError);
                
                if ((groqError?.code === 'model_decommissioned' || (groqError?.message && groqError.message.includes('decommissioned'))) && groqModel !== 'llama-3.3-70b-versatile') {
                    try {
                        const groqFallback = new Groq({ apiKey: env.GROQ_API_KEY });
                        const completion2 = await groqFallback.chat.completions.create({
                            model: 'llama-3.3-70b-versatile',
                            messages: conversationMessages,
                            temperature: 0.3,
                            max_tokens: 2000
                        });
                        assistantMessage = completion2.choices[0]?.message?.content;
                        console.log('✅ Groq fallback model used: llama-3.3-70b-versatile');
                    } catch (fallbackError: any) {
                        console.warn('Groq fallback model failed as well:', fallbackError);
                    }
                }
            }
        }

        // Pokud ani jeden provider není dostupný
        if (!assistantMessage) {
            return json(
                {
                    error: 'Žádný AI provider není nakonfigurován. Nastavte prosím GROQ_API_KEY v .env souboru.\n\n💡 Groq API klíč získáte zdarma na: https://console.groq.com/keys'
                },
                { status: 500 }
            );
        }

        return json({
            message: assistantMessage,
            role: 'assistant',
            metadata: {
                subject: subject || 'not specified',
                unit: currentUnit || 'not specified',
                usedContext: dbContext.length > 0,
                contextLength: dbContext.length,
                notesUsed: allNotes.length > 0 ? `${allNotes.length} notes` : 'No context',
                provider: 'Groq',
                model: groqModel
            }
        });

    } catch (error: any) {
        console.error('Chat API error:', error);

        let errorMessage = error.message || 'Došlo k chybě při zpracování požadavku';
        let statusCode = 500;

        if (error.status === 429) {
            errorMessage = 'Překročen limit API. Zkuste to prosím za chvíli.';
            statusCode = 429;
        } else if (error.status === 401) {
            errorMessage = 'Neplatný API klíč. Zkontrolujte prosím konfiguraci v .env souboru.';
            statusCode = 401;
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
import type { PageServerLoad } from './$types';
import { fetchMarkdownFromDB } from '$lib/server/content';

export const load: PageServerLoad = async ({ params }) => {
  const { subject, unit } = params; // Získání parametrů z URL (dejepis, unit-1)

  // Zkontrolujeme, zda máme platný předmět
  const validSubjects = ['english', 'dejepis', 'zemepis', 'prirodopis']; // Seznam podporovaných předmětů

  if (!validSubjects.includes(subject)) {
    return {
      subject,
      unit,
      markdown: '',
      html: '<p>Neplatný předmět.</p>',
      error: 'Předmět nenalezen'
    };
  }

  // Vytvoříme cestu k souboru pro markdown na základě subject a unit
  const filePath = `${subject}/Unit-${unit.split('-')[1]}-${subject}-notes.md`;

  try {
    // Načteme obsah markdown souboru z databáze
    const { markdown, html, metadata } = await fetchMarkdownFromDB(filePath);

    return {
      subject,
      unit,
      markdown,
      html,
      metadata,
      filePath
    };
  } catch (err) {
    // Pokud soubor není nalezen, vrátíme výchozí hodnoty
    return {
      subject,
      unit,
      markdown: '',
      html: '<p>Poznámky pro tuto jednotku nejsou k dispozici.</p>',
      error: 'Poznámky nenalezeny v databázi'
    };
  }
};

import { readFile } from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import type { ServerLoad } from '@sveltejs/kit';
import { SUBJECT_CONFIG, type SubjectId, isValidSubject, getSubjectConfig } from '$lib/constants/subjects';

export const load: ServerLoad = async ({ params }) => {
  const { subject, unit } = params;
  
  // Základní validace parametrů
  if (!subject || !unit) {
    return {
      subject: subject || 'unknown',
      unit: unit || 'unknown',
      markdown: '',
      html: '<p>Chybějící parametry předmětu nebo jednotky.</p>',
      error: 'Chybějící parametry'
    };
  }
  
  // Validace předmětu pomocí nové funkce
  if (!isValidSubject(subject)) {
    return {
      subject,
      unit,
      markdown: '',
      html: '<p>Neplatný předmět.</p>',
      error: 'Předmět nenalezen'
    };
  }

  // Použijte bezpečnou funkci pro získání konfigurace
  const subjectConfig = getSubjectConfig(subject);
  
  if (!subjectConfig) {
    return {
      subject,
      unit,
      markdown: '',
      html: '<p>Chyba v konfiguraci předmětu.</p>',
      error: 'Chyba konfigurace'
    };
  }
  
  try {
    // Extrahuj číslo jednotky - ošetření různých formátů
    let unitNumber: string;
    
    if (unit.startsWith('unit-')) {
      unitNumber = unit.split('-')[1] || unit.replace('unit-', '');
    } else if (unit.startsWith('Unit-')) {
      unitNumber = unit.split('-')[1] || unit.replace('Unit-', '');
    } else {
      // Pokud unit už je jen číslo
      unitNumber = unit;
    }
    
    // Validace čísla jednotky
    if (!unitNumber || isNaN(parseInt(unitNumber))) {
      return {
        subject,
        unit,
        markdown: '',
        html: '<p>Neplatné číslo jednotky.</p>',
        error: 'Neplatná jednotka'
      };
    }
    
    // Vytvoření cesty k souboru
    const filePath = path.join(
      'static', 
      'books', 
      subjectConfig.dir, 
      `Unit-${unitNumber}`, 
      `unit-${unitNumber}-${subjectConfig.filePrefix}-notes.md`
    );

    // Načíst obsah
    const markdownContent = await readFile(filePath, 'utf-8');
    const htmlContent = marked(markdownContent);

    return {
      subject,
      unit,
      markdown: markdownContent,
      html: htmlContent,
      metadata: {},
      filePath
    };
  } catch (err) {
    console.error('Error loading notes:', err);
    const errorMessage = err instanceof Error ? err.message : 'Neznámá chyba';
    
    return {
      subject,
      unit,
      markdown: '',
      html: `<p>Poznámky pro tuto jednotku nejsou k dispozici.</p><p>Chyba: ${errorMessage}</p>`,
      error: 'Poznámky nenalezeny'
    };
  }
};
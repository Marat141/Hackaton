// src/routes/english/unit/[unit]/+page.server.ts
import type { PageServerLoad } from './$types';
import { fetchMarkdownFromDB } from '$lib/server/content';

export const load: PageServerLoad = async ({ params }) => {
  const unit = params.unit; // např. "1"

  // Zkuste více možných cest
  const possiblePaths = [
    `english/Unit-${unit}/unit-${unit}-notes.md`,
    `english/unit-${unit}/unit-${unit}-notes.md`,
    `english/unit-${unit}-notes.md`,
    `english/Unit${unit}/unit${unit}-notes.md`
  ];

  for (const filePath of possiblePaths) {
    try {
      const { markdown, html, metadata } = await fetchMarkdownFromDB(filePath);
      
      return {
        unit,
        markdown,
        html,
        metadata,
        filePath
      };
    } catch (err) {
      // Pokračujte k další možnosti
      continue;
    }
  }

  // Pokud žádný soubor nebyl nalezen
  return {
    unit,
    markdown: '',
    html: '<p>Notes for this unit are not available yet.</p>',
    error: 'Notes not found in database'
  };
};
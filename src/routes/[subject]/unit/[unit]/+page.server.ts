// src/routes/[subject]/unit/[unit]/+page.server.ts
import type { PageServerLoad } from './$types';
import { fetchMarkdownFromDB } from '$lib/server/content';

export const load: PageServerLoad = async ({ params }) => {
	const { subject, unit } = params; // subject (předmět) a unit (jednotka)

	// Ověříme, jestli máme validní předmět
	const validSubjects = ['english', 'dejepis']; // Tady přidáme podporu pro více předmětů

	if (!validSubjects.includes(subject)) {
		return {
			subject,
			unit,
			markdown: '',
			html: '<p>Invalid subject.</p>',
			error: 'Subject not found'
		};
	}

	// Definujeme cestu pro soubory s konkrétním názvem podle předmětu
	const filePath = `${subject}/Unit-${unit}-${subject}-notes.md`; // Např. "english/Unit-1-english-notes.md" nebo "dejepis/Unit-1-dejepis-notes.md"

	try {
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
			html: '<p>Notes for this unit are not available yet.</p>',
			error: 'Notes not found in database'
		};
	}
};

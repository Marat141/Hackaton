// src/routes/english/unit/[unit]/+page.server.ts
import type { PageServerLoad } from './$types';
import { fetchMarkdownFromContent } from '$lib/server/content';

export const load: PageServerLoad = async ({ params }) => {
	const unit = params.unit; // např. "1"

	// pro Unit 1 máme soubor unit-1-notes.md
	const filePath = `english/unit-${unit}-notes.md`;

	try {
		const { markdown, html } = await fetchMarkdownFromContent(filePath);

		return {
			unit,
			markdown,
			html
		};
	} catch (err) {
		// můžeš udělat chytrější error-handling, teď jen basic
		return {
			unit,
			markdown: '',
			html: '<p>Notes for this unit are not available yet.</p>'
		};
	}
};

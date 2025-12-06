import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const subject = url.searchParams.get('subject');
	const unit = url.searchParams.get('unit');

	// Validace vstupů
	if (!subject || !unit) {
		return json({ error: 'Missing subject or unit parameter' }, { status: 400 });
	}

	// Zde bys načítal skutečný obsah z databáze nebo souborů
	// Prozatím mock data
	const mockContent: Record<string, Record<string, string>> = {
		english: {
			'unit-1':
				'Unit 1 obsahuje základní fráze, pozdravy, představování. Slovíčka: hello, goodbye, please, thank you. Gramatika: přítomný čas prostý.',
			'unit-2': 'Unit 2: Členy, množné číslo, zájmena.'
		},
		math: {
			'unit-1': 'Unit 1: Základní operace, sčítání, odčítání, násobení, dělení.'
		},
		// Přidej další předměty podle potřeby
		biology: {
			'unit-1': 'Unit 1: Buňka - struktura, organely, funkce.'
		},
		history: {
			'unit-1': 'Unit 1: Starověké civilizace - Egypt, Mezopotámie, Řecko.'
		}
	};

	// Bezpečné získání obsahu s typovými kontrolami
	let content: string;

	if (mockContent[subject] && unit in mockContent[subject]) {
		content = mockContent[subject][unit];
	} else {
		// Fallback content
		content = `Učivo z předmětu ${subject}, unit ${unit}. Pro podrobný obsah prosím nahrajte materiály.`;

		// Můžeš také přidat logiku pro dynamické načítání podle předmětu
		if (subject === 'english') {
			content = `Unit ${unit} v angličtině obvykle obsahuje slovní zásobu, gramatiku a konverzační fráze.`;
		} else if (subject === 'math') {
			content = `Unit ${unit} v matematice obvykle obsahuje matematické operace, vzorce a příklady.`;
		}
	}

	return json({
		subject,
		unit,
		content,
		timestamp: new Date().toISOString()
	});
};

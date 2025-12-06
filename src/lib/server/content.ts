// src/lib/server/content.ts
import { marked } from 'marked';

const GITHUB_BASE =
	'https://raw.githubusercontent.com/Marat141/2025-Hackaton/Content/content';

export async function fetchMarkdownFromContent(path: string) {
	// path např.: "english/unit-1-notes.md"
	const url = `${GITHUB_BASE}/${path}`;

	const res = await fetch(url);

	if (!res.ok) {
		console.error('Failed to fetch content from GitHub:', res.status, res.statusText);
		throw new Error('CONTENT_NOT_FOUND');
	}

	const markdown = await res.text();
	const html = marked(markdown);

	return { markdown, html };
}

<script lang="ts">
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import Chatbot from "$lib/components/Chatbot.svelte";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	const subjectId = $derived($page.params.subjectId);
	const bookId = $derived($page.params.bookId);
	const unitId = $derived($page.params.unitId);
	
	// Map subject IDs to display names
	const subjectNames: Record<string, string> = {
		'cesky-jazyk': 'Český jazyk',
		'anglicky-jazyk': 'Anglický jazyk',
		'dejepis': 'Dějepis',
		'zemepis': 'Zeměpis',
		'prirodopis': 'Přírodopis'
	};

	// Map book IDs to display names
	const bookNames: Record<string, string> = {
		'book-1': 'Book 1',
		'book-2': 'Book 2'
	};

	// Map unit IDs to display names
	const unitNames: Record<string, string> = {
		'unit-1': 'Unit 1',
		'unit-2': 'Unit 2'
	};

	let pageCount = $state(5); // Default page count
	let pages = $derived(Array.from({ length: pageCount }, (_, i) => i + 1));
	
	// Generated notes state
	let showGeneratedNotes = $state(false);
	let generatedNotesContent = $state('');

	// Callback for when notes are generated in chatbot
	function handleNotesGenerated(content: string) {
		generatedNotesContent = content;
		showGeneratedNotes = true;
	}

	function trackVisit() {
		const today = new Date().toISOString().split('T')[0];
		const visitHistory = JSON.parse(localStorage.getItem('visitHistory') || '[]') as string[];
		
		if (!visitHistory.includes(today)) {
			visitHistory.push(today);
			localStorage.setItem('visitHistory', JSON.stringify(visitHistory));
		}
	}

	onMount(async () => {
		// Track that user opened a unit today
		trackVisit();

		try {
			const response = await fetch('/books/manifest.json');
			const manifest = await response.json();
			if (subjectId && bookId && unitId && manifest[subjectId]?.[bookId]?.[unitId]) {
				pageCount = manifest[subjectId][bookId][unitId].pages;
			}
		} catch (error) {
			console.error('Failed to load manifest:', error);
		}
	});
</script>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<header
			class="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear"
		>
			<div class="flex items-center gap-2 px-4">
				<Sidebar.Trigger class="-ms-1" />
				<Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item class="hidden md:block">
							<Breadcrumb.Link href="/">Home</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator class="hidden md:block" />
						<Breadcrumb.Item>
							<Breadcrumb.Link href="/summary/{subjectId}">{subjectNames[subjectId ?? ''] || subjectId}</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator class="hidden md:block" />
						<Breadcrumb.Item>
							<Breadcrumb.Link href="/summary/{subjectId}/{bookId}">{bookNames[bookId ?? ''] || bookId}</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator class="hidden md:block" />
						<Breadcrumb.Item>
							<Breadcrumb.Page>{unitNames[unitId ?? ''] || unitId}</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
		</header>
		<div class="flex flex-col lg:flex-row flex-1 gap-4 lg:gap-6 p-4 lg:p-6 overflow-hidden">
			<!-- Document viewer -->
			<div class="flex-1 flex justify-center overflow-hidden relative">
				<div class="w-full max-w-[580px] h-[500px] lg:h-[800px] overflow-y-auto overflow-x-hidden border border-gray-200 rounded-lg">
					<div class="space-y-4 p-4">
						<!-- Page images -->
						{#each pages as pageNum}
							<img 
								src="/books/{subjectId}/{bookId}/{unitId}/page-{pageNum}.png" 
								alt="Page {pageNum}"
								class="w-full h-auto lg:h-[760px] object-contain bg-gray-100 rounded-lg shadow-md"
								onerror={(e) => {
									// Fallback to black box if image doesn't exist
									const target = e.currentTarget as HTMLImageElement;
									target.style.display = 'none';
									target.nextElementSibling?.classList.remove('hidden');
								}}
							/>
							<div class="w-full h-[400px] lg:h-[760px] bg-black rounded-lg shadow-md hidden"></div>
						{/each}
					</div>
				</div>
				
				<!-- Generated Notes Overlay -->
				{#if showGeneratedNotes}
					<div class="absolute inset-0 flex items-start justify-center p-4 bg-black bg-opacity-50 z-10">
						<div class="bg-white rounded-lg shadow-2xl w-full max-w-[500px] max-h-[90%] flex flex-col">
							<!-- Header -->
							<div class="flex items-center justify-between p-4 border-b border-gray-200">
								<h3 class="text-lg font-semibold text-gray-900">Generated Notes</h3>
								<button
									onclick={() => showGeneratedNotes = false}
									class="text-gray-400 hover:text-gray-600 transition-colors"
									aria-label="Close"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
							<!-- Content -->
							<div class="flex-1 overflow-y-auto p-6">
								{#if generatedNotesContent}
									<div class="prose prose-sm max-w-none">
										<p class="text-gray-700 whitespace-pre-wrap">{generatedNotesContent}</p>
									</div>
								{:else}
									<p class="text-gray-500 text-center py-8">No notes generated yet.</p>
								{/if}
							</div>
							<!-- Footer Actions -->
							<div class="flex items-center justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
								<button
									onclick={() => showGeneratedNotes = false}
									class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
								>
									Close
								</button>
								<button
									class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
								>
									Save Notes
								</button>
							</div>
						</div>
					</div>
				{/if}
			</div>
			
			<!-- AI Chat - below on mobile, right side on desktop -->
			<div class="w-full lg:w-[563px] h-[500px] lg:h-[800px] flex-shrink-0">
				<Chatbot embedded={true} onNotesGenerated={handleNotesGenerated} />
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>

<style>
	/* Ensure the embedded chatbot fills the container properly */
	:global(.embedded-chatbot) {
		height: 100%;
		width: 100%;
	}
</style>

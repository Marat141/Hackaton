<script lang="ts">
	import AppSidebar from "$lib/components/app-sidebar.svelte";
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
			if (manifest[subjectId]?.[bookId]?.[unitId]) {
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
							<Breadcrumb.Link href="/summary/{subjectId}">{subjectNames[subjectId] || subjectId}</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator class="hidden md:block" />
						<Breadcrumb.Item>
							<Breadcrumb.Link href="/summary/{subjectId}/{bookId}">{bookNames[bookId] || bookId}</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator class="hidden md:block" />
						<Breadcrumb.Item>
							<Breadcrumb.Page>{unitNames[unitId] || unitId}</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
		</header>
		<div class="flex flex-1 gap-6 p-6 overflow-hidden">
			<!-- Center: Document viewer -->
			<div class="flex-1 flex justify-center">
				<div class="w-[580px] h-[800px] overflow-y-auto overflow-x-hidden border border-gray-200 rounded-lg flex-shrink-0">
					<div class="space-y-4 p-4">
						<!-- Page images -->
						{#each pages as pageNum}
							<img 
								src="/books/{subjectId}/{bookId}/{unitId}/page-{pageNum}.png" 
								alt="Page {pageNum}"
								class="w-full h-[760px] object-contain bg-gray-100 rounded-lg shadow-md"
								on:error={(e) => {
									// Fallback to black box if image doesn't exist
									e.currentTarget.style.display = 'none';
									e.currentTarget.nextElementSibling?.classList.remove('hidden');
								}}
							/>
							<div class="w-full h-[760px] bg-black rounded-lg shadow-md hidden"></div>
						{/each}
					</div>
				</div>
			</div>
			
			<!-- Right side: AI Chat placeholder -->
			<div class="w-[563px] h-[800px] bg-black rounded-lg flex-shrink-0"></div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>

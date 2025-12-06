<script lang="ts">
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { page } from '$app/stores';

	let subjectId = $state($page.params.subjectId);
	let bookId = $state($page.params.bookId);

	// Update when route parameters change
	$effect(() => {
		subjectId = $page.params.subjectId;
		bookId = $page.params.bookId;
	});

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

	// Define units for the selected book
	const units = [
		{ id: 'unit-1', name: 'Unit 1' },
		{ id: 'unit-2', name: 'Unit 2' }
	];
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
							<Breadcrumb.Page>{bookNames[bookId] || bookId}</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
		</header>
		<div class="flex flex-1 flex-col gap-4 p-6 items-center justify-center">
			<h1 class="text-3xl font-bold mb-8">Choose a Unit</h1>
			<div class="flex gap-6 flex-wrap justify-center">
				{#key `${subjectId}-${bookId}`}
					{#each units as unit}
						<a 
							href="/summary/{subjectId}/{bookId}/{unit.id}" 
							class="group relative block w-48 h-64 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow border-2 border-gray-200 hover:border-blue-500"
						>
							<img 
								src="/books/{subjectId}/{bookId}/{unit.id}/thumbnail.png" 
								alt="{unit.name} preview"
								class="w-full h-full object-cover"
								on:error={(e) => {
									// Fallback to gray background if image doesn't exist
									e.currentTarget.style.display = 'none';
									e.currentTarget.nextElementSibling?.classList.remove('hidden');
								}}
							/>
							<div class="hidden w-full h-full bg-gray-300 flex items-center justify-center">
								<span class="text-gray-600 text-sm">No preview</span>
							</div>
						</a>
					{/each}
				{/key}
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>

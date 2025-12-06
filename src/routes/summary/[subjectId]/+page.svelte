<script lang="ts">
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { page } from '$app/stores';

	const subjectId = $derived($page.params.subjectId);

	// Map subject IDs to display names
	const subjectNames: Record<string, string> = {
		'cesky-jazyk': 'Český jazyk',
		'anglicky-jazyk': 'Anglický jazyk',
		'dejepis': 'Dějepis',
		'zemepis': 'Zeměpis',
		'prirodopis': 'Přírodopis'
	};

	// Define books for the selected subject
	const books = [
		{ id: 'book-1', name: 'Book 1' },
		{ id: 'book-2', name: 'Book 2' }
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
							<Breadcrumb.Page>{subjectNames[subjectId] || subjectId}</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
		</header>
		<div class="flex flex-1 flex-col gap-4 p-6 items-center justify-center">
			<h1 class="text-3xl font-bold mb-8">Choose a Book</h1>
			<div class="flex gap-6">
				{#each books as book}
					<Button 
						href="/summary/{subjectId}/{book.id}" 
						size="lg"
						class="w-64 h-32 text-xl"
					>
						{book.name}
					</Button>
				{/each}
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>

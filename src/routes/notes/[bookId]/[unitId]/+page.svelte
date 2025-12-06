<script lang="ts">
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { page } from '$app/stores';

	const bookId = $derived($page.params.bookId);
	const unitId = $derived($page.params.unitId);
	
	const bookNames: Record<string, string> = {
		'cesky-jazyk': 'Český jazyk',
		'anglicky-jazyk': 'Anglický jazyk',
		'dejepis': 'Dějepis',
		'zemepis': 'Zeměpis',
		'prirodopis': 'Přírodopis',
	};

	const unitNames: Record<string, string> = {
		'unit-1': 'Unit 1',
		'unit-2': 'Unit 2',
		'unit-3': 'Unit 3'
	};
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
							<Breadcrumb.Link href="/summary/{bookId}">{bookNames[bookId] || bookId}</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator class="hidden md:block" />
						<Breadcrumb.Item>
							<Breadcrumb.Link href="/summary/{bookId}/{unitId}">{unitNames[unitId] || unitId}</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator class="hidden md:block" />
						<Breadcrumb.Item>
							<Breadcrumb.Page>Poznámky</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
		</header>
		<div class="flex flex-1 flex-col items-center justify-center gap-8 p-4 pt-0">
			<h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 text-center">
				Jak se chceš učit?
			</h1>
			<div class="flex flex-col lg:flex-row gap-6 w-full max-w-7xl">
				<a href="/quiz/{bookId}/{unitId}" class="flex items-center gap-4 flex-1 min-h-[100px] px-6 py-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-md transition-all">
					<div class="w-12 h-12 bg-black rounded flex-shrink-0"></div>
					<div class="flex flex-col items-start text-left">
						<h3 class="text-lg font-semibold text-gray-900">Kvíz</h3>
						<p class="text-sm text-gray-600">Vyzkoušej si své znalosti na kvízu o daném předmětu.</p>
					</div>
				</a>
				
				<a href="/flashcards/{bookId}/{unitId}" class="flex items-center gap-4 flex-1 min-h-[100px] px-6 py-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-md transition-all">
					<div class="w-12 h-12 bg-black rounded flex-shrink-0"></div>
					<div class="flex flex-col items-start text-left">
						<h3 class="text-lg font-semibold text-gray-900">Flashcards</h3>
						<p class="text-sm text-gray-600">Procvič si slovní zásobu pomocí kartiček</p>
					</div>
				</a>
				
				<a href="/notes/{bookId}/{unitId}" class="flex items-center gap-4 flex-1 min-h-[100px] px-6 py-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-md transition-all">
					<div class="w-12 h-12 bg-black rounded flex-shrink-0"></div>
					<div class="flex flex-col items-start text-left">
						<h3 class="text-lg font-semibold text-gray-900">Poznámky</h3>
						<p class="text-sm text-gray-600">Přečti si teorii a poznámky, na pomoc máš AI chat.</p>
					</div>
				</a>
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>

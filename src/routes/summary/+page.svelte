<script lang="ts">
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";

	const books = [
		{ id: 'biology', name: 'Biology', description: 'Study of living organisms' },
		{ id: 'chemistry', name: 'Chemistry', description: 'Study of matter and reactions' },
		{ id: 'physics', name: 'Physics', description: 'Study of matter and energy' }
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
							<Breadcrumb.Page>Shrnutí Textu</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
		</header>
		<div class="flex flex-1 flex-col items-center justify-center gap-8 p-4 pt-0">
			<h1 class="text-3xl md:text-4xl font-bold text-gray-900 text-center">
				Vyber si předmět
			</h1>
			<div class="flex flex-col gap-4 w-full max-w-2xl">
				{#each books as book}
					<a
						href="/summary/{book.id}"
						class="flex items-center gap-4 p-6 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-md transition-all"
					>
						<div class="w-12 h-12 bg-black rounded flex-shrink-0"></div>
						<div class="flex flex-col items-start text-left">
							<h3 class="text-xl font-semibold text-gray-900">{book.name}</h3>
							<p class="text-sm text-gray-600">{book.description}</p>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>

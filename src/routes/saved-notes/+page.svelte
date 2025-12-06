<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import { Skeleton } from "$lib/components/ui/skeleton";
</script>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<header
			class="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear"
		>
			<div class="flex items-center gap-2 px-4">
				<Sidebar.Trigger class="-ms-1" />
				<h1 class="text-xl font-semibold">Uložené poznámky</h1>
			</div>
		</header>
		<div class="flex flex-1 flex-col gap-6 p-6">
			<!-- Row 1: 5 blocks -->
			<div class="flex flex-wrap gap-6 justify-center">
				{#each Array(5) as _, i}
					<div class="w-[280px] h-[280px] bg-black rounded-lg"></div>
				{/each}
			</div>
			
			<!-- Row 2: 5 blocks -->
			<div class="flex flex-wrap gap-6 justify-center">
				{#each Array(5) as _, i}
					<div class="w-[280px] h-[280px] bg-black rounded-lg"></div>
				{/each}
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>

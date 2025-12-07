<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import starIcon from "$lib/assets/star-icon.svg";
	import bookIcon from "$lib/assets/book-icon.svg";
	import { onMount } from "svelte";

	let streak = $state(0);

	function calculateStreak(): number {
		const visitHistory = JSON.parse(localStorage.getItem('visitHistory') || '[]') as string[];
		if (visitHistory.length === 0) return 0;

		// Sort dates in descending order
		const sortedDates = visitHistory.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
		
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		let streakCount = 0;
		let currentDate = new Date(today);

		for (let i = 0; i < sortedDates.length; i++) {
			const visitDate = new Date(sortedDates[i]);
			visitDate.setHours(0, 0, 0, 0);
			
			if (visitDate.getTime() === currentDate.getTime()) {
				streakCount++;
				currentDate.setDate(currentDate.getDate() - 1);
			} else if (visitDate.getTime() < currentDate.getTime()) {
				// Gap in streak
				break;
			}
		}
		
		return streakCount;
	}

	onMount(() => {
		streak = calculateStreak();
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
				<h1 class="text-xl font-semibold">Progress učení</h1>
			</div>
		</header>
		<div class="flex flex-1 flex-col gap-6 p-6 items-center justify-center">
			<h1 class="text-4xl font-bold mb-8">Tvůj progress učení</h1>
			<div class="flex flex-wrap gap-6 justify-center">
				<!-- Card 1: Days streak -->
				<div class="w-[290px] h-[350px] bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col items-center justify-center">
					<h2 class="text-2xl font-semibold mb-1">{streak} {streak === 1 ? 'den' : streak < 5 ? 'dny' : 'dní'} v řadě</h2>
					<p class="text-sm text-gray-500">-jen tak dál!!</p>
				</div>
				
				<!-- Card 2: Level -->
				<div class="w-[290px] h-[350px] bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col items-center justify-center">
					<img src={starIcon} alt="Star" class="w-32 h-32 mb-4" />
					<h2 class="text-2xl font-semibold mb-2">Lvl 120</h2>
					<div class="w-full bg-gray-200 rounded-full h-2 mb-1">
						<div class="bg-blue-500 h-2 rounded-full" style="width: 70%"></div>
					</div>
					<p class="text-xs text-gray-600">1420/2000xp</p>
				</div>
				
				<!-- Card 3: Books completed -->
				<div class="w-[290px] h-[350px] bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col items-center justify-center">
					<img src={bookIcon} alt="Book" class="w-32 h-32 mb-4" />
					<h2 class="text-4xl font-bold mb-1">24</h2>
					<p class="text-sm text-gray-500">Hotových lekcí</p>
				</div>
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>

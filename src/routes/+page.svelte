<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { BarChart } from 'layerchart';
	import { scaleBand } from 'd3-scale';

	type Task = {
		id: number;
		text: string;
		dueDate: string;
		completed: boolean;
		color: string;
	};

	let tasks = $state<Task[]>([
		{ id: 1, text: 'Sample task 1', dueDate: 'Dec 10', completed: false, color: '#3b82f6' },
		{ id: 2, text: 'Sample task 2', dueDate: 'Dec 15', completed: false, color: '#ef4444' }
	]);

	let newTaskText = $state('');
	let newTaskDate = $state('');
	let newTaskColor = $state('#3b82f6');
	let nextId = $state(3);

	// Calendar state
	let currentMonth = $state(11); // December (0-indexed)
	let currentYear = $state(2025);
	let selectedDay = $state(6);

	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	function getDaysInMonth(month: number, year: number) {
		return new Date(year, month + 1, 0).getDate();
	}

	function getFirstDayOfMonth(month: number, year: number) {
		const day = new Date(year, month, 1).getDay();
		return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Monday=0
	}

	let calendarDays = $derived(() => {
		const daysInMonth = getDaysInMonth(currentMonth, currentYear);
		const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
		const days = [];

		// Empty cells before first day
		for (let i = 0; i < firstDay; i++) {
			days.push(null);
		}

		// Days of month
		for (let i = 1; i <= daysInMonth; i++) {
			days.push(i);
		}

		return days;
	});

	function previousMonth() {
		if (currentMonth === 0) {
			currentMonth = 11;
			currentYear--;
		} else {
			currentMonth--;
		}
	}

	function nextMonth() {
		if (currentMonth === 11) {
			currentMonth = 0;
			currentYear++;
		} else {
			currentMonth++;
		}
	}

	function selectDay(day: number | null) {
		if (day) selectedDay = day;
	}

	let selectedDateStr = $derived(`${monthNames[currentMonth].slice(0, 3)} ${selectedDay}`);

	let tasksForSelectedDay = $derived(tasks.filter((task) => task.dueDate === selectedDateStr));

	function getTasksForDate(day: number): Task[] {
		const dateStr = `${monthNames[currentMonth].slice(0, 3)} ${day}`;
		return tasks.filter((task) => task.dueDate === dateStr && !task.completed);
	}

	function addTask() {
		if (newTaskText.trim()) {
			let dueDate = selectedDateStr;

			// If custom date is provided, convert it to "Dec 6" format
			if (newTaskDate) {
				const date = new Date(newTaskDate);
				const month = monthNames[date.getMonth()].slice(0, 3);
				const day = date.getDate();
				dueDate = `${month} ${day}`;
			}

			tasks.push({
				id: nextId++,
				text: newTaskText.trim(),
				dueDate: dueDate,
				completed: false,
				color: newTaskColor
			});
			newTaskText = '';
			newTaskDate = '';
		}
	}

	function toggleTask(id: number) {
		const task = tasks.find((t) => t.id === id);
		if (task) {
			task.completed = !task.completed;
		}
	}

	// Chart data
	const chartData = [
		{ subject: 'Český jazyk', completed: 15, total: 25 },
		{ subject: 'Anglický jazyk', completed: 20, total: 30 },
		{ subject: 'Dějepis', completed: 10, total: 20 },
		{ subject: 'Zeměpis', completed: 12, total: 18 },
		{ subject: 'Přírodopis', completed: 8, total: 15 }
	];

	const chartConfig = {
		completed: {
			label: 'Dokončené lekce',
			color: 'hsl(var(--chart-1))'
		},
		total: {
			label: 'Celkový počet lekcí',
			color: 'hsl(var(--chart-2))'
		}
	} satisfies Chart.ChartConfig;
</script>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<header
			class="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear"
		>
			<div class="flex items-center gap-2 px-4">
				<Sidebar.Trigger class="-ms-1" />
			</div>
		</header>
		<div class="flex flex-1 flex-col gap-6 p-6 overflow-hidden max-h-full">
			<!-- Row with To-Do, Calendar, and Chart (1/3 width each) -->
			<div class="flex flex-wrap gap-6 flex-shrink-0">
				<!-- To-Do Block (1/3 width) -->
				<div
					class="flex-1 min-w-[300px] bg-white border border-gray-200 rounded-lg p-4 shadow-sm h-80 overflow-y-auto"
				>
					<h2 class="text-xl font-semibold mb-4">To-Do</h2>
					<div class="space-y-3">
						<!-- To-Do Items -->
						{#each tasks as task (task.id)}
							<div class="flex items-start gap-2">
								<div
									class="w-1 h-10 rounded-full mt-1"
									style="background-color: {task.color}"
								></div>
								<input
									type="checkbox"
									checked={task.completed}
									onchange={() => toggleTask(task.id)}
									class="mt-1 w-4 h-4 rounded border-gray-300"
								/>
								<div class="flex-1">
									<p
										class="text-sm text-gray-800 {task.completed
											? 'line-through text-gray-400'
											: ''}"
									>
										{task.text}
									</p>
									<p class="text-xs text-gray-500">Due: {task.dueDate}</p>
								</div>
							</div>
						{/each}
					</div>
					<div class="mt-4 space-y-2">
						<input
							type="text"
							bind:value={newTaskText}
							placeholder="New task..."
							class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
							onkeydown={(e) => e.key === 'Enter' && addTask()}
						/>
						<div class="flex gap-2">
							<input
								type="date"
								bind:value={newTaskDate}
								class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
							/>
							<input
								type="color"
								bind:value={newTaskColor}
								class="w-12 h-10 border border-gray-300 rounded cursor-pointer"
								title="Task color"
							/>
							<button
								onclick={addTask}
								class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
							>
								Add
							</button>
						</div>
					</div>
				</div>

				<!-- Calendar Block (1/3 width) -->
				<div
					class="flex-1 min-w-[300px] bg-white border border-gray-200 rounded-lg p-4 shadow-sm h-80 overflow-hidden flex flex-col"
				>
					<h2 class="text-lg font-semibold mb-2">Calendar</h2>
					<div class="flex-1 flex flex-col overflow-hidden">
						<!-- Calendar Header -->
						<div class="flex items-center justify-between mb-2">
							<button onclick={previousMonth} class="p-1 hover:bg-gray-100 rounded text-sm"
								>&lt;</button
							>
							<span class="text-sm font-medium">{monthNames[currentMonth]} {currentYear}</span>
							<button onclick={nextMonth} class="p-1 hover:bg-gray-100 rounded text-sm">&gt;</button
							>
						</div>
						<!-- Calendar Grid -->
						<div class="grid grid-cols-7 gap-0.5 text-center text-[10px] mb-2">
							<div class="font-semibold text-gray-600">Mo</div>
							<div class="font-semibold text-gray-600">Tu</div>
							<div class="font-semibold text-gray-600">We</div>
							<div class="font-semibold text-gray-600">Th</div>
							<div class="font-semibold text-gray-600">Fr</div>
							<div class="font-semibold text-gray-600">Sa</div>
							<div class="font-semibold text-gray-600">Su</div>
							{#each calendarDays() as day}
								{#if day}
									<button
										onclick={() => selectDay(day)}
										class="relative p-1 hover:bg-blue-50 rounded cursor-pointer transition-colors text-[10px] {day ===
										selectedDay
											? 'bg-gray-300 hover:bg-gray-400'
											: 'text-gray-700'}"
									>
										{day}
										{#if getTasksForDate(day).length > 0}
											<div class="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-0.5">
												{#each getTasksForDate(day).slice(0, 3) as task}
													<div
														class="w-0.5 h-0.5 rounded-full"
														style="background-color: {task.color}"
													></div>
												{/each}
											</div>
										{/if}
									</button>
								{:else}
									<div class="p-1"></div>
								{/if}
							{/each}
						</div>
						<!-- Tasks for selected day -->
						<div class="flex-1 pt-2 border-t border-gray-200 overflow-y-auto">
							<p class="text-[10px] font-semibold text-gray-600 mb-1">
								Tasks for {selectedDateStr}:
							</p>
							<div class="space-y-0.5">
								{#each tasksForSelectedDay as task (task.id)}
									<div class="flex items-center gap-1">
										<div
											class="w-0.5 h-2 rounded-full flex-shrink-0"
											style="background-color: {task.color}"
										></div>
										<p
											class="text-[10px] text-gray-700 truncate {task.completed
												? 'line-through text-gray-400'
												: ''}"
										>
											{task.text}
										</p>
									</div>
								{:else}
									<p class="text-[10px] text-gray-400 italic">No tasks</p>
								{/each}
							</div>
						</div>
					</div>
				</div>

				<!-- Chart Block (1/3 width) -->
				<div
					class="flex-1 min-w-[300px] bg-white border border-gray-200 rounded-lg p-4 shadow-sm h-80 overflow-y-auto"
				>
					<h2 class="text-xl font-semibold mb-4">Progress učení</h2>
					<Chart.Container config={chartConfig} class="h-[calc(100%-3rem)]">
						<BarChart
							data={chartData}
							xScale={scaleBand().padding(0.25)}
							x="subject"
							axis="x"
							seriesLayout="group"
							legend
							series={[
								{
									key: 'completed',
									label: chartConfig.completed.label,
									color: chartConfig.completed.color
								},
								{
									key: 'total',
									label: chartConfig.total.label,
									color: chartConfig.total.color
								}
							]}
							props={{
								xAxis: {
									format: (d) => d.slice(0, 10)
								}
							}}
						>
							<!-- Remove `mode` and `findTooltipData`, only include valid props -->
							<Chart.Tooltip hideLabel={false} label="Custom Tooltip" />
						</BarChart>
					</Chart.Container>
				</div>
			</div>
		</div></Sidebar.Inset
	>
</Sidebar.Provider>

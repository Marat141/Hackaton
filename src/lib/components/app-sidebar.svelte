<script lang="ts" module>
	import AudioWaveformIcon from "@lucide/svelte/icons/audio-waveform";
	import BookOpenIcon from "@lucide/svelte/icons/book-open";
	import BotIcon from "@lucide/svelte/icons/bot";
	import ChartPieIcon from "@lucide/svelte/icons/chart-pie";
	import CommandIcon from "@lucide/svelte/icons/command";
	import FrameIcon from "@lucide/svelte/icons/frame";
	import GalleryVerticalEndIcon from "@lucide/svelte/icons/gallery-vertical-end";
	import MapIcon from "@lucide/svelte/icons/map";
	import Settings2Icon from "@lucide/svelte/icons/settings-2";
	import SquareTerminalIcon from "@lucide/svelte/icons/square-terminal";
	import BookIcon from "@lucide/svelte/icons/book";
	import HomeIcon from "@lucide/svelte/icons/home";

	// This is sample data.
	const data = {
		user: {
			name: "Nikita",
			email: "mail@example.com",
			avatar: "/avatars/shadcn.jpg",
		},
		teams: [
			{
				name: "SOUEPL",
				logo: GalleryVerticalEndIcon,
				plan: "College",
			},
		],
		navMain: [
			{
				title: "Hlavní stránka",
				url: "/",
				icon: HomeIcon,
				isActive: true,
			},
		],
		projects: [
			{
				name: "Uložené poznámky",
				url: "/saved-notes",
				icon: FrameIcon,
			},
			{
				name: "Historie kvizů",
				url: "#",
				icon: ChartPieIcon,
			},
			{
				name: "Progress učení",
				url: "/progress",
				icon: MapIcon,
			},
		],
		books: [
			{
				name: "Český jazyk",
				url: "#",
				icon: BookIcon,
				items: [
					{
						title: "Book 1",
						url: "/summary/cesky-jazyk/book-1",
					},
					{
						title: "Book 2",
						url: "/summary/cesky-jazyk/book-2",
					},
				],
			},
			{
				name: "Anglický jazyk",
				url: "#",
				icon: BookIcon,
				items: [
					{
						title: "Book 1",
						url: "/summary/anglicky-jazyk/book-1",
					},
					{
						title: "Book 2",
						url: "/summary/anglicky-jazyk/book-2",
					},
				],
			},
			{
				name: "Dějepis",
				url: "#",
				icon: BookIcon,
				items: [
					{
						title: "Book 1",
						url: "/summary/dejepis/book-1",
					},
					{
						title: "Book 2",
						url: "/summary/dejepis/book-2",
					},
				],
			},
			{
				name: "Zeměpis",
				url: "#",
				icon: BookIcon,
				items: [
					{
						title: "Book 1",
						url: "/summary/zemepis/book-1",
					},
					{
						title: "Book 2",
						url: "/summary/zemepis/book-2",
					},
				],
			},
			{
				name: "Přírodopis",
				url: "#",
				icon: BookIcon,
				items: [
					{
						title: "Book 1",
						url: "/summary/prirodopis/book-1",
					},
					{
						title: "Book 2",
						url: "/summary/prirodopis/book-2",
					},
				],
			},
		],
	};
</script>

<script lang="ts">
	import NavMain from "./nav-main.svelte";
	import NavProjects from "./nav-projects.svelte";
	import NavBooks from "./nav-books.svelte";
	import NavUser from "./nav-user.svelte";
	import TeamSwitcher from "./team-switcher.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		collapsible = "icon",
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root {collapsible} {...restProps}>
	<Sidebar.Header>
		<TeamSwitcher teams={data.teams} />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data.navMain} />
		<NavBooks books={data.books} />
		<NavProjects projects={data.projects} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser user={data.user} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>

<script lang="ts">
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";

	let {
		books,
	}: {
		books: {
			name: string;
			url: string;
			// This should be `Component` after @lucide/svelte updates types
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			icon: any;
			items?: {
				title: string;
				url: string;
			}[];
		}[];
	} = $props();
</script>

<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
	<Sidebar.GroupLabel>Knihovna</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each books as book (book.name)}
			<Collapsible.Root class="group/collapsible">
				{#snippet child({ props }: any)}
					<Sidebar.MenuItem {...props}>
						<Collapsible.Trigger>
							{#snippet child({ props }: any)}
								<Sidebar.MenuButton {...props} tooltipContent={book.name}>
									{#if book.icon}
										<book.icon />
									{/if}
									<span>{book.name}</span>
									<ChevronRightIcon
										class="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
									/>
								</Sidebar.MenuButton>
							{/snippet}
						</Collapsible.Trigger>
						<Collapsible.Content>
							<Sidebar.MenuSub>
								{#each book.items ?? [] as subItem (subItem.title)}
									<Sidebar.MenuSubItem>
										<Sidebar.MenuSubButton>
											{#snippet child({ props })}
												<a href={subItem.url} {...props}>
													<span>{subItem.title}</span>
												</a>
											{/snippet}
										</Sidebar.MenuSubButton>
									</Sidebar.MenuSubItem>
								{/each}
							</Sidebar.MenuSub>
						</Collapsible.Content>
					</Sidebar.MenuItem>
				{/snippet}
			</Collapsible.Root>
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>

<!-- src/routes/english/unit/[unit]/+page.svelte -->
<script lang="ts">
	const props = $props<{
		data: {
			unit: string;
			markdown: string;
			html: string;
		};
	}>();

	const { data } = props;
</script>

<section class="unit-notes">
	<header class="unit-header">
		<h1>Unit {data.unit} – Notes</h1>
		<p class="unit-subtitle">
			Shrnuté zápisky z učebnice – slovní zásoba, gramatika a užitečné fráze.
		</p>
	</header>

	<article class="unit-content" data-unit={data.unit}>
		{@html data.html}
	</article>
</section>

<style>
	.unit-notes {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem 1.25rem 4rem;
	}

	.unit-header h1 {
		font-size: 2rem;
		margin-bottom: 0.25rem;
	}

	.unit-subtitle {
		color: #666;
		margin-bottom: 1.5rem;
	}

	.unit-content :global(h1) {
		font-size: 1.8rem;
		margin: 1.5rem 0 0.75rem;
	}

	.unit-content :global(h2) {
		font-size: 1.4rem;
		margin: 1.25rem 0 0.5rem;
	}

	.unit-content :global(h3) {
		font-size: 1.2rem;
		margin: 1rem 0 0.5rem;
	}

	.unit-content :global(p) {
		line-height: 1.6;
		margin-bottom: 0.75rem;
	}

	.unit-content :global(ul) {
		margin: 0.5rem 0 1rem 1.5rem;
	}

	.unit-content :global(li) {
		margin-bottom: 0.25rem;
	}
</style>

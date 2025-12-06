<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Chatbot from '$lib/components/Chatbot.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<Chatbot />
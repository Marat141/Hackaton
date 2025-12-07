<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Chatbot from '$lib/components/Chatbot.svelte';
	import { page } from '$app/stores';

	let { children } = $props();
	
	// Check if we're on the book page where chatbot is embedded
	const isBookPage = $derived($page.url.pathname.includes('/summary/') && 
		$page.url.pathname.split('/').length >= 5);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if children}
	{@render children()}
{/if}

<!-- Only show floating chatbot if not on book page -->
{#if !isBookPage}
	<Chatbot />
{/if}

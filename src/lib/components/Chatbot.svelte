<script lang="ts">
//src\lib\components\Chatbot.svelte

import { page } from '$app/stores';

	// Props for embedding mode
	let { 
		embedded = false,
		onNotesGenerated
	}: { 
		embedded?: boolean;
		onNotesGenerated?: (content: string) => void;
	} = $props();

	// Active tool state
	type ToolType = 'chatbot' | 'vypisky' | 'kviz' | 'karty';
	let activeTool = $state<ToolType>('chatbot');

	// Separate messages for each tool
	let toolMessages = $state<Record<ToolType, { role: string; content: string }[]>>({
		chatbot: [],
		vypisky: [],
		kviz: [],
		karty: []
	});

	// Reactive messages based on active tool
	let messages = $derived(toolMessages[activeTool]);

	// Reaktivní stavy
	let isOpen = $state(false);
	let inputMessage = $state('');
	let isLoading = $state(false);
	let chatContainer = $state<HTMLDivElement | null>(null);
	let generatingPrompt = $state<string | null>(null);
	let showQuickActions = $state(true); // Nový stav pro zobrazení/skrytí rychlých akcí

	// Aktuální unit a subject - nyní budou reaktivně získány z URL
	let currentUnit = $state('unit-1');
	let currentSubject = $state('english');

	// Dynamické načítání hodnot z URL
	$effect(() => {
		const params = $page.params;
		
		// Získání předmětu z URL - podporuje více URL struktur
		// 1. /summary/{subjectId}/{bookId}/{unitId} → params.subjectId
		// 2. /{subject}/unit/{unit} → params.subject
		const subjectParam = (params.subjectId || params.subject || '');
		
		if (subjectParam) {
			// Keep the original subject name as it appears in the URL
			// (dejepis, cesky-jazyk, anglicky-jazyk, zemepis, prirodopis)
			currentSubject = subjectParam;
		}
		
		// Získání unit z URL - podporuje více URL struktur
		// 1. /summary/{subjectId}/{bookId}/{unitId} → params.unitId
		// 2. /{subject}/unit/{unit} → params.unit
		const unitParam = (params.unitId || params.unit || '').toLowerCase();
		
		if (unitParam) {
			// Normalizace - zajistíme formát "unit-X"
			if (unitParam.startsWith('unit-')) {
				currentUnit = unitParam;
			} else if (/^\d+$/.test(unitParam)) {
				currentUnit = `unit-${unitParam}`;
			} else {
				currentUnit = unitParam;
			}
		}
		
		// Pro ladění - zobrazit aktuální hodnoty v konzoli
		console.log('URL params:', params);
		console.log('Current subject:', currentSubject);
		console.log('Current unit:', currentUnit);
	});

	// Dostupné předměty a unity
	const availableSubjects = [
		{ value: 'english', label: 'Angličtina' },
		{ value: 'math', label: 'Matematika' },
		{ value: 'history', label: 'Dějepis' },
	];

	const availableUnits = Array.from({ length: 12 }, (_, i) => `unit-${i + 1}`);

	// Tlačítka pro generování promptů - AKTUALIZOVÁNO
	const aiButtons = [
		{ label: 'Udělej mi kvíz z aktuálních zápisků', action: 'quiz', shortcut: 'Ctrl+1' },
		{ label: 'Udělej mi shrnutí tohoto Unit', action: 'summary', shortcut: 'Ctrl+2' },
		{ label: 'Vysvětli to jako učitel', action: 'explain', shortcut: 'Ctrl+3' },
		{ label: 'Dej mi příklady k procvičení', action: 'practice', shortcut: 'Ctrl+4' }
	];

	// Initialize welcome messages for each tool
	$effect(() => {
		const welcomeMessages: Record<ToolType, string> = {
			chatbot: 'Ahoj! Jsem AI asistent a pomůžu ti s učením. Můžeš mi napsat jakoukoliv otázku!',
			vypisky: 'Vítej v sekci Výpisků! Zde ti pomohu s tvými poznámkami a výpisky z jednotlivých lekcí.',
			kviz: 'Vítej v sekci Kvízů! Pomohu ti vytvořit a procvičit kvízy k aktuálnímu učivu.',
			karty: 'Vítej v sekci Karet! Zde si můžeš vytvořit flashcards pro efektivní učení.'
		};

		// Initialize messages for tools that don't have any
		Object.keys(welcomeMessages).forEach((tool) => {
			const toolKey = tool as ToolType;
			if (toolMessages[toolKey].length === 0) {
				toolMessages[toolKey] = [
					{
						role: 'assistant',
						content: welcomeMessages[toolKey]
					}
				];
			}
		});
	});

	// Klávesové zkratky
	$effect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			if (!isOpen) return;

			// Ctrl+1 pro kvíz
			if (e.ctrlKey && e.key === '1') {
				e.preventDefault();
				generatePrompt('quiz');
			}
			// Ctrl+2 pro shrnutí
			if (e.ctrlKey && e.key === '2') {
				e.preventDefault();
				generatePrompt('summary');
			}
			// Ctrl+3 pro vysvětlení
			if (e.ctrlKey && e.key === '3') {
				e.preventDefault();
				generatePrompt('explain');
			}
			// Ctrl+4 pro příklady
			if (e.ctrlKey && e.key === '4') {
				e.preventDefault();
				generatePrompt('practice');
			}
			// Esc pro zavření chatu
			if (e.key === 'Escape' && isOpen) {
				e.preventDefault();
				isOpen = false;
			}
		};

		window.addEventListener('keydown', handleKeyPress);

		return () => {
			window.removeEventListener('keydown', handleKeyPress);
		};
	});

	// Funkce pro odeslání zprávy
	async function sendMessage() {
		if (!inputMessage.trim() || isLoading) return;

		const userMessage = inputMessage.trim();
		inputMessage = '';

		// Přidej uživatelskou zprávu do aktuálního nástroje
		toolMessages[activeTool] = [...toolMessages[activeTool], { role: 'user', content: userMessage }];
		isLoading = true;

		// Scroll na konec
		scrollToBottom();

		try {
			// Fetch markdown content if we're in certain tools that need it
			let contextContent = '';
			if (activeTool === 'vypisky' || activeTool === 'kviz' || activeTool === 'karty') {
				try {
					const apiUrl = `/api/get-unit-content?subject=${currentSubject}&unit=${currentUnit}`;
					console.log('Fetching content for context:', apiUrl);
					
					const contentResponse = await fetch(apiUrl);
					if (contentResponse.ok) {
						const contentData = await contentResponse.json();
						contextContent = contentData.content || '';
						console.log('Loaded content:', contextContent.substring(0, 200) + '...');
					}
				} catch (error) {
					console.warn('Could not load content for context:', error);
				}
			}

			const messagesToSend = toolMessages[activeTool]
				.filter((msg) => msg.role !== 'system')
				.map((msg) => ({
					role: msg.role,
					content: msg.content
				}));

			// If we have context content, prepend it as a system message
			if (contextContent) {
				messagesToSend.unshift({
					role: 'system',
					content: `You are working with the following course material:\n\nSubject: ${currentSubject}\nUnit: ${currentUnit}\n\nContent:\n${contextContent}\n\nUse this content to answer the user's questions accurately.`
				});
			}

			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ messages: messagesToSend })
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: 'Neznámá chyba' }));
				const errorMessage = errorData.error || `Chyba ${response.status}: ${response.statusText}`;
				console.error('API Error:', errorMessage);
				throw new Error(errorMessage);
			}

			const data = await response.json();
			toolMessages[activeTool] = [...toolMessages[activeTool], { role: 'assistant', content: data.message }];

			// If we're in Výpisky mode and callback exists, trigger the notes modal
			if (activeTool === 'vypisky' && onNotesGenerated) {
				onNotesGenerated(data.message);
			}

			// Přidej tip pro další použití
			showTip();
		} catch (error: unknown) {
			console.error('Error sending message:', error);

			let errorMessage = 'Omlouvám se, došlo k chybě. Zkuste to prosím znovu.';

			if (error instanceof Error) {
				if (error.message.includes('API key') || error.message.includes('Neplatný API klíč')) {
					errorMessage =
						'⚠️ API klíč není nastavený nebo je neplatný. Zkontrolujte prosím konfiguraci v .env souboru.';
				} else if (error.message.includes('quota') || error.message.includes('limit')) {
					errorMessage = '⚠️ Překročen limit API. Zkontrolujte prosím svůj billing a quota.';
				} else if (error.message.includes('fetch')) {
					errorMessage = '⚠️ Nelze se připojit k serveru. Zkontrolujte, zda server běží.';
				} else {
					errorMessage = `⚠️ ${error.message}`;
				}
			}

			toolMessages[activeTool] = [
				...toolMessages[activeTool],
				{
					role: 'assistant',
					content: errorMessage
				}
			];
		} finally {
			isLoading = false;
			scrollToBottom();
		}
	}

	// Pomocná funkce pro scroll
	function scrollToBottom() {
		setTimeout(() => {
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		}, 100);
	}

	// Funkce pro zobrazení tipu
	function showTip() {
		const tips = [
			'💡 Tip: Můžeš použít klávesové zkratky Ctrl+1 pro kvíz a Ctrl+2 pro shrnutí!',
			'💡 Tip: Zkus mi zadat konkrétní otázku k učivu, které nerozumíš.',
			'💡 Tip: Můžeš požádat o vysvětlení jako pro začátečníka nebo pokročilého.',
			"💡 Tip: Klikni na 'Vysvětli to jako učitel' pro podrobné vysvětlení!"
		];

		// Přidej tip náhodně (25% šance)
		if (Math.random() < 0.25 && toolMessages[activeTool].length > 4) {
			const randomTip = tips[Math.floor(Math.random() * tips.length)];
			setTimeout(() => {
				toolMessages[activeTool] = [
					...toolMessages[activeTool],
					{
						role: 'assistant',
						content: randomTip
					}
				];
				scrollToBottom();
			}, 1000);
		}
	}

	// Function to switch between tools
	function switchTool(tool: ToolType) {
		activeTool = tool;
		scrollToBottom();
	}

	function handleKeyPress(event: KeyboardEvent): void {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function toggleChat(): void {
		isOpen = !isOpen;
		if (isOpen) {
			// Focus na textarea při otevření
			setTimeout(() => {
				const textarea = document.querySelector('textarea');
				if (textarea) {
					textarea.focus();
				}
			}, 100);
		}
	}

	// Funkce pro přepínání zobrazení rychlých akcí
	function toggleQuickActions() {
		showQuickActions = !showQuickActions;
	}

	// Funkce pro generování promptů - AKTUALIZOVÁNO
	async function generatePrompt(action: string) {
		generatingPrompt = action;

		try {
			let content = '';

			// Nejprve zkusíme získat obsah z API
			try {
				const apiUrl = `/api/get-unit-content?subject=${currentSubject}&unit=${currentUnit}`;
				console.log('Fetching content from:', apiUrl);
				
				const response = await fetch(apiUrl);

				if (response.ok) {
					const data = await response.json();
					console.log('API response:', data);
					content = data.content?.slice(0, 500) || '';
				} else {
					console.warn('API returned error:', response.status);
				}
			} catch (error) {
				console.warn('API endpoint error:', error);
			}

			// Vytvoř kontext se specifickým předmětem a jednotkou
			const contextInfo = `Předmět: ${currentSubject}, Unit: ${currentUnit}`;
			const contentPrefix = content ? `\n\nObsah zápisků:\n${content}\n\n` : '\n\n';

			let prompt = '';

			if (action === 'quiz') {
				prompt = `Vytvoř interaktivní kvíz pro ${contextInfo}.${contentPrefix}Kvíz by měl mít 5-10 otázek různých typů (multiple choice, true/false, doplňování, párování). Ke každé otázce přidej správnou odpověď a vysvětlení. Formátuj jako: 1. Otázka... A) Možnost A B) Možnost B C) Možnost D Správně: B - Vysvětlení...`;
			} else if (action === 'summary') {
				prompt = `Vytvoř stručné a přehledné shrnutí pro ${contextInfo}.${contentPrefix}Shrň hlavní téma, klíčová slovíčka/pojmy, důležité vzorce/pravidla, praktické příklady a tipy na zapamatování. Formátuj pomocí nadpisů a odrážek pro lepší čitelnost.`;
			} else if (action === 'explain') {
				prompt = `Vysvětli učivo z ${contextInfo} jako zkušený učitel.${contentPrefix}Vysvětli postupně, jednoduše, s analogiemi a příklady z reálného života. Začni základními pojmy a postupně přejdi ke složitějším. Používej přátelský a povzbuzující tón.`;
			} else if (action === 'practice') {
				prompt = `Vytvoř sadu příkladů k procvičení pro ${contextInfo}.${contentPrefix}Vytvoř 5-8 příkladů s postupným řešením od jednoduchých ke složitým. U každého příkladu uveď: 1) Zadání 2) Krok za krokem řešení 3) Tipy a triky 4) Odpověď.`;
			}

			// Nastavit prompt do vstupního pole
			inputMessage = prompt;

			// Scroll na vstupní pole
			setTimeout(() => {
				const textarea = document.querySelector('textarea');
				if (textarea) {
					textarea.focus();
					textarea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
				}
			}, 50);
		} catch (error) {
			console.error('Error generating prompt:', error);
			inputMessage = `Vytvoř ${action === 'quiz' ? 'kvíz' : action === 'summary' ? 'shrnutí' : action === 'explain' ? 'vysvětlení' : 'příklady'} pro aktuální zápisky.`;
		} finally {
			setTimeout(() => {
				generatingPrompt = null;
			}, 500);
		}
	}
</script>

<div class="{embedded ? 'w-full h-full' : 'fixed bottom-4 right-4 z-50'}">
	{#if isOpen || embedded}
		<!-- Chat Window -->
		<div class="bg-white rounded-lg shadow-2xl {embedded ? 'w-full h-full' : 'w-96 h-[600px]'} flex flex-col border border-gray-200">
			<!-- Header s tlačítkem pro skrytí rychlých akcí -->
			<div
				class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex justify-between items-center"
			>
				<div>
					<h3 class="font-semibold text-lg">AI Asistent</h3>
					<p class="text-xs text-blue-100">Pomoc s aktuálními zápisky</p>
				</div>
				<div class="flex space-x-1">
					<!-- Tlačítko pro skrytí/zobrazení rychlých akcí -->
					<button
						onclick={toggleQuickActions}
						class="text-white hover:text-gray-200 transition-colors p-1 cursor-pointer rounded-full hover:bg-blue-800"
						aria-label={showQuickActions ? 'Skrýt rychlé akce' : 'Zobrazit rychlé akce'}
						title={showQuickActions ? 'Skrýt rychlé akce' : 'Zobrazit rychlé akce'}
					>
						{#if showQuickActions}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 15l7-7 7 7"
								/>
							</svg>
						{:else}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						{/if}
					</button>
					<!-- Tlačítko pro zavření chatu (hide if embedded) -->
					{#if !embedded}
						<button
							onclick={toggleChat}
							class="text-white hover:text-gray-200 transition-colors p-1 cursor-pointer rounded-full hover:bg-blue-800"
							aria-label="Zavřít chat"
							title="Zavřít (Esc)"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					{/if}
				</div>
			</div>

			<!-- Navigation Buttons -->
			<div class="p-2 border-b border-gray-200 bg-gray-50">
				<div class="grid grid-cols-4 gap-1.5">
					<button
						onclick={() => switchTool('chatbot')}
						class="flex flex-row items-center justify-center gap-1.5 py-2 px-2 {activeTool === 'chatbot' ? 'bg-blue-100 border-blue-500' : 'bg-white hover:bg-blue-50'} border border-gray-200 rounded-lg transition-colors cursor-pointer"
						title="Chat Bot"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 {activeTool === 'chatbot' ? 'text-blue-700' : 'text-blue-600'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
						</svg>
						<span class="text-xs font-medium {activeTool === 'chatbot' ? 'text-blue-700' : 'text-gray-700'}">Chat Bot</span>
					</button>
					<button
						onclick={() => switchTool('vypisky')}
						class="flex flex-row items-center justify-center gap-1.5 py-2 px-2 {activeTool === 'vypisky' ? 'bg-blue-100 border-blue-500' : 'bg-white hover:bg-blue-50'} border border-gray-200 rounded-lg transition-colors cursor-pointer"
						title="Výpisky"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 {activeTool === 'vypisky' ? 'text-blue-700' : 'text-blue-600'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
						</svg>
						<span class="text-xs font-medium {activeTool === 'vypisky' ? 'text-blue-700' : 'text-gray-700'}">Výpisky</span>
					</button>
					<button
						onclick={() => switchTool('kviz')}
						class="flex flex-row items-center justify-center gap-1.5 py-2 px-2 {activeTool === 'kviz' ? 'bg-blue-100 border-blue-500' : 'bg-white hover:bg-blue-50'} border border-gray-200 rounded-lg transition-colors cursor-pointer"
						title="Kvíz"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 {activeTool === 'kviz' ? 'text-blue-700' : 'text-blue-600'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
						</svg>
						<span class="text-xs font-medium {activeTool === 'kviz' ? 'text-blue-700' : 'text-gray-700'}">Kvíz</span>
					</button>
					<button
						onclick={() => switchTool('karty')}
						class="flex flex-row items-center justify-center gap-1.5 py-2 px-2 {activeTool === 'karty' ? 'bg-blue-100 border-blue-500' : 'bg-white hover:bg-blue-50'} border border-gray-200 rounded-lg transition-colors cursor-pointer"
						title="Karty"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 {activeTool === 'karty' ? 'text-blue-700' : 'text-blue-600'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
						</svg>
						<span class="text-xs font-medium {activeTool === 'karty' ? 'text-blue-700' : 'text-gray-700'}">Karty</span>
					</button>
				</div>
			</div>

			<!-- Rychlá AI tlačítka - Nyní lze skrýt/zobrazit -->
			<!-- TEMPORARILY HIDDEN - UNCOMMENT TO RESTORE -->
			{#if false && showQuickActions}
				<div class="p-4 border-b border-gray-200 bg-white">
					<div class="flex justify-between items-center mb-2">
						<h4 class="text-sm font-semibold text-gray-700">Rychlé akce pro zápisky:</h4>
						<button
							onclick={toggleQuickActions}
							class="text-xs text-gray-500 hover:text-gray-700 flex items-center"
							title="Skrýt"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4 mr-1"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 15l7-7 7 7"
								/>
							</svg>
							Skrýt
						</button>
					</div>
					<div class="space-y-2">
						{#each aiButtons as { label, action, shortcut }}
							<button
								class="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-3 rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group shadow-sm hover:shadow"
								onclick={() => generatePrompt(action)}
								disabled={isLoading}
								title={shortcut}
							>
								<span class="font-medium text-sm">{label}</span>
								<div class="flex items-center space-x-2">
									{#if generatingPrompt === action}
										<svg
											class="animate-spin h-4 w-4 text-white"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
									{/if}
									<span
										class="text-xs bg-blue-800 text-blue-100 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
									>
										{shortcut}
									</span>
								</div>
							</button>
						{/each}
					</div>
					<p class="text-xs text-gray-500 mt-2 text-center">
						💡 Použij klávesové zkratky: Ctrl+1 až Ctrl+4
					</p>
				</div>
			<!-- TEMPORARILY HIDDEN - UNCOMMENT TO RESTORE -->
			{:else if false}
				<!-- Tlačítko pro zobrazení rychlých akcí když jsou skryté -->
				<div class="p-2 border-b border-gray-200 bg-gray-50 text-center">
					<button
						onclick={toggleQuickActions}
						class="text-xs text-gray-600 hover:text-blue-600 flex items-center justify-center w-full py-1"
						title="Zobrazit rychlé akce"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 mr-1"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
						Zobrazit rychlé akce
					</button>
				</div>
			{/if}

			<!-- Chat messages -->
			<div
				bind:this={chatContainer}
				class="flex-1 overflow-y-auto p-4 space-y-4 {showQuickActions
					? 'bg-gray-50'
					: 'bg-gray-50'}"
				style="height: {showQuickActions ? 'calc(100% - 280px)' : 'calc(100% - 180px)'}"
			>
				{#each messages as message, index (index)}
					<div
						class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in"
					>
						<div
							class="max-w-[85%] rounded-xl px-4 py-3 shadow-sm {message.role === 'user'
								? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-none'
								: 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}"
						>
							{#if message.role === 'assistant' && index === 0}
								<div class="flex items-center mb-2">
									<div
										class="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-2"
									>
										<span class="text-white font-bold text-sm">AI</span>
									</div>
									<span class="text-sm font-semibold">AI Asistent</span>
								</div>
							{/if}
							<p class="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
							<div
								class="text-xs opacity-70 mt-2 {message.role === 'user'
									? 'text-blue-200'
									: 'text-gray-500'}"
							>
								{message.role === 'user' ? 'Ty' : 'AI'} • {new Date().toLocaleTimeString([], {
									hour: '2-digit',
									minute: '2-digit'
								})}
							</div>
						</div>
					</div>
				{/each}

				{#if isLoading}
					<div class="flex justify-start animate-fade-in">
						<div
							class="bg-white text-gray-800 border border-gray-200 rounded-xl rounded-bl-none px-4 py-3 shadow-sm"
						>
							<div class="flex items-center space-x-2">
								<div
									class="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center"
								>
									<span class="text-white font-bold text-sm">AI</span>
								</div>
								<div class="flex space-x-1">
									<div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
									<div
										class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
										style="animation-delay: 0.1s"
									></div>
									<div
										class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
										style="animation-delay: 0.2s"
									></div>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Input field -->
			<div class="p-4 border-t border-gray-200 bg-white rounded-b-lg">
				<div class="flex space-x-2">
					<textarea
						bind:value={inputMessage}
						onkeypress={handleKeyPress}
						placeholder="Napište svou otázku nebo použijte jedno z tlačítek výše..."
						class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-text"
						rows="2"
						disabled={isLoading}
					></textarea>
					<button
						onclick={sendMessage}
						disabled={isLoading || !inputMessage.trim()}
						class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center cursor-pointer shadow-sm hover:shadow"
						aria-label="Odeslat zprávu"
						title="Odeslat (Enter)"
					>
						{#if isLoading}
							<svg
								class="animate-spin h-5 w-5 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
						{:else}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
								/>
							</svg>
						{/if}
					</button>
				</div>
				<div class="flex justify-between items-center mt-2">
					<p class="text-xs text-gray-500">
						{#if inputMessage.trim().length > 0}
							Znaky: {inputMessage.length}
						{:else}
							Stiskněte Enter pro odeslání, Shift+Enter pro nový řádek
						{/if}
					</p>
					<button
						onclick={() => (inputMessage = '')}
						class="text-xs text-gray-500 hover:text-gray-700"
						title="Vymazat zprávu"
					>
						Vymazat
					</button>
				</div>
			</div>
		</div>
	{:else if !embedded}
		<!-- Floating chat button (only show if not embedded) -->
		<button
			onclick={toggleChat}
			class="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full p-4 shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer group animate-bounce-slow"
			aria-label="Otevřít chat"
			title="Otevřít AI asistenta"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
				/>
			</svg>
			<span
				class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse"
			>
				AI
			</span>
		</button>
	{/if}
</div>

<style>
	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	@keyframes bounce-slow {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-5px);
		}
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-bounce {
		animation: bounce 1s infinite;
	}

	.animate-bounce-slow {
		animation: bounce-slow 2s infinite;
	}

	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* Custom scrollbar */
	::-webkit-scrollbar {
		width: 8px;
	}

	::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 4px;
	}

	::-webkit-scrollbar-thumb {
		background: #888;
		border-radius: 4px;
	}

	::-webkit-scrollbar-thumb:hover {
		background: #555;
	}
</style>
<script lang="ts">
	// Reaktivní stavy
	let isOpen = $state(false);
	let messages = $state<{ role: string; content: string }[]>([]);
	let inputMessage = $state('');
	let isLoading = $state(false);
	let chatContainer = $state<HTMLDivElement | null>(null);

	// Aktuální unit a subject
	let currentUnit = 'unit-1'; // Dynamicky nastavujeme
	let currentSubject = 'english'; // Dynamicky nastavujeme

	// Tlačítka pro generování promptů
	let aiButtons = [
		{ label: 'Udělej mi kvíz z tohoto Unit', action: 'quiz' },
		{ label: 'Udělej mi shrnutí tohoto Unit', action: 'summary' }
	];

	// Přidej úvodní zprávu při prvním zobrazení
	$effect(() => {
		messages = [
			{
				role: 'assistant',
				content:
					'Ahoj! Jsem AI asistent a pomůžu ti s učením. Máš nějakou otázku k učebnici nebo pracovnímu sešitu?'
			}
		];
	});

	// Funkce pro odeslání zprávy
	async function sendMessage() {
		if (!inputMessage.trim() || isLoading) return;

		const userMessage = inputMessage.trim();
		inputMessage = '';

		// Přidej uživatelskou zprávu
		messages = [...messages, { role: 'user', content: userMessage }];
		isLoading = true;

		// Scroll na konec
		setTimeout(() => {
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		}, 100);

		try {
			const messagesToSend = messages
				.filter((msg) => msg.role !== 'system')
				.map((msg) => ({
					role: msg.role,
					content: msg.content
				}));

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
			messages = [...messages, { role: 'assistant', content: data.message }];
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

			messages = [
				...messages,
				{
					role: 'assistant',
					content: errorMessage
				}
			];
		} finally {
			isLoading = false;
			setTimeout(() => {
				if (chatContainer) {
					chatContainer.scrollTop = chatContainer.scrollHeight;
				}
			}, 100);
		}
	}

	function handleKeyPress(event: KeyboardEvent): void {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function toggleChat(): void {
		isOpen = !isOpen;
	}

	// Funkce pro generování promptů
	async function generatePrompt(action: string) {
		try {
			let content = '';
			
			// Nejprve zkusíme získat obsah z API
			try {
				content = await fetchUnitContent(currentUnit, currentSubject);
			} catch (error) {
				console.warn('API endpoint not found, using fallback content');
				content = `Učivo z předmětu ${currentSubject}, unit ${currentUnit}. Pro podrobný obsah prosím nahrajte materiály.`;
			}
			
			let prompt = '';

			if (action === 'quiz') {
				prompt = `Vytvoř kvíz pro ${currentSubject}, ${currentUnit}.${content ? ' Použij tento obsah: ' + content : ''} Kvíz měl mít 5-10 otázek různých typů (multiple choice, true/false, doplňování).`;
			} else if (action === 'summary') {
				prompt = `Vytvoř stručné shrnutí pro ${currentSubject}, ${currentUnit}.${content ? ' Obsah: ' + content : ''} Shrnutí by mělo obsahovat hlavní téma, klíčová slovíčka, gramatiku a praktické příklady.`;
			}

			// Nastavit prompt do vstupního pole
			inputMessage = prompt;
			
			// Scroll na vstupní pole
			setTimeout(() => {
				const textarea = document.querySelector('textarea');
				if (textarea) {
					textarea.focus();
				}
			}, 50);
			
		} catch (error) {
			console.error('Error generating prompt:', error);
			inputMessage = `Vytvoř ${action === 'quiz' ? 'kvíz' : 'shrnutí'} pro ${currentSubject}, ${currentUnit}.`;
		}
	}

	// Funkce pro získání obsahu pro konkrétní Unit a Subject
	async function fetchUnitContent(unit: string, subject: string): Promise<string> {
		try {
			const response = await fetch(`/api/get-unit-content?subject=${subject}&unit=${unit}`);
			
			if (!response.ok) {
				if (response.status === 404) {
					throw new Error('API endpoint not found');
				}
				throw new Error(`HTTP error ${response.status}`);
			}
			
			const data = await response.json();
			return data.content?.slice(0, 500) || ''; // Vrátíme první 500 znaků pro prompt
		} catch (error) {
			console.error('Error fetching unit content:', error);
			throw error;
		}
	}
</script>

<div class="fixed bottom-4 right-4 z-50">
	{#if isOpen}
		<!-- Chat Window -->
		<div class="bg-white rounded-lg shadow-2xl w-96 h-[600px] flex flex-col border border-gray-200">
			<div class="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
				<div>
					<h3 class="font-semibold text-lg">AI Asistent</h3>
					<p class="text-xs text-blue-100">Pomoc s učením</p>
				</div>
				<button
					onclick={toggleChat}
					class="text-white hover:text-gray-200 transition-colors p-1 cursor-pointer"
					aria-label="Zavřít chat"
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
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Tlačítka pro AI prompt -->
			<div class="p-4 border-t border-gray-200 bg-white">
				{#each aiButtons as { label, action }}
					<button
						class="w-full bg-blue-600 text-white p-2 rounded-lg mb-2 hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
						onclick={() => generatePrompt(action)}
						disabled={isLoading}
					>
						{label}
					</button>
				{/each}
			</div>

			<!-- Zprávy a chat -->
			<div bind:this={chatContainer} class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
				{#each messages as message}
					<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
						<div
							class="max-w-[80%] rounded-lg px-4 py-2 {message.role === 'user'
								? 'bg-blue-600 text-white'
								: 'bg-white text-gray-800 border border-gray-200'}"
						>
							<p class="text-sm whitespace-pre-wrap">{message.content}</p>
						</div>
					</div>
				{/each}

				{#if isLoading}
					<div class="flex justify-start">
						<div class="bg-white text-gray-800 border border-gray-200 rounded-lg px-4 py-2">
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
				{/if}
			</div>

			<!-- Vstupní pole -->
			<div class="p-4 border-t border-gray-200 bg-white rounded-b-lg">
				<div class="flex space-x-2">
					<textarea
						bind:value={inputMessage}
						onkeypress={handleKeyPress}
						placeholder="Napište svou otázku..."
						class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-text"
						rows="2"
						disabled={isLoading}
					></textarea>
					<button
						onclick={sendMessage}
						disabled={isLoading || !inputMessage.trim()}
						class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
						aria-label="Odeslat zprávu"
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
								d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	{:else}
		<button
			onclick={toggleChat}
			class="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-all hover:scale-110 active:scale-95 cursor-pointer"
			aria-label="Otevřít chat"
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

	.animate-bounce {
		animation: bounce 1s infinite;
	}
</style>
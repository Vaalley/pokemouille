<script>
	import { onMount, afterUpdate } from 'svelte';
	import { goto } from '$app/navigation';
	import { capitalize, hyphenRemover } from '$lib/utils';
	export let data;

	let showSearchBar = false;
	let inputEl;
	let matchingPokemon = [];
	let matchingAbility = [];
	let matchingMove = [];
	let pokemonData = data.pokemon_v2_pokemon;
	let abilityData = data.pokemon_v2_ability;
	let moveData = data.pokemon_v2_move;

	function toggleSearchBar(event) {
		if (event.key === 'Escape' || event.type === 'click') {
			showSearchBar = false;
		} else if (/^[a-zA-Z]$/.test(event.key)) {
			showSearchBar = true;
		}
	}

	function updateMatching(event) {
		const searchTerm = event.target.value.toLowerCase();
		if (searchTerm) {
			let count = 0;
			matchingPokemon = [];
			matchingAbility = [];
			matchingMove = [];
			for (const pokemon of pokemonData) {
				if (count >= 10) {
					break;
				}
				const name = pokemon.name.toLowerCase().replace(/ /g, '-');
				if (name.includes(searchTerm)) {
					const slug = name.replace(/ /g, '-');
					pokemon.slug = slug;
					matchingPokemon.push(pokemon);
					count++;
				}
			}
			for (const ability of abilityData) {
				if (count >= 10) {
					break;
				}
				const name = ability.name.toLowerCase();
				if (name.includes(searchTerm)) {
					const slug = name.replace(/ /g, '-');
					ability.slug = slug;
					matchingAbility.push(ability);
					count++;
				}
			}
			for (const move of moveData) {
				if (count >= 10) {
					break;
				}
				const name = move.name.toLowerCase().replace(/-/g, ' ');
				if (name.includes(searchTerm)) {
					const slug = name.replace(/ /g, '-');
					move.slug = slug;
					matchingMove.push(move);
					count++;
				}
			}
		} else {
			matchingPokemon = [];
			matchingAbility = [];
			matchingMove = [];
		}
	}

	onMount(() => {
		document.addEventListener('keydown', toggleSearchBar);
		document.addEventListener('click', toggleSearchBar);
	});

	afterUpdate(() => {
		if (showSearchBar) {
			inputEl.focus();
		}
	});
</script>

{#if showSearchBar}
	<div
		class="fixed top-0 left-0 w-full h-full flex flex-col justify-center items-center bg-black bg-opacity-50 z-50"
	>
		<input
			type="text"
			placeholder="Search..."
			class="w-80 max-w-[600px] px-4 py-2 text-lg rounded-md shadow-md border-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
			bind:this={inputEl}
			on:blur={toggleSearchBar}
			on:input={updateMatching}
		/>

		{#if matchingPokemon.length}
			<ul class="mt-4 w-80 max-w-[600px] divide-y divide-gray-200">
				{#each matchingPokemon as pokemon}
					<a
						href={`/pokemon/${pokemon.slug}`}
						on:click|preventDefault={() => {
							if (window.location.pathname === `/pokemon/${pokemon.slug}`) {
								window.location.href = `${window.location.origin}/pokemon`;
							} else {
								goto(`/pokemon/${pokemon.slug}`);
								window.location.href = `${window.location.origin}/pokemon/${pokemon.slug}`;
							}
						}}
						class="block mt-2"
					>
						<li
							class="flex items-center gap-6 h-16 text-xl font-semibold rounded-md bg-white cursor-pointer hover:bg-gray-100 px-4"
						>
							<img
								class="h-14 my-[-6px]"
								src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
								alt={pokemon.name}
							/>
							<span>{capitalize(hyphenRemover(pokemon.name))}</span>
						</li>
					</a>
				{/each}
			</ul>
		{/if}

		{#if matchingAbility.length}
			<ul class="mt-4 w-80 max-w-[600px] divide-y divide-gray-200">
				{#each matchingAbility as ability}
					<a
						href={`/ability/${ability.slug}`}
						on:click|preventDefault={() => {
							if (window.location.pathname === `/ability/${ability.slug}`) {
								window.location.href = `${window.location.origin}/ability`;
							} else {
								goto(`/ability/${ability.slug}`);
								window.location.href = `${window.location.origin}/ability/${ability.slug}`;
							}
						}}
						class="block mt-2"
					>
						<li
							class="flex items-center gap-6 h-16 text-xl font-semibold rounded-md bg-white cursor-pointer hover:bg-gray-100 px-4"
						>
							<img
								class="h-14 my-[-6px]"
								src="https://i.pinimg.com/736x/3f/53/20/3f5320bda51f29d0e6ef7a61d030c234--cricut.jpg"
								alt={ability.name}
							/>
							<span>{capitalize(hyphenRemover(ability.name))}</span>
						</li>
					</a>
				{/each}
			</ul>
		{/if}

		{#if matchingMove.length}
			<ul class="mt-4 w-80 max-w-[600px] divide-y divide-gray-200">
				{#each matchingMove as move}
					<a
						href={`/move/${move.slug}`}
						on:click|preventDefault={() => {
							if (window.location.pathname === `/move/${move.slug}`) {
								window.location.href = `${window.location.origin}/move`;
							} else {
								goto(`/move/${move.slug}`);
								window.location.href = `${window.location.origin}/move/${move.slug}`;
							}
						}}
						class="block mt-2"
					>
						<li
							class="flex items-center gap-6 h-16 text-xl font-semibold rounded-md bg-white cursor-pointer hover:bg-gray-100 px-4"
						>
							<img
								class="h-14 my-[-6px]"
								src="https://print-and-color.com/wp-content/uploads/pokemon_logo.png"
								alt={move.name}
							/>
							<span>{capitalize(hyphenRemover(move.name))}</span>
						</li>
					</a>
				{/each}
			</ul>
		{/if}
	</div>
{/if}

<script>
	import { onMount, afterUpdate } from 'svelte';
	import { capitalize, hyphenRemover } from '$lib/utils';
	import Type from './Type.svelte';
	export let data;

	let showSearchBar = false;
	let inputEl;
	let matchingPokemon = [];
	let matchingAbility = [];
	let matchingMove = [];
	let pokemonData = data.pokemon_v2_pokemon;
	let abilityData = data.pokemon_v2_ability;
	let moveData = data.pokemon_v2_move;
	const pokemonSpriteUrl =
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
	const moveSpriteUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/';

	function toggleSearchBar(event) {
		if (event.key === 'Escape' && showSearchBar) {
			showSearchBar = false;
		} else if (event.type === 'click' && event.target !== inputEl) {
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
				if (name.includes(searchTerm) && pokemon.is_default) {
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
				const name = ability.name.toLowerCase().replace(/-/g, ' ');
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

	// console.log(data);
	onMount(() => {
		if (window.innerWidth >= 1024) {
			document.addEventListener('keydown', toggleSearchBar);
			document.addEventListener('click', toggleSearchBar);
		}
		if (window.innerWidth < 1024) {
			showSearchBar = true;
		}
	});

	afterUpdate(() => {
		if (showSearchBar) {
			inputEl.focus();
		}
	});
</script>

{#if showSearchBar}
	<div
		class="fixed top-0 left-0 w-full h-full flex flex-col justify-center items-center bg-tertiary-100 bg-opacity-20 z-50 -lg:static"
	>
		<input
			type="text"
			placeholder="Search..."
			class="w-80 max-w-[600px] input variant-form-material outline-none bg-tertiary-100 h3 px-4 py-3"
			bind:this={inputEl}
			on:blur={toggleSearchBar}
			on:input={updateMatching}
		/>

		{#if matchingPokemon.length}
			<ul class="mt-6 grid grid-cols-2 gap-6 items-start">
				{#each matchingPokemon as pokemon}
					<a data-sveltekit-reload href={`/pokemon/${pokemon.slug}`}>
						<li
							class="flex items-center justify-end gap-6 h-24 h4 font-semibold rounded-none p-3 outline-none cursor-pointer card hover:border-primary-500 hover:border-b-2 bg-tertiary-100 hover:text-primary-500"
						>
							<img
								class="h-fit"
								src={`${pokemonSpriteUrl}${pokemon.id}.png`}
								alt={pokemon.name}
								loading="lazy"
							/>
							<p class="mr-auto">{capitalize(hyphenRemover(pokemon.name))}</p>
							<div class="flex flex-col gap-1 text-sm items-end">
								{#each pokemon.pokemon_v2_pokemontypes as pokemonType}
									<p><Type textSize="12" type={pokemonType.pokemon_v2_type.name} /></p>
								{/each}
							</div>
						</li>
					</a>
				{/each}
			</ul>
		{/if}

		{#if matchingAbility.length}
			<ul class="mt-6 grid grid-cols-2 gap-6 items-start">
				{#each matchingAbility as ability}
					<a data-sveltekit-reload href={`/ability/${ability.slug}`}>
						<li
							class="flex items-center justify-end gap-6 h-24 h4 font-semibold rounded-none p-3 outline-none cursor-pointer card hover:border-primary-500 hover:border-b-2 bg-tertiary-100 hover:text-primary-500"
						>
							<img
								class="h-fit my-[-6px]"
								src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ability-capsule.png"
								alt={ability.name}
								loading="lazy"
							/>
							<p>{capitalize(hyphenRemover(ability.name))}</p>
						</li>
					</a>
				{/each}
			</ul>
		{/if}

		{#if matchingMove.length}
			<ul class="mt-6 grid grid-cols-2 gap-6 items-start">
				{#each matchingMove as move}
					<a data-sveltekit-reload href={`/move/${move.slug}`}>
						<li
							class="flex items-center justify-end gap-6 h-24 h4 font-semibold rounded-none p-3 outline-none cursor-pointer card hover:border-primary-500 hover:border-b-2 bg-tertiary-100 hover:text-primary-500"
						>
							<img
								class="h-fit my-[-6px]"
								src={`${moveSpriteUrl}tm-${move.pokemon_v2_type.name}.png`}
								alt={move.name}
								loading="lazy"
							/>
							<p class="mr-auto">{capitalize(hyphenRemover(move.name))}</p>
							<div class="flex flex-col gap-1 text-sm items-end">
								{#if move.pokemon_v2_type}
									<p><Type textSize="12" type={move.pokemon_v2_type.name} /></p>
								{/if}
							</div>
						</li>
					</a>
				{/each}
			</ul>
		{/if}
	</div>
{/if}

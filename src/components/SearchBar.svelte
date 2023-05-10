<script>
	import { onMount, afterUpdate } from 'svelte';
	import { goto } from '$app/navigation';
	import { capitalize, hyphenRemover } from '$lib/utils';
	export let data;

	let showSearchBar = false;
	let inputEl;
	let matchingPokemon = [];
	let matchingAbility = [];
	let pokemonData = data.pokemon_v2_pokemon;
	let abilityData = data.pokemon_v2_ability;

	// console.log(abilityData);

	function toggleSearchBar(event) {
		if (event.key === 'Escape' || event.type === 'click') {
			showSearchBar = false;
		} else if (/^[a-zA-Z]$/.test(event.key)) {
			showSearchBar = true;
		}
	}

	function updateMatchingPokemon(event) {
		const searchTerm = event.target.value.toLowerCase();
		if (searchTerm) {
			let count = 0;
			matchingPokemon = pokemonData.filter((pokemon) => {
				if (count >= 10) {
					return false;
				}
				const name = pokemon.name.toLowerCase().replace(/-/g, '');
				if (name.includes(searchTerm)) {
					const slug = name.replace(/ /g, '-');
					pokemon.slug = slug;
					count++;
					return true;
				}
				return false;
			});
		} else {
			matchingPokemon = [];
		}
	}

	function updateMatchingAbility(event) {
		const searchTerm = event.target.value.toLowerCase();
		if (searchTerm) {
			let count = 0;
			matchingAbility = abilityData.filter((ability) => {
				if (count >= 10) {
					return false;
				}
				const name = ability.name.toLowerCase();
				if (name.includes(searchTerm)) {
					const slug = name.replace(/ /g, '-');
					ability.slug = slug;
					count++;
					return true;
				}
				return false;
			});
		} else {
			matchingAbility = [];
		}
	}

	function updateMatching(event) {
		const searchTerm = event.target.value.toLowerCase();
		if (searchTerm) {
			let count = 0;
			matchingPokemon = [];
			matchingAbility = [];
			for (const pokemon of pokemonData) {
				if (count >= 10) {
					break;
				}
				const name = pokemon.name.toLowerCase().replace(/-/g, '');
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
		} else {
			matchingPokemon = [];
			matchingAbility = [];
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
	<div class="search-bar">
		<input
			type="text"
			placeholder="Search..."
			bind:this={inputEl}
			on:blur={toggleSearchBar}
			on:input={updateMatching}
		/>

		{#if matchingPokemon.length}
			<ul>
				{#each matchingPokemon as pokemon}
					<a
						href={`/pokemon/${pokemon.slug}`}
						on:click|preventDefault={() => {
							goto(`/pokemon/${pokemon.slug}`);
							// Reload the page on a x sec timeout
							setTimeout(() => {
								window.location.reload();
							}, 500);
						}}
					>
						<li class="flex items-center gap-6 text-xl font-semibold h-16">
							<img
								class="my-[-6px] h-14"
								src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
								alt={pokemon.name}
							/>
							{capitalize(hyphenRemover(pokemon.name))}
						</li>
					</a>
				{/each}
			</ul>
		{/if}

		{#if matchingAbility.length}
			<ul>
				{#each matchingAbility as ability}
					<a
						href={`/ability/${ability.slug}`}
						on:click|preventDefault={() => {
							goto(`/ability/${ability.slug}`);
							// Reload the page on a 1 sec timeout
							setTimeout(() => {
								window.location.reload();
							}, 1000);
						}}
					>
						<li class="flex items-center gap-6 text-xl font-semibold h-16">
							<img
								class="my-[-6px] h-14"
								src="https://archives.bulbagarden.net/media/upload/5/5b/TM_artwork_RTDX.png"
								alt={ability.name}
							/>
							{capitalize(hyphenRemover(ability.name))}
						</li>
					</a>
				{/each}
			</ul>
		{/if}
	</div>
{/if}

<style>
	.search-bar {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 999;
	}

	.search-bar input {
		padding: 10px;
		font-size: 1.2rem;
		border: none;
		border-radius: 4px;
		box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
		width: 80%;
		max-width: 600px;
	}

	.search-bar ul {
		margin-top: 20px;
		list-style: none;
		padding: 0;
		width: 80%;
		max-width: 600px;
	}

	.search-bar li {
		padding: 10px;
		font-size: 1.2rem;
		background-color: white;
		border-radius: 4px;
		margin-bottom: 5px;
		cursor: pointer;
	}

	.search-bar li:hover {
		background-color: #eee;
	}
</style>

<script>
	import { onMount, afterUpdate } from 'svelte';
	export let data;

	// console.log(data);

	let showSearchBar = false;
	let inputEl;
	let matchingPokemon = [];
	let pokemonData = data.pokemon.pokemon_v2_pokemon;

	function toggleSearchBar(event) {
		if (event.key === 'Escape' || event.type === 'click') {
			showSearchBar = false;
		} else if (/^[a-zA-Z]$/.test(event.key)) {
			showSearchBar = true;
			inputEl.focus();
		}
	}

	function updateMatchingPokemon(event) {
		const searchTerm = event.target.value.toLowerCase();
		if (searchTerm) {
			matchingPokemon = pokemonData
				.filter((pokemon) => pokemon.name.toLowerCase().includes(searchTerm))
				.slice(0, 10);
		} else {
			matchingPokemon = [];
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
			on:input={updateMatchingPokemon}
		/>
		{#if matchingPokemon.length}
			<ul>
				{#each matchingPokemon as pokemon}
					<li>{pokemon.name}</li>
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

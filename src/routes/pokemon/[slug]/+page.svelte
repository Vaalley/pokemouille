<script>
	export let data;
	import { goto } from '$app/navigation';
	import { capitalize, hyphenRemover, getIdFromUrl } from '$lib/utils';
	import SearchBar from '../../../components/SearchBar.svelte';

	let pokemonInfo = data.pokemonInfo;
	let pokemonEvolutionChain = data.pokemonInfo.evolutionChain;
	let searchData = data.searchData;
	const pokemonSpritesBaseUrl =
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

	// console.log(pokemonEvolutionChain.chain);
</script>

<svelte:head>
	<title>{capitalize(hyphenRemover(pokemonInfo.name))}</title>
</svelte:head>

<div class="container mx-auto py-8">
	<div class="my-8 flex items-center">
		<h1 class="text-4xl font-semibold">{capitalize(hyphenRemover(pokemonInfo.name))}</h1>
		<img src={pokemonInfo.sprites.front_default} alt={pokemonInfo.name} />
	</div>

	<div>
		<h2 class="text-2xl font-semibold mb-6">Evolution Chain:</h2>
		<div class="flex justify-around">
			{#if pokemonEvolutionChain.chain.species}
				<a
					class="flex flex-col items-center w-fit"
					href={`/pokemon/${pokemonEvolutionChain.chain.species.name}`}
					on:click|preventDefault={() => {
						if (
							window.location.pathname === `/pokemon/${pokemonEvolutionChain.chain.species.name}`
						) {
							window.location.href = `${window.location.origin}/pokemon`;
						} else {
							goto(`/pokemon/${pokemonEvolutionChain.chain.species.name}`);
							window.location.href = `${window.location.origin}/pokemon/${pokemonEvolutionChain.chain.species.name}`;
						}
					}}
				>
					<p>{pokemonEvolutionChain.chain.species.name}</p>
					<img
						src={`${pokemonSpritesBaseUrl}/${getIdFromUrl(
							pokemonEvolutionChain.chain.species.url
						)}.png`}
						alt={pokemonEvolutionChain.chain.species.name}
					/>
				</a>
				{#if pokemonEvolutionChain.chain.evolves_to}
					{#each pokemonEvolutionChain.chain.evolves_to as evolvesTo}
						<a
							class="flex flex-col items-center w-fit"
							href={`/pokemon/${evolvesTo.species.name}`}
							on:click|preventDefault={() => {
								if (window.location.pathname === `/pokemon/${evolvesTo.species.name}`) {
									window.location.href = `${window.location.origin}/pokemon`;
								} else {
									goto(`/pokemon/${evolvesTo.species.name}`);
									window.location.href = `${window.location.origin}/pokemon/${evolvesTo.species.name}`;
								}
							}}
						>
							<p>{evolvesTo.species.name}</p>
							<img
								src={`${pokemonSpritesBaseUrl}/${getIdFromUrl(evolvesTo.species.url)}.png`}
								alt={evolvesTo.species.name}
							/>
						</a>
						{#if evolvesTo.evolves_to}
							{#each evolvesTo.evolves_to as secondEvolvesTo}
								<a
									class="flex flex-col items-center w-fit"
									href={`/pokemon/${secondEvolvesTo.species.name}`}
									on:click|preventDefault={() => {
										if (window.location.pathname === `/pokemon/${secondEvolvesTo.species.name}`) {
											window.location.href = `${window.location.origin}/pokemon`;
										} else {
											goto(`/pokemon/${secondEvolvesTo.species.name}`);
											window.location.href = `${window.location.origin}/pokemon/${secondEvolvesTo.species.name}`;
										}
									}}
								>
									<p>{secondEvolvesTo.species.name}</p>
									<img
										src={`${pokemonSpritesBaseUrl}/${getIdFromUrl(
											secondEvolvesTo.species.url
										)}.png`}
										alt={secondEvolvesTo.species.name}
									/>
								</a>
							{/each}
						{/if}
					{/each}
				{/if}
			{/if}
		</div>
	</div>

	<div class="my-8 flexjustify-center items-center">
		<div class="flex justify-center items-center gap-32">
			<img
				src={pokemonInfo.sprites.other['official-artwork'].front_default}
				alt={pokemonInfo.name}
			/>
			<img src={pokemonInfo.sprites.other['official-artwork'].front_shiny} alt={pokemonInfo.name} />
		</div>
	</div>
	<div class="my-8 flex justify-between">
		<div class="lg:w-1/3">
			<h2 class="text-2xl font-semibold">ID</h2>
			<p>{pokemonInfo.id}</p>
		</div>
		<div class="my-4 lg:my-0 lg:w-1/3">
			<h2 class="text-2xl font-semibold">Height</h2>
			<p>{pokemonInfo.height / 10} m</p>
		</div>
		<div class="lg:w-1/3">
			<h2 class="text-2xl font-semibold">Weight</h2>
			<p>{pokemonInfo.weight / 10} kg</p>
		</div>
	</div>
	<div class="my-8 flex justify-between">
		<div class="lg:w-1/3">
			<h2 class="text-2xl font-semibold">Type(s)</h2>
			{#each pokemonInfo.types as type}
				<p>{capitalize(type.type.name)}</p>
			{/each}
		</div>
		<div class="my-4 lg:my-0 lg:w-1/3">
			<h2 class="text-2xl font-semibold">Ability(ies)</h2>
			{#each pokemonInfo.abilities as ability}
				<a href={`/ability/${getIdFromUrl(ability.ability.url)}`}>
					<p>{capitalize(hyphenRemover(ability.ability.name))}</p>
				</a>
			{/each}
		</div>
		<div class="lg:w-1/3">
			<h2 class="text-2xl font-semibold">Stats</h2>
			{#each pokemonInfo.stats as stat}
				<p>{capitalize(hyphenRemover(stat.stat.name))}: {stat.base_stat}</p>
			{/each}
		</div>
	</div>
	<div class="my-8">
		<h2 class="text-2xl font-semibold">Moves</h2>
		<ul class="grid grid-cols-3 gap-4">
			{#each pokemonInfo.moves as move}
				<li>
					<a href={`/move/${getIdFromUrl(move.move.url)}`}
						>{capitalize(hyphenRemover(move.move.name))}</a
					>
				</li>
			{/each}
		</ul>
	</div>
	<SearchBar data={searchData} />
</div>

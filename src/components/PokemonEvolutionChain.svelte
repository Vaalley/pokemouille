<script>
	export let pokemonEvolutionChain;

	import { capitalize, hyphenRemover, getIdFromUrl } from '$lib/utils';
	import { goto } from '$app/navigation';
	const pokemonSpritesBaseUrl =
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
</script>

<div>
	<h2 class="text-2xl font-semibold mb-6">Evolution Chain:</h2>
	<div class="flex justify-around">
		{#if pokemonEvolutionChain.chain.species}
			<a
				class="flex flex-col items-center w-fit"
				href={`/pokemon/${pokemonEvolutionChain.chain.species.name}`}
				on:click|preventDefault={() => {
					if (window.location.pathname === `/pokemon/${pokemonEvolutionChain.chain.species.name}`) {
						window.location.href = `${window.location.origin}/pokemon`;
					} else {
						goto(`/pokemon/${pokemonEvolutionChain.chain.species.name}`);
						window.location.href = `${window.location.origin}/pokemon/${pokemonEvolutionChain.chain.species.name}`;
					}
				}}
			>
				<p>{capitalize(hyphenRemover(pokemonEvolutionChain.chain.species.name))}</p>
				{#each pokemonEvolutionChain.chain.evolution_details as detail}
					{#if detail.min_level}
						<p>Level {detail.min_level}</p>
					{/if}
					{#if detail.trigger.name === 'use-item'}
						<p>Use {capitalize(hyphenRemover(detail.item.name))}</p>
					{/if}
					{#if detail.trigger.name === 'trade'}
						<p>Trade</p>
					{/if}
					{#if detail.trigger.name === 'other'}
						<p>Other requirement</p>
					{/if}
					{#if detail.min_affection}
						<p>Min Affection: {detail.min_affection}</p>
					{/if}
					{#if detail.min_happiness}
						<p>Min Happiness: {detail.min_happiness}</p>
					{/if}
					{#if detail.location}
						<p>Location: {capitalize(hyphenRemover(detail.location.name))}</p>
					{/if}
					{#if detail.time_of_day}
						<p>Time of Day: {capitalize(hyphenRemover(detail.time_of_day))}</p>
					{/if}
					<!-- Add more conditions for other trigger types -->
				{/each}
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
						<p>{capitalize(hyphenRemover(evolvesTo.species.name))}</p>
						{#each evolvesTo.evolution_details as detail}
							{#if detail.min_level}
								<p>Level {detail.min_level}</p>
							{/if}
							{#if detail.trigger.name === 'use-item'}
								<p>Use {capitalize(hyphenRemover(detail.item.name))}</p>
							{/if}
							{#if detail.trigger.name === 'trade'}
								<p>Trade</p>
							{/if}
							{#if detail.trigger.name === 'other'}
								<p>Other requirement</p>
							{/if}
							{#if detail.min_affection}
								<p>Min Affection: {detail.min_affection}</p>
							{/if}
							{#if detail.min_happiness}
								<p>Min Happiness: {detail.min_happiness}</p>
							{/if}
							{#if detail.location}
								<p>Location: {capitalize(hyphenRemover(detail.location.name))}</p>
							{/if}
							{#if detail.time_of_day}
								<p>Time of Day: {capitalize(hyphenRemover(detail.time_of_day))}</p>
							{/if}
							<!-- Add more conditions for other trigger types -->
						{/each}
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
								<p>{capitalize(hyphenRemover(secondEvolvesTo.species.name))}</p>
								{#each secondEvolvesTo.evolution_details as detail}
									{#if detail.min_level}
										<p>Level {detail.min_level}</p>
									{/if}
									{#if detail.trigger.name === 'use-item'}
										<p>Use {capitalize(hyphenRemover(detail.item.name))}</p>
									{/if}
									{#if detail.trigger.name === 'trade'}
										<p>Trade</p>
									{/if}
									{#if detail.trigger.name === 'other'}
										<p>Other requirement</p>
									{/if}
									{#if detail.min_affection}
										<p>Min Affection: {detail.min_affection}</p>
									{/if}
									{#if detail.min_happiness}
										<p>Min Happiness: {detail.min_happiness}</p>
									{/if}
									{#if detail.location}
										<p>Location: {capitalize(hyphenRemover(detail.location.name))}</p>
									{/if}
									{#if detail.time_of_day}
										<p>Time of Day: {capitalize(hyphenRemover(detail.time_of_day))}</p>
									{/if}
									<!-- Add more conditions for other trigger types -->
								{/each}
								<img
									src={`${pokemonSpritesBaseUrl}/${getIdFromUrl(secondEvolvesTo.species.url)}.png`}
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

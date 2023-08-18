<script>
	import SearchBar from '../../../components/SearchBar.svelte';
	import { LightSwitch } from '@skeletonlabs/skeleton';
	export let data;
	import { capitalize, hyphenRemover } from '$lib/utils';
	import Type from '../../../components/Type.svelte';

	let typeInfo = data.typeInfo;
	let searchData = data.searchData;
	const typeIconUrl =
		'https://raw.githubusercontent.com/partywhale/pokemon-type-icons/fcbe6978c61c359680bc07636c3f9bdc0f346b43/icons/';
	const typeHexColor = typeInfo.color;

	// console.log(typeInfo);
</script>

<LightSwitch class="absolute right-10 top-10 scale-125" />
<SearchBar data={searchData} />

<svelte:head>
	<title>Pokémouille | {capitalize(hyphenRemover(typeInfo.name))}</title>
	<link rel="icon" href="/favicon.png" />
</svelte:head>

<div class="min-h-screen">
	<!-- Type name -->
	<div class="flex h-32 items-center justify-center gap-6">
		<h1 class="h1 flex items-center font-bold">{capitalize(hyphenRemover(typeInfo.name))}</h1>
		<img width="48" loading="lazy" src={typeIconUrl + typeInfo.name + '.svg'} alt={typeInfo.name} />
	</div>
	<!-- Type weaknesses and strengths -->
	<div class="container mx-auto grid grid-cols-2 items-baseline">
		<!-- Type defending -->
		<div class="mt-20">
			<h2 class="h2 mb-6 font-semibold">
				Strengths and weaknesses for the {typeInfo.name} type when defending are:
			</h2>
			<ul class="flex justify-around">
				{#if typeInfo.defending.weak.length !== 0}
					<li>
						<h3 class="h3">Weak to:</h3>
						<ul class="flex flex-col gap-3">
							{#each typeInfo.defending.weak as weakness}
								<li><Type type={weakness} /></li>
							{/each}
						</ul>
					</li>
				{/if}

				{#if typeInfo.defending.resist.length !== 0}
					<li>
						<h3 class="h3">Resist to:</h3>
						<ul class="flex flex-col gap-3">
							{#each typeInfo.defending.resist as resist}
								<li><Type type={resist} /></li>
							{/each}
						</ul>
					</li>
				{/if}

				{#if typeInfo.defending.immune.length !== 0}
					<li>
						<h3 class="h3">Immune to:</h3>
						<ul class="flex flex-col gap-3">
							{#each typeInfo.defending.immune as immune}
								<li><Type type={immune} /></li>
							{/each}
						</ul>
					</li>
				{/if}
			</ul>
		</div>
		<!-- Type attacking -->
		<div class="mt-20">
			<h2 class="h2 mb-6 font-semibold">
				Strengths and weaknesses for the {typeInfo.name} type when attacking are:
			</h2>
			<ul class="flex justify-around">
				{#if typeInfo.attacking.notVeryEffective.length !== 0}
					<li>
						<h3 class="h3">Not very effective against:</h3>
						<ul class="flex flex-col gap-3">
							{#each typeInfo.attacking.notVeryEffective as notVeryEffective}
								<li><Type type={notVeryEffective} /></li>
							{/each}
						</ul>
					</li>
				{/if}

				{#if typeInfo.attacking.superEffective.length !== 0}
					<li>
						<h3 class="h3">Super effective against:</h3>
						<ul class="flex flex-col gap-3">
							{#each typeInfo.attacking.superEffective as SuperEffective}
								<li><Type type={SuperEffective} /></li>
							{/each}
						</ul>
					</li>
				{/if}

				{#if typeInfo.attacking.noEffect.length !== 0}
					<li>
						<h3 class="h3">No effect against:</h3>
						<ul class="flex flex-col gap-3">
							{#each typeInfo.attacking.noEffect as noEffect}
								<li><Type type={noEffect} /></li>
							{/each}
						</ul>
					</li>
				{/if}
			</ul>
		</div>
	</div>
</div>

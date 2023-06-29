<script>
	import { pokemonTypes, capitalize, getTextColor } from '$lib/utils';
	import { onMount } from 'svelte';
	import tippy from 'tippy.js';
	import 'tippy.js/dist/tippy.css';
	import 'tippy.js/animations/shift-away.css';
	import 'tippy.js/themes/light-border.css';
	export let type;
	export let textSize;

	let color = '';

	$: {
		for (const pokemonType of pokemonTypes) {
			if (pokemonType.name === type) {
				color = pokemonType.color;
			}
		}
	}

	function getTooltipContent(type) {
		const currentType = pokemonTypes.find((pokemonType) => pokemonType.name === type);
		const weaknesses = currentType.weak.join(', ');
		const resistances = currentType.resist.join(', ');
		const immune = currentType.immune.join(', ');

		return `
    <div class="p-2 text-lg">
      <strong>Weaknesses:</strong> ${capitalize(weaknesses)}<br>
      <strong>Resistances:</strong> ${capitalize(resistances)}<br>
      <strong>Immune:</strong> ${capitalize(immune)}
    </div>
  `;
	}

	onMount(() => {
		const element = document.getElementById(`type-${type}`);

		tippy(element, {
			content: getTooltipContent(type),
			allowHTML: true,
			animation: 'shift-away',
			theme: 'light-border'
		});
	});

	// console.log(color);
</script>

<!-- TODO: When type is hovered, display it's weaknesses and resistances -->
<div>
	<p
		id={`type-${type}`}
		style="background-color: {color}; color: {getTextColor(color)}; font-size: {textSize}px;"
		class="font-medium py-1 px-2 rounded-md w-fit hover:scale-105 hover:cursor-default transition-transform duration-300"
		on:mouseenter={() => tippy.show()}
	>
		{capitalize(type)}
	</p>
</div>

<style>
	.tippy-box[data-theme~='tomato'] {
		background-color: tomato;
		color: yellow;
	}
</style>

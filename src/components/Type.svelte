<script>
	import { pokemonTypes, capitalize, getTextColor } from '$lib/utils';
	export let type;
	export let textSize;

	let color = '';

	$: {
		for (const pokemonType of pokemonTypes) {
			if (pokemonType.name === type) {
				color = pokemonType.color;
			}
		}
		if (!color) {
			color = '#FFFFFF'; // Hex code for white
		}
	}

	// console.log(color);
</script>

<div>
	<p
		id={`type-${type}`}
		style="background-color: {color}; color: {getTextColor(color)}; font-size: {textSize}px;"
		class="w-fit px-2 py-1 font-medium hover:cursor-default"
	>
		{capitalize(type)}
	</p>
</div>

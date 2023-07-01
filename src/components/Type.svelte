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
	}

	// console.log(color);
</script>

<div>
	<p
		id={`type-${type}`}
		style="background-color: {color}; color: {getTextColor(color)}; font-size: {textSize}px;"
		class="font-medium py-1 px-2 rounded-md w-fit hover:cursor-default"
	>
		{capitalize(type)}
	</p>
</div>

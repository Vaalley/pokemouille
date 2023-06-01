<script>
	import { pokemonTypes, capitalize, getTextColor } from '$lib/utils';
	export let type;

	let color = '';

	for (const pokemonType of pokemonTypes) {
		if (pokemonType.name === type) {
			color = pokemonType.color;
		}
	}

	// console.log(color);
</script>

<div>
	<p
		style="background-color: {color}; color: {getTextColor(color)};"
		class="font-light text-xs py-1 px-2 rounded-md w-fit hover:scale-105 hover:cursor-default transition-transform duration-300"
	>
		{capitalize(type)}
	</p>
</div>

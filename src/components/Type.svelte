<script>
	import { pokemonTypes, capitalize, getTextColor } from '$lib/utils';
	export let type;
	export let textSize;

	let color = '';
	const typeIconUrl =
		'https://raw.githubusercontent.com/partywhale/pokemon-type-icons/fcbe6978c61c359680bc07636c3f9bdc0f346b43/icons/';

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

<div
	class="flex gap-1 px-2 py-1"
	style="background-color: {color}; color: {getTextColor(color)}; font-size: {textSize}px;"
>
	<img width="20" src={typeIconUrl + type + '.svg'} alt={type} />
	<p id={`type-${type}`} class="w-fit font-medium hover:cursor-default">
		{capitalize(type)}
	</p>
</div>

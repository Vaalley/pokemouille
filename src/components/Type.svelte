<script>
	import { pokemonTypes, capitalize, getTextColor } from '$lib/utils';
	export let type;
	export let textSize;
	export let tabIndex = 0;

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

<a
	tabindex={tabIndex}
	data-sveltekit-reload
	href={`/type/${type}`}
	class="card flex w-fit gap-1 px-3 py-1"
	style="background-color: {color}; color: {getTextColor(color)}; font-size: {textSize}px;"
>
	<img width="20" src={typeIconUrl + type + '.svg'} alt={type} />
	<p id={`type-${type}`} class="w-fit font-medium">
		{capitalize(type)}
	</p>
</a>

<script>
	export let data;

	let pokemon = data.pokemon;
	console.log(pokemon);
</script>

<h1>{pokemon.name}</h1>

<img src={pokemon.sprites.front_default} alt={pokemon.name} />

<p>Height: {pokemon.height}</p>
<p>Weight: {pokemon.weight}</p>

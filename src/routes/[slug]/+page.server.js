export async function load({ params }) {
	const { slug } = params;
	const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`);
	const data = await response.json();

	// console.log(data);

	return {
		pokemon: data,
		status: 200,
	};
}

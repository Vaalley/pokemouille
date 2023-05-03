export async function load({ params }) {
	const { slug } = params;

	try {
		const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`);

		if (!response.ok) {
			throw new Error(`Failed to fetch data from PokeAPI: ${response.status}`);
		}

		const data = await response.json();

		return {
			pokemon: data,
			status: 200,
		};
	} catch (error) {
		console.error(error);

		return {
			status: 500,
			error: 'Failed to fetch data from PokeAPI',
		}
	}
}
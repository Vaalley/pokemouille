import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient('https://beta.pokeapi.co/graphql/v1beta', {
	headers: {
		'Content-Type': 'application/json',
		Accept: '*/*'
	}
});

async function fetchItemInfo(slug) {
	let itemName = slug;

	try {
		const query = `
		query GetItemInfo {
			pokemon_v2_item(where: {name: {_eq: "${itemName}"}}) {
				name
				cost
			}
		}
		
`;
		return await client.request(query);
	} catch (error) {
		throw new Error('Error fetching item data ❌');
	}
}

export { fetchItemInfo };

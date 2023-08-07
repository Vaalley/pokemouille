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
				pokemon_v2_itemflavortexts(where: {language_id: {_eq: 9}}) {
					flavor_text
				}
				pokemon_v2_itemeffecttexts(where: {language_id: {_eq: 9}}) {
					short_effect
					effect
				}
				pokemon_v2_itemcategory {
					name
				}
			}
		}
		
`;
		return await client.request(query);
	} catch (error) {
		throw new Error('Error fetching item data ❌');
	}
}

export { fetchItemInfo };

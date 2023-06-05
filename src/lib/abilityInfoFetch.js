import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient('https://beta.pokeapi.co/graphql/v1beta', {
	headers: {
		'Content-Type': 'application/json',
		Accept: '*/*'
	}
});

async function fetchAbilityInfo(slug) {
	let abilityName = slug;

	try {
		const query = `
		query GetAbilityInfo {
			pokemon_v2_ability(where: {name: {_eq: "${abilityName}"}}) {
				name
				pokemon_v2_abilityeffecttexts(where: {language_id: {_eq: 9}}) {
					short_effect
					effect
					language_id
				}
				pokemon_v2_abilityflavortexts(where: {language_id: {_eq: 9}}, limit: 1) {
					flavor_text
				}
				pokemon_v2_pokemonabilities {
					is_hidden
					pokemon_v2_pokemon {
						name
						id
					}
				}
				pokemon_v2_generation {
					name
				}
			}
		}
`;
		return await client.request(query);
	} catch (error) {
		throw new Error('Error fetching ability data ❌');
	}
}

export { fetchAbilityInfo };

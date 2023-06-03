import { getAbilityInfo } from '$lib/abilityInfoCache.js';
import { getMainInfo } from '$lib/mainInfoCache.js';

export async function load({ params }) {
	const { slug } = params;

	try {
		const abilityInfo = await getAbilityInfo(slug);
		const searchData = await getMainInfo();

		return {
			abilityInfo,
			searchData,
			status: 200
		};
	} catch (error) {
		console.error(error);
		return {
			status: 500,
			error: 'Failed to fetch data from PokeAPI'
		};
	}
}

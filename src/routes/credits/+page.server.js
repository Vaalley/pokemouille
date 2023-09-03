import { getMainInfo } from '$lib/mainInfoCache.js';

export async function load() {
	try {
		const searchData = await getMainInfo();

		return {
			searchData,
			status: 200
		};
	} catch (error) {
		console.error(error);
		return {
			status: 500,
			error: 'Failed to fetch data from PokeAPI ❌'
		};
	}
}

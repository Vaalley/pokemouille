import { getMoveInfo } from '$lib/moveInfoCache.js';
import { getMainInfo } from '$lib/mainInfoCache.js';

export async function load({ params }) {
	const { slug } = params;

	try {
		const moveInfo = await getMoveInfo(slug);
		const searchData = await getMainInfo();

		return {
			moveInfo,
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

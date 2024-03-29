import { getItemInfo } from '$lib/itemInfoCache.js';
import { getMainInfo } from '$lib/mainInfoCache.js';

export async function load({ params }) {
	const { slug } = params;

	try {
		const itemInfo = await getItemInfo(slug);
		const searchData = await getMainInfo();

		return {
			itemInfo,
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

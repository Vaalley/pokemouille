import { getMainInfo } from '$lib/mainInfoCache.js';

export async function load() {
	try {
		const searchData = await getMainInfo();
		return {
			searchData,
			status: 200
		};
	} catch (error) {
		console.log(error);
		return {
			pokemon: null,
			status: 500
		};
	}
}

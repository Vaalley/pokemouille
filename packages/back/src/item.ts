import {
	debug,
	getCachedValue,
	normalizeFlavorText,
	queryGraphql,
	setCachedValue,
} from "./utilities";

const ITEM_DETAIL_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 2; // 2 days
const ITEM_LIST_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const ITEM_DETAIL_QUERY = `
	query ItemDetail($id: Int!, $language: String!, $generationId: Int!) {
		item(where: { id: { _eq: $id } }) {
			cost
			fling_power
			itemnames(where: { language: { name: { _eq: $language } } }) {
				name
			}
			itemeffecttexts(where: { language: { name: { _eq: $language } } }) {
				effect
				short_effect
			}
			itemsprites {
				sprites
			}
			itemflavortexts(
				where: { language: { name: { _eq: $language } }, versiongroup: { generation_id: { _eq: $generationId } } }
				order_by: { version_group_id: desc }
				limit: 1
			) {
				flavor_text
			}
			itemcategory {
				itemcategorynames(where: { language: { name: { _eq: $language } } }) {
					name
				}
				itempocket {
					itempocketnames(where: { language: { name: { _eq: $language } } }) {
						name
					}
				}
			}
			itemattributemaps {
				itemattribute {
					itemattributenames(where: { language: { name: { _eq: $language } } }) {
						name
					}
				}
			}
			pokemonitems {
				rarity
				version {
					versionnames(where: { language: { name: { _eq: $language } } }) {
						name
					}
				}
				pokemon {
					name
					pokemonsprites {
						sprites
					}
					pokemonspecy {
						id
						pokemonspeciesnames(where: { language: { name: { _eq: $language } } }) {
							name
						}
					}
				}
			}
			machines(where: { versiongroup: { generation_id: { _eq: $generationId } } }) {
				machine_number
				move {
					movenames(where: { language: { name: { _eq: $language } } }) {
						name
					}
				}
			}
			itemflingeffect {
				name
				itemflingeffecteffecttexts(where: { language: { name: { _eq: $language } } }) {
					effect
				}
			}
		}
	}
`;

const ITEM_LIST_QUERY = `
	query ItemList($language: String!) {
		itemname(
			where: { language: { name: { _eq: $language } } }
			order_by: { item_id: asc }
		) {
			name
			item_id
			item {
				itemsprites {
					sprites
				}
				itemcategory {
					itempocket {
						itempocketnames(where: { language: { name: { _eq: $language } } }) {
							name
						}
					}
				}
			}
		}
	}
`;

/**
 * Fetches and shapes item detail data for a given item ID, language, and generation.
 * Includes core info (cost, fling power), localized name, effect texts, flavor text,
 * category and pocket, attributes, fling effect, and Pokémon that hold this item in the wild.
 * Results are cached for 2 days per (id, language, generation) combination.
 */
export async function getItemDetail(id: string, language: string, selectedGeneration: number) {
	const cacheKey = `item:${id}:${language}:${selectedGeneration}`;
	debug("Fetching Item detail:", {
		id,
		language,
		selectedGeneration,
		cacheKey,
	});
	const cached = getCachedValue<any>(cacheKey);

	if (cached) {
		debug("Cache hit for Item detail:", cacheKey);
		return cached;
	}

	const data = await queryGraphql<any>(ITEM_DETAIL_QUERY, {
		id: Number(id),
		language,
		generationId: selectedGeneration,
	});

	const raw = data.item[0];
	if (!raw) throw new Error(`Item ${id} not found`);

	const seen = new Set<number>();
	const pokemon = [];
	for (const pi of raw.pokemonitems ?? []) {
		const speciesId = pi.pokemon?.pokemonspecy?.id ?? null;
		if (speciesId !== null && seen.has(speciesId)) continue;
		if (speciesId !== null) seen.add(speciesId);
		pokemon.push({
			speciesId,
			name:
				pi.pokemon?.pokemonspecy?.pokemonspeciesnames?.[0]?.name ??
				pi.pokemon?.name ??
				"Unknown",
			sprite: pi.pokemon?.pokemonsprites?.[0]?.sprites?.front_default ?? null,
			rarity: pi.rarity ?? null,
			version: pi.version?.versionnames?.[0]?.name ?? null,
		});
	}

	const machines = Array.from(
		new Map(
			(raw.machines ?? []).map((m: any) => [
				m.machine_number,
				{
					number: m.machine_number,
					moveName: m.move?.movenames?.[0]?.name ?? null,
				},
			]),
		).values(),
	);

	const item = {
		id,
		language,
		selectedGeneration,
		name: raw.itemnames?.[0]?.name ?? "Unknown",
		sprite: raw.itemsprites?.[0]?.sprites?.default ?? null,
		cost: raw.cost ?? null,
		flingPower: raw.fling_power ?? null,
		flingEffect:
			raw.itemflingeffect?.itemflingeffecteffecttexts?.[0]?.effect ??
			raw.itemflingeffect?.name ??
			null,
		shortEffect: raw.itemeffecttexts?.[0]?.short_effect ?? null,
		effect: raw.itemeffecttexts?.[0]?.effect ?? null,
		flavorText: normalizeFlavorText(raw.itemflavortexts?.[0]?.flavor_text ?? ""),
		category: raw.itemcategory?.itemcategorynames?.[0]?.name ?? null,
		pocket: raw.itemcategory?.itempocket?.itempocketnames?.[0]?.name ?? null,
		attributes: (raw.itemattributemaps ?? [])
			.map((a: any) => a.itemattribute?.itemattributenames?.[0]?.name ?? null)
			.filter(Boolean),
		machines,
		pokemon,
	};

	debug("Caching Item detail:", {
		cacheKey,
		name: item.name,
	});
	setCachedValue(cacheKey, item, ITEM_DETAIL_CACHE_TTL_MS);

	return item;
}

/**
 * Fetches and shapes item list data for a given language.
 * Includes localized name, sprite, and pocket.
 * Results are cached for 2 days per language.
 *
 * @param language The language to fetch the item list in.
 * @returns The item list.
 */
export async function getItemList(language: string) {
	const cacheKey = `item:all:${language}`;
	const cached = getCachedValue<any>(cacheKey);

	if (cached) {
		debug("Cache hit for item list:", {
			cacheKey,
			count: cached.length,
		});
		return cached;
	}

	try {
		const data = await queryGraphql<any>(ITEM_LIST_QUERY, {
			language,
		});

		const items = data.itemname.map((entry: any) => ({
			id: entry.item_id,
			name: entry.name,
			sprite: entry.item?.itemsprites?.[0]?.sprites?.default ?? null,
			pocket: entry.item?.itemcategory?.itempocket?.itempocketnames?.[0]?.name ?? null,
		}));

		debug("Caching item list:", {
			cacheKey,
			count: items.length,
		});
		setCachedValue(cacheKey, items, ITEM_LIST_CACHE_TTL_MS);
		return items;
	} catch (error) {
		debug("Error fetching item list:", error);
		throw error;
	}
}

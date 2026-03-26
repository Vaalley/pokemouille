import {
	debug,
	getCachedValue,
	normalizeFlavorText,
	queryGraphql,
	setCachedValue,
} from "./utilities";

const ABILITY_DETAIL_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 2; // 2 days
const ABILITY_LIST_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const ABILITY_DETAIL_QUERY = `
	query AbilityDetail($id: Int!, $language: String!, $generationId: Int!) {
		ability(where: { id: { _eq: $id } }) {
			generation_id
			is_main_series
			abilitynames(where: { language: { name: { _eq: $language } } }) {
				name
			}
			abilityeffecttexts(where: { language: { name: { _eq: $language } } }) {
				short_effect
				effect
			}
			abilityflavortexts(
				where: { language: { name: { _eq: $language } } }
				order_by: { version_group_id: desc }
			) {
				flavor_text
				versiongroup {
					generation_id
				}
			}
			abilitychanges(order_by: { version_group_id: desc }) {
				versiongroup {
					generation_id
				}
				abilitychangeeffecttexts(where: { language: { name: { _eq: $language } } }) {
					effect
				}
			}
			pokemonabilitypasts(order_by: { generation_id: desc }) {
				is_hidden
				generation {
					id
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
			pokemonabilities(
				where: { pokemon: { pokemonspecy: { generation_id: { _lte: $generationId } } } }
			) {
				is_hidden
				slot
				pokemon {
					name
					pokemonspecy {
						id
						pokemonspeciesnames(where: { language: { name: { _eq: $language } } }) {
							name
						}
					}
					pokemonsprites {
						sprites
					}
					pokemontypes {
						type {
							name
							typenames(where: { language: { name: { _eq: $language } } }) {
								name
							}
						}
					}
				}
			}
		}
	}
`;

const ABILITY_LIST_QUERY = `
	query AbilityList($language: String!) {
		abilityname(
			where: { language: { name: { _eq: $language } } }
			order_by: { ability_id: asc }
		) {
			name
			ability_id
			ability {
				abilityeffecttexts(where: { language: { name: { _eq: $language } } }) {
					short_effect
				}
			}
		}
	}
`;

/**
 * Fetches and shapes ability detail data for a given ability ID and language.
 * Includes localized name, effect texts, flavor text, and the list of Pokémon
 * that have this ability (normal and hidden slots), deduplicated by species ID
 * to avoid alternate forms appearing twice.
 * Results are cached for 1 hour per (id, language) combination.
 */
export async function getAbilityDetail(id: string, language: string, selectedGeneration: number) {
	const cacheKey = `ability:${id}:${language}:${selectedGeneration}`;
	debug("Fetching Ability detail:", {
		id,
		language,
		selectedGeneration,
		cacheKey,
	});
	const cached = getCachedValue<any>(cacheKey);

	if (cached) {
		debug("Cache hit for Ability detail:", cacheKey);
		return cached;
	}

	const data = await queryGraphql<any>(ABILITY_DETAIL_QUERY, {
		id: Number(id),
		language,
		generationId: selectedGeneration,
	});

	const raw = data.ability[0];
	if (!raw) throw new Error(`Ability ${id} not found`);

	const seen = new Set<number>();
	const pokemon = [];
	for (const pa of raw.pokemonabilities ?? []) {
		const speciesId = pa.pokemon?.pokemonspecy?.id ?? null;
		if (speciesId !== null && seen.has(speciesId)) continue;
		if (speciesId !== null) seen.add(speciesId);
		pokemon.push({
			isHidden: pa.is_hidden,
			slot: pa.slot,
			speciesId,
			name:
				pa.pokemon?.pokemonspecy?.pokemonspeciesnames?.[0]?.name ??
				pa.pokemon?.name ??
				"Unknown",
			sprite: pa.pokemon?.pokemonsprites?.[0]?.sprites?.front_default ?? null,
			types: (pa.pokemon?.pokemontypes ?? []).map((t: any) => ({
				name: t.type.typenames?.[0]?.name ?? "",
				slug: t.type.name,
			})),
		});
	}

	const effectChanges = (raw.abilitychanges ?? []).map((c: any) => ({
		generationId: c.versiongroup?.generation_id ?? null,
		effect: c.abilitychangeeffecttexts?.[0]?.effect ?? null,
	}));

	const pastPokemon = (raw.pokemonabilitypasts ?? []).map((p: any) => ({
		isHidden: p.is_hidden,
		lostAtGenerationId: p.generation?.id ?? null,
		speciesId: p.pokemon?.pokemonspecy?.id ?? null,
		name:
			p.pokemon?.pokemonspecy?.pokemonspeciesnames?.[0]?.name ?? p.pokemon?.name ?? "Unknown",
		sprite: p.pokemon?.pokemonsprites?.[0]?.sprites?.front_default ?? null,
	}));

	const ability = {
		id,
		language,
		name: raw.abilitynames?.[0]?.name ?? "Unknown",
		generationId: raw.generation_id ?? null,
		isMainSeries: raw.is_main_series ?? false,
		shortEffect: raw.abilityeffecttexts?.[0]?.short_effect ?? null,
		effect: raw.abilityeffecttexts?.[0]?.effect ?? null,
		flavorText: normalizeFlavorText(raw.abilityflavortexts?.[0]?.flavor_text ?? ""),
		effectChanges,
		pastPokemon,
		pokemon,
	};

	debug("Caching Ability detail:", {
		cacheKey,
		name: ability.name,
	});
	setCachedValue(cacheKey, ability, ABILITY_DETAIL_CACHE_TTL_MS);
	return ability;
}

export async function getAbilityList(language: string) {
	const cacheKey = `ability:all:${language}`;
	const cached = getCachedValue<any>(cacheKey);

	if (cached) {
		debug("Cache hit for ability list:", {
			cacheKey,
			count: cached.length,
		});
		return cached;
	}

	const data = await queryGraphql<any>(ABILITY_LIST_QUERY, {
		language,
	});

	const abilities = data.abilityname.map((item: any) => ({
		id: item.ability_id,
		name: item.name,
		shortEffect: item.ability?.abilityeffecttexts?.[0]?.short_effect ?? null,
	}));

	debug("Caching ability list:", {
		cacheKey,
		count: abilities.length,
	});
	setCachedValue(cacheKey, abilities, ABILITY_LIST_CACHE_TTL_MS);
	return abilities;
}

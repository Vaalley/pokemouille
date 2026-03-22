import {
	debug,
	getCachedValue,
	normalizeFlavorText,
	queryGraphql,
	setCachedValue,
} from "./utilities";

const ABILITY_DETAIL_CACHE_TTL_MS = 1000 * 60 * 60;

/**
 * Fetches and shapes ability detail data for a given ability ID and language.
 * Includes localized name, effect texts, flavor text, and the list of Pokémon
 * that have this ability (normal and hidden slots), deduplicated by species ID
 * to avoid alternate forms appearing twice.
 * Results are cached for 1 hour per (id, language) combination.
 */
export async function getAbilityDetail(
	id: string,
	language: string,
	cache: Map<string, { expiresAt: number; value: unknown }>,
	maxCacheSize: number,
	pokeApiGraphqlUrl: string,
) {
	const cacheKey = `ability:${id}:${language}`;
	debug("Fetching Ability detail:", { id, language, cacheKey });
	const cached = getCachedValue<any>(cache, cacheKey);

	if (cached) {
		debug("Cache hit for Ability detail:", cacheKey);
		return cached;
	}

	const data = await queryGraphql<any>(
		pokeApiGraphqlUrl,
		`
			query AbilityDetail($id: Int!, $language: String!) {
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
					pokemonabilities {
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
		`,
		{ id: Number(id), language },
	);

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

	const ability = {
		id,
		language,
		name: raw.abilitynames?.[0]?.name ?? "Unknown",
		generationId: raw.generation_id ?? null,
		isMainSeries: raw.is_main_series ?? false,
		shortEffect: raw.abilityeffecttexts?.[0]?.short_effect ?? null,
		effect: raw.abilityeffecttexts?.[0]?.effect ?? null,
		flavorText: normalizeFlavorText(raw.abilityflavortexts?.[0]?.flavor_text ?? ""),
		pokemon,
	};

	debug("Caching Ability detail:", { cacheKey, name: ability.name });
	setCachedValue(cache, maxCacheSize, cacheKey, ability, ABILITY_DETAIL_CACHE_TTL_MS);
	return ability;
}

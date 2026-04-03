import {
	debug,
	getCachedValue,
	normalizeFlavorText,
	queryGraphql,
	setCachedValue,
} from "./utilities";

const POKEMON_DETAIL_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 2; // 2 days
const POKEMON_LIST_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const POKEMON_DETAIL_QUERY = `
	query PokemonDetail($id: Int!, $language: String!, $generationId: Int!) {
		pokemonspecies(where: { id: { _eq: $id } }) {
			generation_id
			gender_rate
			hatch_counter
			capture_rate
			base_happiness
			is_legendary
			is_mythical
			is_baby
			pokemoncolor {
				name
			}
			pokemonhabitat {
				pokemonhabitatnames(where: { language: { name: { _eq: $language } } }) {
					name
				}
			}
			pokemonshape {
				pokemonshapenames(where: { language: { name: { _eq: $language } } }) {
					name
				}
			}
			growthrate {
				growthratedescriptions(where: { language: { name: { _eq: $language } } }) {
					description
				}
			}
			pokemonegggroups {
				egggroup {
					egggroupnames(where: { language: { name: { _eq: $language } } }) {
						name
					}
				}
			}
			evolutionchain {
				pokemonspecies(order_by: { order: asc }) {
					id
					pokemonspeciesnames(where: { language: { name: { _eq: $language } } }) {
						name
					}
					pokemonevolutions {
						min_level
						min_happiness
						time_of_day
						min_affection
						needs_overworld_rain
						turn_upside_down
						evolutiontrigger {
							evolutiontriggernames(where: { language: { name: { _eq: $language } } }) {
								name
							}
						}
						item {
							itemnames(where: { language: { name: { _eq: $language } } }) {
								name
							}
						}
						ItemByHeldItemId {
							itemnames(where: { language: { name: { _eq: $language } } }) {
								name
							}
						}
						move {
							movenames(where: { language: { name: { _eq: $language } } }) {
								name
							}
						}
					}
				}
			}
			pokemonspeciesnames(where: { language: { name: { _eq: $language } } }) {
				name
				genus
			}
			pokemonspeciesflavortexts(
				where: { language: { name: { _eq: $language } } }
				order_by: { version_id: desc }
			) {
				flavor_text
				version {
					versiongroup {
						generation_id
					}
				}
			}
			pokemondexnumbers {
				pokedex_number
				pokedex {
					pokedexnames(where: { language: { name: { _eq: $language } } }) {
						name
					}
				}
			}
			pokemons {
				is_default
				name
				height
				weight
				base_experience
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
				pokemonabilities {
					is_hidden
					ability {
						id
						abilitynames(where: { language: { name: { _eq: $language } } }) {
							name
						}
					}
				}
				pokemonstats {
					base_stat
					effort
					stat {
						statnames(where: { language: { name: { _eq: $language } } }) {
							name
						}
					}
				}
				pokemongameindices {
					version {
						versionnames(where: { language: { name: { _eq: $language } } }) {
							name
						}
						versiongroup {
							generation_id
						}
					}
				}
				pokemonmoves(where: { versiongroup: { generation_id: { _eq: $generationId } } }) {
					level
					movelearnmethod {
						movelearnmethodnames(where: { language: { name: { _eq: $language } } }) {
							name
						}
					}
					move {
						id
						movenames(where: { language: { name: { _eq: $language } } }) {
							name
						}
					}
				}
			}
		}
	}
`;

const POKEMON_LIST_QUERY = `
	query PokemonList($language: String!) {
		pokemonspeciesname(
			where: { language: { name: { _eq: $language } } }
			order_by: { pokemon_species_id: asc }
		) {
			name
			pokemon_species_id
			pokemonspecy {
				generation_id
				pokemons(where: { is_default: { _eq: true } }, limit: 1) {
					pokemonsprites {
						sprites
					}
					pokemontypes(order_by: { slot: asc }) {
						type {
							name
						}
					}
				}
			}
		}
	}
`;

/**
 * Fetches and shapes full Pokémon detail data for a given species ID, generation, and language.
 * Handles flavor text selection (prefers the entry matching the effective generation),
 * alternate form extraction, evolution chain mapping, and stat/move/ability normalization.
 * Results are cached for 1 hour per (id, language, generation) combination.
 */
export async function getPokemonDetail(id: string, selectedGeneration: number, language: string) {
	const cacheKey = `pokemon:${id}:${language}:${selectedGeneration}`;
	debug("Fetching Pokemon detail:", {
		id,
		selectedGeneration,
		language,
		cacheKey,
	});
	const cached = getCachedValue<any>(cacheKey);

	if (cached) {
		debug("Cache hit for Pokemon detail:", cacheKey);
		return cached;
	}

	debug("Cache miss for Pokemon detail, querying GraphQL:", cacheKey);

	const data = await queryGraphql<any>(POKEMON_DETAIL_QUERY, {
		id: Number(id),
		language,
		generationId: selectedGeneration,
	});

	const species = data.pokemonspecies[0];
	const introducedGeneration = species?.generation_id || selectedGeneration;
	const effectiveGeneration = Math.max(selectedGeneration, introducedGeneration);
	const flavorTextEntry =
		species?.pokemonspeciesflavortexts?.find(
			(entry: any) => entry.version.versiongroup.generation_id === effectiveGeneration,
		) || species?.pokemonspeciesflavortexts?.[0];
	const primaryForm = species?.pokemons?.find((p: any) => p.is_default) ?? species?.pokemons?.[0];
	const sprites = primaryForm?.pokemonsprites?.[0]?.sprites ?? null;

	const mapTypes = (list: any[]) =>
		list.map((t: any) => ({
			name: t.type.typenames?.[0]?.name ?? "",
			slug: t.type.name,
		}));

	const mapAbilities = (list: any[]) =>
		list.map((a: any) => ({
			id: a.ability.id,
			name: a.ability.abilitynames?.[0]?.name ?? "",
			isHidden: a.is_hidden,
		}));

	const mapStats = (list: any[]) =>
		list.map((s: any) => ({
			base_stat: s.base_stat,
			effort: s.effort,
			stat: {
				name: s.stat.statnames?.[0]?.name ?? "",
			},
		}));

	const pokemon = {
		effectiveGeneration,
		id,
		introducedGeneration,
		language,
		name: species?.pokemonspeciesnames?.[0]?.name || "Unknown",
		genus: species?.pokemonspeciesnames?.[0]?.genus ?? null,
		flavorText: normalizeFlavorText(flavorTextEntry?.flavor_text || ""),
		selectedGeneration,
		isLegendary: species?.is_legendary ?? false,
		isMythical: species?.is_mythical ?? false,
		isBaby: species?.is_baby ?? false,
		color: species?.pokemoncolor?.name ?? null,
		habitat: species?.pokemonhabitat?.pokemonhabitatnames?.[0]?.name ?? null,
		shape: species?.pokemonshape?.pokemonshapenames?.[0]?.name ?? null,
		genderRate: species?.gender_rate,
		hatchCounter: species?.hatch_counter,
		captureRate: species?.capture_rate,
		baseHappiness: species?.base_happiness,
		growthRate: species?.growthrate?.growthratedescriptions?.[0]?.description ?? null,
		eggGroups: (species?.pokemonegggroups ?? []).map(
			(g: any) => g.egggroup.egggroupnames?.[0]?.name ?? "",
		),
		evolutionChain: (species?.evolutionchain?.pokemonspecies ?? []).map((s: any) => {
			const evo = s.pokemonevolutions?.[0];
			return {
				id: s.id,
				name: s.pokemonspeciesnames?.[0]?.name ?? String(s.id),
				evolution: evo
					? {
							trigger: evo.evolutiontrigger?.evolutiontriggernames?.[0]?.name ?? null,
							minLevel: evo.min_level ?? null,
							minHappiness: evo.min_happiness ?? null,
							timeOfDay: evo.time_of_day || null,
							minAffection: evo.min_affection ?? null,
							needsOverworldRain: evo.needs_overworld_rain ?? null,
							turnUpsideDown: evo.turn_upside_down ?? null,
							item: evo.item?.itemnames?.[0]?.name ?? null,
							heldItem: evo.ItemByHeldItemId?.itemnames?.[0]?.name ?? null,
							move: evo.move?.movenames?.[0]?.name ?? null,
						}
					: null,
			};
		}),
		alternateForms: (species?.pokemons ?? [])
			.filter((p: any) => !p.is_default)
			.map((p: any) => ({
				name: p.name,
				spriteDefault: p.pokemonsprites?.[0]?.sprites?.front_default ?? null,
				spriteShiny: p.pokemonsprites?.[0]?.sprites?.front_shiny ?? null,
				types: mapTypes(p.pokemontypes ?? []),
				abilities: mapAbilities(p.pokemonabilities ?? []),
				stats: mapStats(p.pokemonstats ?? []),
			})),
		height: primaryForm?.height ?? null,
		weight: primaryForm?.weight ?? null,
		baseExperience: primaryForm?.base_experience ?? null,
		spriteDefault: sprites?.front_default ?? null,
		spriteShiny: sprites?.front_shiny ?? null,
		types: mapTypes(primaryForm?.pokemontypes ?? []),
		abilities: mapAbilities(primaryForm?.pokemonabilities ?? []),
		stats: mapStats(primaryForm?.pokemonstats ?? []),
		gameIndices: (primaryForm?.pokemongameindices ?? []).map((gi: any) => ({
			generationId: gi.version?.versiongroup?.generation_id ?? null,
			versionName: gi.version?.versionnames?.[0]?.name ?? gi.version?.name ?? "",
		})),
		dexNumbers: (species?.pokemondexnumbers ?? []).map((dn: any) => ({
			number: dn.pokedex_number,
			dexName: dn.pokedex?.pokedexnames?.[0]?.name ?? "",
		})),
		moves: (() => {
			const byMoveId = new Map<
				number,
				{
					level: number;
					learnMethods: Set<string>;
					move: {
						id: number;
						name: string;
					};
				}
			>();
			for (const m of primaryForm?.pokemonmoves ?? []) {
				const moveId = m.move.id;
				const method = m.movelearnmethod.movelearnmethodnames?.[0]?.name ?? "";
				const key = `${method}:${m.level}`;
				if (!byMoveId.has(moveId)) {
					byMoveId.set(moveId, {
						level: m.level,
						learnMethods: new Set([key]),
						move: {
							id: moveId,
							name: m.move.movenames?.[0]?.name ?? "",
						},
					});
				} else {
					byMoveId.get(moveId)!.learnMethods.add(key);
				}
			}
			return Array.from(byMoveId.values()).map((entry) => ({
				move: entry.move,
				learnMethods: Array.from(entry.learnMethods).map((key) => {
					const colonIdx = key.indexOf(":");
					return {
						name: key.slice(0, colonIdx),
						level: Number(key.slice(colonIdx + 1)),
					};
				}),
			}));
		})(),
	};

	debug("Caching Pokemon detail:", {
		cacheKey,
		name: pokemon.name,
	});
	setCachedValue(cacheKey, pokemon, POKEMON_DETAIL_CACHE_TTL_MS);
	return pokemon;
}

export async function getPokemonList(language: string) {
	const cacheKey = `pokemon:all:${language}`;
	const cached = getCachedValue<any>(cacheKey);

	if (cached) {
		debug("Cache hit for Pokemon list:", {
			cacheKey,
			count: cached.length,
		});
		return cached;
	}

	debug("Cache miss for Pokemon list, querying GraphQL:", cacheKey);

	const data = await queryGraphql<any>(POKEMON_LIST_QUERY, {
		language,
	});

	const pokemon = data.pokemonspeciesname.map((item: any) => ({
		id: item.pokemon_species_id,
		name: item.name,
		generationId: item.pokemonspecy?.generation_id ?? null,
		sprite:
			item.pokemonspecy?.pokemons?.[0]?.pokemonsprites?.[0]?.sprites?.front_default ?? null,
		types: (item.pokemonspecy?.pokemons?.[0]?.pokemontypes ?? []).map((t: any) => t.type.name),
	}));

	debug("Caching Pokemon list:", {
		cacheKey,
		count: pokemon.length,
	});
	setCachedValue(cacheKey, pokemon, POKEMON_LIST_CACHE_TTL_MS);
	return pokemon;
}

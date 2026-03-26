import {
	debug,
	getCachedValue,
	normalizeFlavorText,
	queryGraphql,
	setCachedValue,
} from "./utilities";

const MOVE_DETAIL_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 2; // 2 days
const MOVE_LIST_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const MOVE_DETAIL_QUERY = `
	query MoveDetail($id: Int!, $language: String!, $generationId: Int!) {
		move(where: { id: { _eq: $id } }) {
			generation_id
			accuracy
			power
			pp
			priority
			move_effect_chance
			type {
				name
				typenames(where: { language: { name: { _eq: $language } } }) {
					name
				}
			}
			movedamageclass {
				movedamageclassnames(where: { language: { name: { _eq: $language } } }) {
					name
				}
			}
			movetarget {
				movetargetnames(where: { language: { name: { _eq: $language } } }) {
					name
				}
			}
			movenames(where: { language: { name: { _eq: $language } } }) {
				name
			}
			moveflavortexts(
				where: { language: { name: { _eq: $language } } }
				order_by: { version_group_id: desc }
			) {
				flavor_text
				versiongroup {
					generation_id
				}
			}
			moveeffect {
				moveeffecteffecttexts(where: { language: { name: { _eq: $language } } }) {
					effect
					short_effect
				}
			}
			movemeta {
				crit_rate
				drain
				flinch_chance
				healing
				min_hits
				max_hits
				stat_chance
				movemetaailment {
					movemetaailmentnames(where: { language: { name: { _eq: $language } } }) {
						name
					}
				}
			}
			movechanges(order_by: { version_group_id: desc }) {
				versiongroup {
					generation_id
				}
				power
				accuracy
				pp
				move_effect_chance
				type {
					name
					typenames(where: { language: { name: { _eq: $language } } }) {
						name
					}
				}
			}
			machines(where: { versiongroup: { generation_id: { _eq: $generationId } } }) {
				machine_number
				item {
					itemnames(where: { language: { name: { _eq: $language } } }) {
						name
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

const MOVE_LIST_QUERY = `
	query MoveList($language: String!) {
		movename(
			where: { language: { name: { _eq: $language } } }
			order_by: { move_id: asc }
		) {
			name
			move_id
			move {
				type {
					name
				}
				movedamageclass {
					movedamageclassnames(where: { language: { name: { _eq: $language } } }) {
						name
					}
				}
			}
		}
	}
`;

/**
 * Fetches and shapes move detail data for a given move ID, generation, and language.
 * Includes core stats, type, damage class, target, localized name, flavor text,
 * mechanical meta data, TM/HM info (filtered by generation), and the list of
 * Pokémon that learn this move in that generation (deduplicated by species).
 * Results are cached for 1 hour per (id, language, generation) combination.
 */
export async function getMoveDetail(id: string, selectedGeneration: number, language: string) {
	const cacheKey = `move:${id}:${language}:${selectedGeneration}`;
	debug("Fetching Move detail:", {
		id,
		selectedGeneration,
		language,
		cacheKey,
	});
	const cached = getCachedValue<any>(cacheKey);

	if (cached) {
		debug("Cache hit for Move detail:", cacheKey);
		return cached;
	}

	const data = await queryGraphql<any>(MOVE_DETAIL_QUERY, {
		id: Number(id),
		language,
		generationId: selectedGeneration,
	});

	const raw = data.move[0];
	if (!raw) throw new Error(`Move ${id} not found`);

	const flavorText = normalizeFlavorText(raw.moveflavortexts?.[0]?.flavor_text ?? "");
	const meta = raw.movemeta ?? null;

	const seen = new Set<number>();
	const pokemon = [];
	for (const pm of raw.pokemonmoves ?? []) {
		const speciesId = pm.pokemon?.pokemonspecy?.id ?? null;
		if (speciesId !== null && seen.has(speciesId)) continue;
		if (speciesId !== null) seen.add(speciesId);
		pokemon.push({
			speciesId,
			name:
				pm.pokemon?.pokemonspecy?.pokemonspeciesnames?.[0]?.name ??
				pm.pokemon?.name ??
				"Unknown",
			sprite: pm.pokemon?.pokemonsprites?.[0]?.sprites?.front_default ?? null,
			types: (pm.pokemon?.pokemontypes ?? []).map((t: any) => ({
				name: t.type.typenames?.[0]?.name ?? "",
				slug: t.type.name,
			})),
			level: pm.level,
			learnMethod: pm.movelearnmethod?.movelearnmethodnames?.[0]?.name ?? "",
		});
	}

	// Pick the most recent movechanges entry that applies to selectedGeneration.
	// movechanges are ordered desc by version_group_id, so the first one whose
	// generation_id <= selectedGeneration represents the stats at that point in time.
	const historicChange =
		(raw.movechanges ?? []).find(
			(c: any) => (c.versiongroup?.generation_id ?? 0) <= selectedGeneration,
		) ?? null;

	const effectChance = historicChange?.move_effect_chance ?? raw.move_effect_chance ?? null;
	const replacePlaceholder = (text: string | null) =>
		effectChance !== null && text
			? text.replace(/\$[^\s%]+(%?)/g, (_, pct) => `${effectChance}${pct}`)
			: text;

	const move = {
		id,
		language,
		selectedGeneration,
		name: raw.movenames?.[0]?.name ?? "Unknown",
		generationId: raw.generation_id ?? null,
		accuracy: historicChange?.accuracy ?? raw.accuracy ?? null,
		power: historicChange?.power ?? raw.power ?? null,
		pp: historicChange?.pp ?? raw.pp ?? null,
		priority: raw.priority ?? 0,
		effectChance,
		typeSlug: historicChange?.type?.name ?? raw.type?.name ?? null,
		typeName:
			historicChange?.type?.typenames?.[0]?.name ?? raw.type?.typenames?.[0]?.name ?? null,
		damageClass: raw.movedamageclass?.movedamageclassnames?.[0]?.name ?? null,
		target: raw.movetarget?.movetargetnames?.[0]?.name ?? null,
		flavorText,
		shortEffect: replacePlaceholder(
			raw.moveeffect?.moveeffecteffecttexts?.[0]?.short_effect ?? null,
		),
		effect: replacePlaceholder(raw.moveeffect?.moveeffecteffecttexts?.[0]?.effect ?? null),
		meta: meta
			? {
					critRate: meta.crit_rate ?? 0,
					drain: meta.drain ?? 0,
					flinchChance: meta.flinch_chance ?? 0,
					healing: meta.healing ?? 0,
					minHits: meta.min_hits ?? null,
					maxHits: meta.max_hits ?? null,
					statChance: meta.stat_chance ?? 0,
					ailment: meta.movemetaailment?.movemetaailmentnames?.[0]?.name ?? null,
				}
			: null,
		machines: Array.from(
			new Map(
				(raw.machines ?? []).map((m: any) => [
					m.machine_number,
					{
						number: m.machine_number,
						name: m.item?.itemnames?.[0]?.name ?? null,
					},
				]),
			).values(),
		),
		pokemon,
	};

	debug("Caching Move detail:", {
		cacheKey,
		name: move.name,
	});
	setCachedValue(cacheKey, move, MOVE_DETAIL_CACHE_TTL_MS);

	return move;
}

export async function getMoveList(language: string) {
	const cacheKey = `move:all:${language}`;
	const cached = getCachedValue<any>(cacheKey);

	if (cached) {
		debug("Cache hit for move list:", {
			cacheKey,
			count: cached.length,
		});
		return cached;
	}

	const data = await queryGraphql<any>(MOVE_LIST_QUERY, {
		language,
	});

	const moves = data.movename.map((item: any) => ({
		id: item.move_id,
		name: item.name,
		typeSlug: item.move?.type?.name ?? null,
		damageClass: item.move?.movedamageclass?.movedamageclassnames?.[0]?.name ?? null,
	}));

	debug("Caching move list:", {
		cacheKey,
		count: moves.length,
	});
	setCachedValue(cacheKey, moves, MOVE_LIST_CACHE_TTL_MS);
	return moves;
}

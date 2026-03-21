import { ALL_TYPES } from "$lib/type-effectiveness";

export function load({ url }: { url: URL }) {
	const raw = url.searchParams.get("types") ?? "";
	const selected = raw
		.split(",")
		.map((t) => t.trim().toLowerCase())
		.filter((t) => ALL_TYPES.includes(t))
		.slice(0, 2);

	return { selected };
}

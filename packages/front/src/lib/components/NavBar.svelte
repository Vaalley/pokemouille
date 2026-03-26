<script lang="ts">
	import ThemeSelector from './ThemeSelector.svelte';
	import LanguageSelector from './LanguageSelector.svelte';
	import GenerationSelector from './GenerationSelector.svelte';
</script>

<nav class="flex gap-4 items-center p-4 border-b-2 w-full">
	<a class="text-3xl" href="/" title="Pokémouille">
		Pokémouille
	</a>
	<ThemeSelector />
	<LanguageSelector />
	<GenerationSelector />
	<a class="border-2 px-3 py-1 hover:bg-gray-50" href="/types">Types</a>
</nav>
<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getSavedLanguage,
		languages,
		setLanguage,
		type Language,
	} from '$lib/language';

	let language = $state<Language>('en');

	function handleChange() {
		setLanguage(language);
	}

	onMount(() => {
		language = getSavedLanguage();
	});
</script>

<form>
	<label for="languages">Choose a language:</label>
	<select id="languages" name="languages" bind:value={language} onchange={handleChange}>
		{#each languages as item}
			<option value={item.code}>{item.label}</option>
		{/each}
	</select>
</form>

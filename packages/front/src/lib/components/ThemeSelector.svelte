<script lang="ts">
	import { onMount } from 'svelte';
	import { getSavedTheme, setTheme, type Theme } from '$lib/theme';

	let theme = $state<Theme>('system');

	function handleChange() {
		setTheme(theme);
	}

	onMount(() => {
		theme = getSavedTheme();
	});
</script>

<form class="border-2 p-2">
	<label for="themes">Choose a theme:</label>
	<select id="themes" name="themes" bind:value={theme} onchange={handleChange}>
		<option value="light">Light</option>
		<option value="dark">Dark</option>
		<option value="system">System</option>
	</select>
</form>

<script>
	import { page } from '$app/stores';
</script>

<main class="card container mx-auto flex min-h-screen flex-col items-center justify-center">
	<div class="card p-5 text-center">
		<h1 class="h1">{$page.status}: {$page.error.message}</h1>
		<p>Something went wrong on our server. We're working on it!</p>
		<p>
			It may be an issue from PokeAPI, you can check their server status here: <a
				class="anchor"
				href="https://pokeapi.statuspage.io/"
				target="_blank"
				rel="noopener noreferrer">PokeAPI</a
			>
		</p>
	</div>
</main>

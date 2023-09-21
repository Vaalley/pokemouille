<script>
	import { page } from '$app/stores';
</script>

<main class="container mx-auto flex min-h-screen flex-col items-center justify-center">
	<h1 class="h1">{$page.status}: {$page.error.message}</h1>
	<p>Something went wrong on our server. We're working on it!</p>
</main>

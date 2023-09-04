<script>
	import { Drawer, LightSwitch } from '@skeletonlabs/skeleton';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';
	import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	import { initializeStores } from '@skeletonlabs/skeleton';
	import '../app.css';

	inject({ mode: dev ? 'development' : 'production' });

	storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

	initializeStores();
</script>

<Drawer />
<LightSwitch class="absolute right-10 top-10 scale-125" />
<slot />

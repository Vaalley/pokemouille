import { sveltekit } from '@sveltejs/kit/vite';

const config = {
	plugins: [sveltekit()],
	server: {
		fs: {
			// Add specific folders that are outside of the serving list
			allow: ['..']
		}
	}
};

export default config;

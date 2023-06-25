/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			screens: {
				// '-2xl': { max: '1439px' },
				'-xl': { max: '1279px' },
				'-lg': { max: '1023px' },
				'-md': { max: '767px' },
				'-sm': { max: '639px' }
			},
			fontFamily: {
				hind: ['Hind', 'sans-serif']
			}
		}
	},
	plugins: []
};

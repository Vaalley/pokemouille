# Choix d'une bibliothèque de composants UI pour Pokémouille

> Recherche faite le 15/10/2026. Sources primaires uniquement : métadonnées du registre npm (`https://registry.npmjs.org/<pkg>`), tarballs npm inspectés localement (hors dépôt), API GitHub (dépôts, releases, issues), documentation officielle.
> Les dates de publication sont les horodatages UTC du registre npm, au format JJ/MM/AAAA.
> Convention : tout ce qui n'est pas marqué est un **fait sourcé**. Les déductions et avis sont marqués **[INFERENCE]**.
> Aucun paquet n'a été installé dans le projet et aucun fichier autre que ce document n'a été modifié.

## 1. Résumé

- **Choix proposé : Bits UI (`bits-ui` 2.19.5), une bibliothèque headless, avec notre propre CSS, sans Tailwind.** Elle est native Svelte 5 (runes) et ne déclare aucun peer sur `@sveltejs/kit` ni sur `vite`. Elle fournit `Command`, avec groupes et `LinkItem`, ce qui correspond à notre recherche. Son `Select` gère les groupes. Elle est très active (5 releases entre le 08/09/2026 et le 03/10/2026).
- **Alternative sérieuse : Ark UI Svelte (`@ark-ui/svelte` 5.24.3).** C'est la seule candidate sans aucun peer transitif sur Kit. Elle expose une API i18n explicite (`translations`, `LocaleProvider`) et chaque composant documente sa conformité au motif WAI-ARIA correspondant. En contrepartie, l'arbre de dépendances est lourd (89 paquets) et une version majeure 6.0 est en préversion, avec des changements cassants.
- **Troisième option, avec réserves : Melt (`melt` 0.44.0).** Elle utilise le `<dialog>` natif (`showModal`), ce qui rejoint notre approche actuelle. En revanche, elle est encore en 0.x, n'a pas publié depuis le 04/01/2026 et son `Select` ne gère pas les groupes.
- Le **seul risque de compatibilité concret avec SvelteKit 3.1** pour Bits UI est indirect. Sa dépendance `runed@0.35.1` déclare un peer _optionnel_ `@sveltejs/kit@^2.21.0`. Bits UI n'importe pas le sous-module concerné (`runed/kit`), ce qui a été vérifié dans le tarball. On s'attend donc à un avertissement à l'installation, pas à une panne **[INFERENCE, à confirmer au smoke test]**.
- **Restent natifs :** sélecteurs de jeu et de forme (`<select>`/`<optgroup>`), tableaux, `<dl>`, `<details>`, liens, régions `aria-live`. Le `<dialog>` natif de la recherche reste aussi en place. Seul son combobox/listbox écrit à la main _peut_ être remplacé par `Command`, et uniquement si le smoke test d'accessibilité montre au moins la parité.

## 2. Contexte projet pertinent (vérifié dans le dépôt)

- `apps/website/package.json` : `@sveltejs/kit ^3.1.0`, `svelte ^5.57.1`, `@sveltejs/vite-plugin-svelte ^7.3.1`, `vite: catalog:`.
- `pnpm-workspace.yaml` :
  - `vite` est aliasé vers `npm:@voidzero-dev/vite-plus-core@1.2.0`, avec `overrides: vite@*: catalog:` ;
  - `peerDependencyRules.allowAny: [vite]` et `allowedVersions: vite: "*"` ;
  - `nodeLinker: hoisted` ;
  - `minimumReleaseAgeExclude: ["@sveltejs/kit@3.1.0"]`.
- Le `package.json` racine déclare `devEngines.packageManager` pnpm `12.11.2`.
- Aucun peer `@sveltejs/kit` n'est donc toléré par les règles actuelles : seul `vite` l'est.
- Surfaces existantes :
  - `SearchDialog.svelte` : `<dialog>` + `showModal()`, input `role="combobox"`, `role="listbox"` avec des options contenant des liens, garde IME (`isComposing`/`keyCode 229`), statut `role="status"` ;
  - `GameSelector.svelte` : `<select>` + `<optgroup>` par génération ;
  - `pokemon/FormSelector.svelte` : `<select>` ;
  - `pokemon/Facts.svelte` : `<details>`.
- Référence Kit 3.1.0 (publiée le 14/10/2026) : peerDependencies `vite ^8.0.12`, `svelte ^5.57.1`, `@sveltejs/vite-plugin-svelte ^7.0.0`, `typescript ^6.0.0` (optionnel) [registre npm].

## 3. Tableau comparatif

Les colonnes « peerDependencies » reproduisent le champ `peerDependencies` de la version `latest` dans le registre npm. « Arbre » compte les paquets uniques obtenus en résolvant récursivement les `dependencies` (versions max satisfaisantes, hors peers) : c'est un indicateur d'empreinte à l'installation, pas la taille du bundle.

| Bibliothèque                                                        | Dernière version (date)                          | peerDependencies déclarées                                         | Peer Kit / Vite (transitif)                                                | Runes                                              | Tailwind                           | Style                                                  | Licence    | Taille décompressée / arbre                       | Verdict                                                                |
| ------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------- | ------------------------------------------------------ | ---------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| **Bits UI** `bits-ui`                                               | 2.19.5 (03/10/2026)                              | `svelte ^5.33.0`, `@internationalized/date ^3.8.1`                 | `runed@0.35.1` → `@sveltejs/kit ^2.21.0` **(optionnel)** ; aucun peer vite | Natif                                              | Non                                | Headless, sans styles                                  | MIT        | 2,03 Mo / 13 paquets                              | **N°1**                                                                |
| **Ark UI** `@ark-ui/svelte`                                         | 5.24.3 (05/10/2026) ; 6.0.0-next.0 (06/10/2026)  | `svelte >=5.20.0` (6.0-next : `>=5.29.0`)                          | Aucun                                                                      | Natif                                              | Non                                | Headless                                               | MIT        | 1,45 Mo / 89 paquets                              | **N°2**                                                                |
| **Melt** `melt` (nouvelle génération)                               | 0.44.0 (04/01/2026)                              | `svelte ^5.30.1`, `@floating-ui/dom ^1.6.0`                        | Aucun (`runed@0.23.4` : svelte seul)                                       | Natif                                              | Non                                | Headless (builders)                                    | MIT        | 387 Ko / 27 paquets                               | **N°3** (réserves)                                                     |
| shadcn-svelte `shadcn-svelte` (CLI)                                 | 1.7.0 (16/09/2026)                               | `svelte ^5.0.0`                                                    | Code généré fondé sur Bits UI, donc même point `runed`                     | Natif                                              | **Oui, v4**                        | Code stylé copié dans le projet                        | MIT        | 939 Ko (CLI)                                      | Variante stylée de Bits, à retenir seulement si on adopte Tailwind     |
| Skeleton `@skeletonlabs/skeleton-svelte` + `@skeletonlabs/skeleton` | 5.0.1 (19/08/2026)                               | `svelte ^5.40.0` ; `@skeletonlabs/skeleton` : `tailwindcss ^4.0.0` | Aucun                                                                      | Natif                                              | **Oui, v4**                        | Stylé (design system + thèmes) ; composants sur Zag.js | MIT        | 526 Ko / 61 paquets                               | Écarté (Tailwind obligatoire)                                          |
| Flowbite Svelte `flowbite-svelte`                                   | 1.33.1 (07/04/2026) ; 2.0.0-next.14 (02/04/2026) | `svelte ^5.40.0`, `tailwindcss ^4.1.4`                             | Aucun                                                                      | Natif                                              | **Oui, ≥ 4.1.4**                   | Stylé                                                  | MIT        | 1,35 Mo / 34 paquets                              | Écarté                                                                 |
| daisyUI `daisyui`                                                   | 5.7.50 (13/10/2026)                              | aucune                                                             | Aucun                                                                      | Sans objet (CSS)                                   | **Plugin Tailwind** (CDN possible) | Classes CSS seulement, aucun JS                        | MIT        | 2,82 Mo ; CSS complet 1 142 434 o (≈ 100 Ko gzip) | Écarté pour les composants ; envisageable comme couche CSS si Tailwind |
| Carbon `carbon-components-svelte`                                   | 0.113.1 (08/10/2026)                             | **aucune**                                                         | Aucun                                                                      | **Non** (syntaxe Svelte 4 `on:click`, mode legacy) | Non                                | Stylé IBM Carbon                                       | Apache-2.0 | 5,49 Mo ; `white.css` 561 637 o (≈ 66 Ko gzip)    | Écarté                                                                 |
| SVAR `@svar-ui/svelte-core`                                         | 2.6.1 (01/09/2026)                               | aucune                                                             | Aucun                                                                      | Natif (`$props()`)                                 | Non                                | Stylé                                                  | MIT        | 218 Ko / 5 paquets                                | Écarté (ARIA quasi absent)                                             |
| SMUI `@smui/*`                                                      | 9.0.6 (14/10/2026)                               | aucune (sur `@smui/common`, `@smui/select`)                        | Aucun                                                                      | v8+ exige Svelte 5 (README)                        | Non (Sass)                         | Material Design                                        | Apache-2.0 | 780 Ko (`common`)                                 | Écarté (esthétique Material imposée, Sass)                             |

### Projets écartés car abandonnés, dépréciés ou incompatibles (une ligne chacun)

- `@melt-ui/svelte` 0.86.6 (28/03/2025) : ancienne API à stores, peer `svelte ^3 || ^4 || ^5.0.0-next.118`, dernier commit du dépôt le 30/09/2025. Remplacé par `melt`.
- `@rgossiaux/svelte-headlessui` 2.0.0 (11/06/2023) : peer `svelte ^3.47.0`.
- `svelte-headlessui` 0.0.46 (26/01/2025) : aucune release depuis.
- `sveltestrap` 5.11.3 (23/12/2023, peer `svelte ^3.53.1`). Son successeur `@sveltestrap/sveltestrap` 7.1.0 (04/02/2025) n'a rien publié depuis.
- `stwui` 0.21.2-next (12/01/2024) : peer `@sveltejs/kit ^2.3.2`, `svelte ^4.2.8`.
- `attractions` 3.7.2 : dépréciée sur npm, peer `svelte ^3.31.0`.
- `svelte-5-ui-lib` 0.12.6 : dépréciée sur npm (« Package no longer supported »).
- `wx-svelte-core` : dépréciée, renommée `@svar-ui/svelte-core`.
- `@huntabyte/primitives` 0.0.19 (17/08/2023) : peer `svelte ^4.0.0`.
- `svelte-ux` 1.0.11 (20/08/2026) : peer `svelte ^3.56.0 || ^4.0.0 || ^5.0.0`. La v2 (2.0.0-next.26, 12/08/2026) est encore en préversion et repose sur Tailwind via `@layerstack/tailwind`.

## 4. Fiches détaillées

### 4.1 Bits UI — `bits-ui`

**Version et maintenance.**

- 2.19.5 publiée le 03/10/2026 ; précédentes : 2.19.4 (01/10), 2.19.3 (22/09), 2.19.2 (09/09), 2.19.1 (08/09/2026).
- Dépôt `huntabyte/bits-ui` : dernier commit le 03/10/2026, 3 612 étoiles, 96 issues ouvertes.

**Svelte 5 et peers.**

- Peers : `svelte ^5.33.0` (5.57 accepté) et `@internationalized/date ^3.8.1`. Ce dernier est non optionnel ; il sera auto-installé, `autoInstallPeers` étant à `true` par défaut dans pnpm.
- Aucun peer `vite` ni `@sveltejs/kit` direct.
- Dépendance `runed ^0.35.1`, résolue en 0.35.1. Celle-ci déclare `svelte ^5.7.0` et `@sveltejs/kit ^2.21.0`, ce dernier marqué optionnel dans `peerDependenciesMeta`.
- Le seul code de runed qui importe `$app/*` est `dist/utilities/use-search-params/…`, exposé via `runed/kit`. Une recherche dans le tarball de bits-ui 2.19.5 ne trouve aucun import de `runed/kit` ni de `useSearchParams`.
- Côté runed, la PR #432 « feat!: support SvelteKit 3 » est ouverte depuis le 05/10/2026 ; elle passera le peer à `^3.0.0`. L'issue #428 documente l'incompatibilité de `useSearchParams` avec le `goto` de Kit 3.
- Le caret 0.x de bits-ui (`^0.35.1` = `>=0.35.1 <0.36.0`) ne prendra pas automatiquement une future version de runed compatible Kit 3 **[INFERENCE : l'avertissement persistera tant que bits-ui ne remonte pas cette plage]**.

**Style.**

- La doc d'introduction indique : « Most components ship completely unstyled… No CSS resets, no design system assumptions ». Le stylage passe par `class` et les attributs `data-*`.
- Tailwind n'est pas requis : il n'apparaît dans aucun peer.

**Accessibilité.**

- La doc revendique la conformité WAI-ARIA, la navigation clavier et la gestion du focus.
- Constaté dans le code publié :
  - `Command.Input` porte `role: "combobox"` et `aria-autocomplete: "list"` ; `Command.List` porte `role: "listbox"` avec un `aria-label` fourni par une option (prop `label`) ;
  - `Dialog.Content` porte `role: "dialog"` et `aria-modal: "true"`. C'est un `div` porté (portal), **pas** un `<dialog>` natif ;
  - `Select` utilise `role: "combobox"` + `aria-activedescendant`, et dispose des parties `Select.Group` et `Select.GroupHeading` ;
  - garde IME dans `Command` : `if (!e.isComposing && e.keyCode !== 229)`, avec un commentaire mentionnant explicitement l'IME japonais et Safari.
- Problèmes connus (GitHub, ouverts au 15/10/2026) :
  - #2151, « Combobox should not steal Home/End keys from the input box » (14/09/2026). `Command` a le même comportement : `kbd.HOME` et `kbd.END` font `preventDefault()` et déplacent la sélection ;
  - #1858, « Select Component: Keyboard focus vanishes when selected + reopened » (23/10/2025) ;
  - #2200, focus d'un menu dont le déclencheur a aussi une infobulle (12/10/2026).
- Correctifs récents : `id` rendu sur les contenus Popper pour que `aria-describedby` fonctionne (2.19.2), rôles de `Menu.GroupHeading`/`Separator` (2.19.1), garde IME de `Select` (PR #2082, fermée le 30/06/2026).
- `Command` active par défaut `vimBindings` : Ctrl+N/J/P/K naviguent dans la liste. Cela peut entrer en conflit avec notre raccourci Ctrl/Cmd+K à l'intérieur du champ **[INFERENCE ; désactivable via `vimBindings={false}`]**.

**SSR et prérendu.** La doc ne prévoit rien de spécifique à `adapter-static`. Les contenus portés (Dialog, Select) ne sont rendus qu'à l'ouverture **[INFERENCE : comme nos panneaux sont déjà rendus côté client, aucun impact attendu sur le prérendu ; à vérifier au smoke test]**.

**Couverture de nos surfaces.**

- `Command` (Input, List, Group, GroupHeading, Item, **LinkItem** qui rend un `<a>`, Empty, Loading) avec `shouldFilter={false}` pour garder notre propre index de recherche.
- `Dialog`, `Select` avec groupes, `Combobox`, `Tabs`, `Tooltip`, `Accordion`, `Collapsible`, `Toggle Group`, `Pagination`.
- Pas de composant tableau ni badge : ce n'est pas l'objectif d'une bibliothèque headless.

**i18n.**

- Les libellés passent par des props (`label`, `placeholder`…).
- Seule chaîne anglaise codée en dur trouvée dans le tarball : `"aria-label": "Previous"` dans `calendar`, un composant que nous n'utilisons pas.

**Bundle.** 2,03 Mo décompressé, 13 paquets dans l'arbre. Dépendances : `@floating-ui/*`, `tabbable`, `runed`, `svelte-toolbelt`, `esm-env`.

**Vite 8.** La PR #2125, « chore: migrate to Vitest 5 and Vite 8 », est ouverte depuis le 04/09/2026 **[INFERENCE : la CI de bits-ui ne tourne pas encore sur Vite 8 / Rolldown]**. L'issue #1972 (erreur TDZ avec `manualChunks`, sous Vite 5) est toujours ouverte.

### 4.2 Ark UI Svelte — `@ark-ui/svelte` (Zag.js)

**Version et maintenance.**

- 5.24.3 (05/10/2026), 5.24.2 (13/09/2026), 5.24.1 (28/08/2026) ; préversion 6.0.0-next.0 (06/10/2026).
- Les notes de la 6.0 annoncent un changement cassant Svelte : les exports `Dialog` sont renommés (`DialogPositioner`, etc.).
- Dépôts `chakra-ui/ark` et `chakra-ui/zag` : derniers commits le 15/10/2026 ; respectivement 7 et 23 issues ouvertes.

**Peers.**

- `svelte >=5.20.0`, et rien d'autre. Dans l'arbre complet, le seul autre peer est `@zag-js/svelte` → `svelte >=5`.
- Aucun peer Kit ni Vite.
- Le `package.json` du tarball liste en devDependencies `svelte 5.57.1` et `typescript 6.0.3`, les mêmes que nous.
- La PR Renovate #4167, qui passait le dépôt Ark à Kit 3, a été fermée **sans merge** le 06/10/2026 **[INFERENCE : leur site de démo Svelte n'est pas encore sur Kit 3 ; aucun impact sur nos peers]**.

**Style.** « Unstyled, accessible UI components » (description du paquet). Pas de Tailwind.

**Accessibilité.**

- La doc Combobox indique : « Complies with the Combobox WAI-ARIA design pattern ».
- Table clavier documentée ; Home/End déplacent vers la première/dernière option quand la liste est ouverte, comme Bits.
- Zag ignore les touches pendant une composition IME (`isComposingEvent(event)` dans `combobox.connect`).
- Composants disponibles : `select` avec `select-item-group`/`-label`, `combobox` avec groupes, `dialog`, `tabs`, `tooltip`, `collapsible`, `accordion`, `listbox`, `toggle-group`, `pagination`, `toc`, `hotkeys`.

**i18n.**

- Prop `translations` documentée sur Combobox. Les valeurs par défaut sont en anglais (`triggerLabel: "Toggle suggestions"`, `clearTriggerLabel: "Clear value"`) et surchargeables.
- `LocaleProvider` : sans provider, la locale par défaut est `en-US` (doc « Locale »).

**Liens.** Les items peuvent être rendus comme liens (`asChild`) et la prop `navigate` sert à brancher le routeur (doc Combobox, section « Router Links »).

**Bundle.** 1,45 Mo décompressé ; 69 dépendances directes `@zag-js/*`, 89 paquets dans l'arbre. `sideEffects: false` **[INFERENCE : le tree-shaking limite le coût réel aux composants importés ; à mesurer]**.

### 4.3 Melt (nouvelle génération) — `melt`

**Version et maintenance.**

- 0.44.0 (04/01/2026), 0.43.0 (02/01/2026), 0.42.0 (18/11/2025).
- Dépôt `melt-ui/next-gen` : dernier commit le 04/03/2026 ; 333 étoiles, 33 issues.

**Peers.** `svelte ^5.30.1` et `@floating-ui/dom ^1.6.0`. Aucun peer Kit ni Vite.

**Point d'attention :** `jest-axe ^9.0.0` figure dans les `dependencies` d'exécution, ce qui donne 27 paquets dans l'arbre.

**Modèle.** Builders en classes (`new Toggle({...})`, à étaler avec `{...toggle.trigger}`) ou composants avec snippets (doc « How to use »). Landing page : « The next generation of Melt UI. Built for Svelte 5. »

**Accessibilité et couverture.**

- Builders disponibles : Accordion, Avatar, Collapsible, Combobox, Dialog, FileUpload, PinInput, Popover, Progress, RadioGroup, Select, Slider, SpatialMenu, Tabs, Toaster, Toggle, Tooltip, Tree.
- `Dialog` utilise `el.showModal()` : c'est un `<dialog>` natif.
- Aucune notion de groupe dans `Select.svelte.js` : pas d'équivalent à `<optgroup>`.

**Risque.** Pas de version 1.0 et cadence ralentie (aucune release depuis plus de 9 mois) **[INFERENCE : maintenance incertaine]**.

### 4.4 shadcn-svelte — `shadcn-svelte`

**Version et maintenance.** 1.7.0 (16/09/2026), 1.6.1 (04/09), 1.6.0 (01/09), 1.5.1 (27/08/2026). Dépôt : dernier commit le 15/10/2026, 9 189 étoiles.

**Modèle.** Une CLI copie dans le projet des composants stylés, construits sur Bits UI. Le guide SvelteKit commence par `sv create my-app --add tailwindcss`, et la page « Tailwind v4 » précise : « Only new projects start with Tailwind v4 ». Tailwind v4 est donc de fait obligatoire.

**Kit 3.**

- 1.6.0 ajoute la détection automatique de l'alias `#lib` (PR #2862 ; l'issue #2849 « SvelteKit 3 support » est fermée depuis le 01/09/2026).
- La documentation mentionne encore `svelte.config.js` et `$lib`. La PR de mise à jour #2864 et l'issue #2917 sont ouvertes.
- L'issue #2915 (ouverte le 06/10/2026) signale que `add form` échoue sur Kit 3, parce que `sveltekit-superforms@2.31.0` déclare un peer `@sveltejs/kit "1.x || 2.x"`.

### 4.5 Skeleton — `@skeletonlabs/skeleton-svelte` 5.0.1 (19/08/2026)

- Peer `svelte ^5.40.0`. Le paquet CSS `@skeletonlabs/skeleton` 5.0.1 déclare un peer `tailwindcss ^4.0.0`.
- Le tableau des prérequis de la doc SvelteKit indique : SvelteKit ≥ 2, Svelte ≥ 5, Tailwind ≥ 4.
- Composants construits sur Zag.js 1.43.0 (combobox, dialog, listbox, tabs, tooltip, collapsible, pagination…). La doc défend une approche « Native-First » qui privilégie les éléments HTML sémantiques.
- Dépôt : dernier commit sur `main` le 28/08/2026.
- **Écarté** : Tailwind est imposé et un design system complet serait à adopter.

### 4.6 Flowbite Svelte — `flowbite-svelte` 1.33.1 (07/04/2026)

- Peers `svelte ^5.40.0` et `tailwindcss ^4.1.4`.
- Dépendances d'exécution : `apexcharts`, `date-fns`, `flowbite`, `tailwind-merge`, `tailwind-variants` (34 paquets dans l'arbre).
- Aucune release `latest` depuis 6 mois ; la 2.0 est en `next` depuis le 02/04/2026 ; dernier commit le 27/06/2026.
- Constaté dans le code :
  - `Dialog` utilise un `<dialog>` natif (`showModal`) ;
  - `Select` enveloppe un `<select>` natif ;
  - `CommandPalette` (`role="combobox"`, `aria-activedescendant`) a des valeurs par défaut en anglais, surchargeables : `placeholder = "Type a command or search keywords ..."`, `emptyMessage = "No results found."` ;
  - plusieurs `aria-label` anglais sont codés en dur : `"Clear search value"` (Input, Search, Select…), `"Copy"`, `"Delete"`, `"Calendar"`, `"Scroll spy navigation"`.
- Le site de documentation a renvoyé **HTTP 429** lors de la consultation : non lu.
- **Écarté** : Tailwind obligatoire, chaînes anglaises en dur, cadence ralentie.

### 4.7 daisyUI — `daisyui` 5.7.50 (13/10/2026)

- Aucun peer, aucune dépendance. Installation documentée comme plugin Tailwind (« You need Node.js and Tailwind CSS installed »), ou via CDN avec des fichiers CSS séparés.
- CSS complet servi par jsDelivr : 1 142 434 octets, environ 100 Ko en gzip (mesure locale). Le plugin Tailwind n'émet que les classes utilisées **[INFERENCE]**.
- **Ne fournit aucun JS** : toute l'accessibilité interactive (combobox, focus, clavier) reste à notre charge **[INFERENCE : n'apporte rien sur nos exigences a11y ; ce n'est qu'une option de style]**.

### 4.8 Carbon Components Svelte — `carbon-components-svelte` 0.113.1 (08/10/2026)

- Très actif : 0.113.0 le 02/10/2026, plusieurs rétroportages le 08/10, dernier commit le 15/10/2026.
- **Aucun `peerDependencies`.**
- `scripts.postinstall: "ibmtelemetry --config=telemetry.yml"`. Le README précise : « By installing this package as a dependency you are agreeing to telemetry collection ».
- Composants écrits en syntaxe Svelte 4 (`on:click` dans `DataTable.svelte`), donc exécutés en mode legacy sous Svelte 5. La branche `master` est développée avec `svelte ^5.57.1`.
- `aria-label` anglais codés en dur : `"Select all rows"`, `"Select row"`, `"Search"`, `"Select Page number"`.
- **Écarté** : télémétrie, absence de runes, esthétique IBM, chaînes anglaises en dur.

### 4.9 SVAR — `@svar-ui/svelte-core` 2.6.1 (01/09/2026)

- Aucun peer. Runes natives (`$props()` dans `Combo.svelte`). Locales fournies, dont `fr` et `ja` (`@svar-ui/core-locales`).
- **Seulement 3 occurrences de `aria-*` et 4 de `role` dans tout le code source.** Aucune dans `Combo.svelte`, `Modal.svelte`, `Select.svelte` ni `RichSelect.svelte`.
- **Écarté** : notre exigence de parité clavier et lecteur d'écran n'est pas couverte.

### 4.10 SMUI — `@smui/*` 9.0.6 (14/10/2026)

- Le README indique que la v8+ exige Svelte 5 et que la v9 s'est détachée de MDC-Web. Licence Apache-2.0. Aucun peer `svelte` déclaré.
- **Écarté** : design Material et thème Sass imposés, sans rapport avec un projet sans framework CSS.

## 5. Recommandation

### 5.1 Classement

1. **Bits UI : choix proposé.**
   - Pour : runes natives ; aucune CSS imposée, ce qui permet de garder `app.css` et de rester sans Tailwind ; `Command` + `LinkItem` correspond presque exactement à notre recherche (liens, groupes, garde IME japonais) ; `Select` avec groupes ; cadence de releases élevée. Le chemin vers shadcn-svelte reste ouvert si un jour on adopte Tailwind **[INFERENCE]**.
   - Contre : peer optionnel transitif `@sveltejs/kit ^2` via runed ; bugs a11y ouverts (#2151 Home/End, #1858 focus du Select) ; `Dialog` n'utilise pas le `<dialog>` natif ; CI pas encore sur Vite 8.
2. **Ark UI : alternative.**
   - Pour : aucun peer Kit ; API `translations`/`LocaleProvider` explicite, utile pour fr/ja ; conformité APG documentée composant par composant ; même socle Zag pour React, Vue et Solid, donc plus de surface de test **[INFERENCE]** ; très actif, peu d'issues ouvertes.
   - Contre : 89 paquets installés ; majeure 6.0 en préversion avec renommages cassants (migration prévisible à court terme) ; API pensée pour plusieurs frameworks, moins idiomatique Svelte **[INFERENCE]** ; libellés par défaut en anglais à surcharger systématiquement.
3. **Melt : à éviter pour l'instant.**
   - Pour : `<dialog>` natif, empreinte faible, idiomatique Svelte 5.
   - Contre : 0.x, aucune release depuis le 04/01/2026, pas de groupes dans `Select`, `jest-axe` en dépendance d'exécution.

**Choix suggéré : Bits UI**, à condition que le smoke test du § 5.3 passe. En cas d'échec (avertissement bloquant, régression d'accessibilité ou build Vite+ cassé), basculer sur **Ark UI 5.x**, en prévoyant la migration vers la 6.0. Cette décision engage la base technique : elle doit être validée par un humain avant toute installation.

### 5.2 Ce qui migre et ce qui reste natif

| Surface                                                                                                            | Fichier                              | Décision                                                                                                                 | Justification                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modale de recherche (conteneur)                                                                                    | `SearchDialog.svelte`                | **Reste native** (`<dialog>` + `showModal()`)                                                                            | Top layer, `inert` implicite et Échap natifs. `Dialog` de Bits est un `div` porté avec `aria-modal` : rien à y gagner **[INFERENCE]**                                                                                                               |
| Combobox et résultats de recherche                                                                                 | `SearchDialog.svelte`                | **Migration conditionnelle** vers `Command` (`shouldFilter={false}`, `LinkItem`, `label` traduit, `vimBindings={false}`) | Gain : moins de code clavier écrit à la main. Risques : Home/End capturés (#2151 et code de `Command`), et `aria-expanded="true"` toujours actif sur l'input de `Command`. Ne migrer que si NVDA/VoiceOver et l'IME japonais sont au moins à parité |
| Sélecteur de jeu (~41 options en `<optgroup>`)                                                                     | `GameSelector.svelte`                | **Reste natif**                                                                                                          | Picker natif sur mobile, groupes compris par tous les lecteurs d'écran, aucun JS nécessaire. Le `Select` de Bits a un bug de focus ouvert (#1858) **[INFERENCE pour l'appréciation]**                                                               |
| Sélecteur de forme                                                                                                 | `pokemon/FormSelector.svelte`        | **Reste natif**                                                                                                          | Mêmes raisons                                                                                                                                                                                                                                       |
| Sélecteur de langue, précédent/suivant, lien d'évitement                                                           | `LanguageSwitcher.svelte`, layouts   | **Restent natifs** (liens)                                                                                               | Aucune interactivité composite                                                                                                                                                                                                                      |
| Tableaux (stats, learnset), `<dl>`, badges, notices, `aria-live`                                                   | `pokemon/*.svelte`                   | **Restent natifs** + CSS maison                                                                                          | Les bibliothèques headless ne fournissent ni tableaux ni badges                                                                                                                                                                                     |
| Divulgation                                                                                                        | `pokemon/Facts.svelte` (`<details>`) | **Reste natif**                                                                                                          | Fonctionne sans JS dans les pages prérendues                                                                                                                                                                                                        |
| Futures surfaces (onglets du learnset par méthode, infobulles d'efficacité de type, popovers, groupes de bascules) | —                                    | **Bits UI** (`Tabs`, `Tooltip`, `Popover`, `ToggleGroup`)                                                                | C'est là que la bibliothèque apporte une vraie valeur (motifs APG complexes) **[INFERENCE]**                                                                                                                                                        |

### 5.3 Risques de compatibilité avec SvelteKit 3.1 à couvrir par un smoke test

À faire dans une branche jetable, avant toute adoption :

1. **Peers à l'installation** (`pnpm add bits-ui`) : vérifier le message pnpm sur `runed@0.35.1` → `@sveltejs/kit@^2.21.0`, peer optionnel non satisfait par 3.1.0.
   - D'après la doc pnpm, `strictPeerDependencies` vaut `false` par défaut, donc ce ne sera qu'un avertissement **[INFERENCE pour le message exact]**.
   - Si l'on veut le faire taire, la doc pnpm documente une règle ciblée : `peerDependencyRules.allowedVersions: { "runed>@sveltejs/kit": "3" }`. À n'ajouter qu'après avoir confirmé que `runed/kit` n'est jamais importé.
2. **`minimumReleaseAge`** : le projet a déjà dû exclure `@sveltejs/kit@3.1.0`. Vérifier que les versions de bits-ui, runed et svelte-toolbelt choisies sont assez anciennes pour la politique en vigueur **[INFERENCE : politique d'âge minimal active par défaut dans ce pnpm]**.
3. **Build Vite+ (Rolldown) et prérendu** : faire un build complet avec `adapter-static` (3 langues × 1 025 pages). Vérifier l'absence d'accès à `window`/`document` à l'import (`esm-env` est utilisé) et l'absence d'erreur TDZ du type de #1972 lors du découpage en chunks par Rolldown.
4. **Hydratation** : aucune erreur ni avertissement d'hydratation sur une page espèce prérendue qui monte `Command` dans le `<dialog>` natif. Vérifier aussi que les portals restent désactivés ou sans effet dans ce cas **[INFERENCE : `Command` n'utilise pas de portal]**.
5. **`svelte-check` sous TypeScript 6 / `$app/tsconfig`** : les types de bits-ui doivent compiler sans erreur.
6. **Accessibilité, critère bloquant** :
   - NVDA + Firefox/Chrome et VoiceOver iOS/macOS sur la recherche (annonce des options, nombre de résultats via notre `role="status"`, Échap, retour du focus, Ctrl/Cmd+K, ouverture en tapant) ;
   - IME japonais sous Safari et Chrome ;
   - Home/End dans le champ ;
   - cibles tactiles.
7. **Poids** : comparer le JS client avant et après dans la sortie de build. Seul `unpackedSize` est connu ici ; le coût réel du bundle n'a pas été mesuré.
8. **Si Ark UI est retenu** : mêmes étapes 3 à 7 ; utiliser 5.24.x et pas `6.0.0-next` ; fournir `translations` en fr/ja.
9. **Si shadcn-svelte est envisagé plus tard** : tester `init` sur Kit 3 (pas de `svelte.config.js`, alias `#lib`) et éviter `add form` tant que l'issue #2915 est ouverte.

### 5.4 Inconnues

- Taille réelle du bundle client par composant, pour toutes les candidates : non mesurée, faute d'installation.
- Comportement réel de pnpm 12.11.2 face au peer optionnel de runed : non observé.
- Documentation Flowbite Svelte non lue (HTTP 429).
- Résultats d'audits d'accessibilité indépendants (tests avec lecteurs d'écran) des bibliothèques : aucune source primaire trouvée. Seules les déclarations des docs et le code publié ont été examinés.

### 5.5 Résultat de l'installation et de la migration complète (15/10/2026)

Installé via `vp add -D --filter website bits-ui @internationalized/date` (`bits-ui` 2.19.5 et `@internationalized/date` 3.12.4 ajoutés au catalog), puis adopté sur l'ensemble des surfaces interactives :

- **Composants migrés :** `SearchDialog` (`Dialog`, `Command`, `Button`, `Label`), `GameSelector` et `FormSelector` (`Select`, `Label`), `Learnset` (`Tabs`), `Facts` (`Collapsible`), `Stats` (`Meter`), et bouton de réessai (`Button`).
- **Politique d'âge :** aucune exclusion supplémentaire nécessaire.
- **`vp why runed` :** `runed@0.35.1` est tiré par `bits-ui@2.19.5` et `svelte-toolbelt@0.10.6`.
- **`pnpm peers check` :** un seul écart signalé, `runed@0.35.1` demande `@sveltejs/kit ^2.21.0` alors que `3.1.0` est installé. Aucune règle de masquage n'a été ajoutée dans `pnpm-workspace.yaml` (conformément au plan §8).
- **Coût JS client mesuré :** la migration de toutes les surfaces ajoute un chunk partagé d'environ 128 Ko brut (38,8 Ko gzip) et fait passer le nœud layout `/[lang]` de 12,4 Ko (5,4 Ko gzip) à 44,8 Ko (13,1 Ko gzip) et le nœud fiche Pokémon de 26,8 Ko (8,3 Ko gzip) à 44,6 Ko (12,8 Ko gzip), soit ~51 Ko gzip supplémentaires au total. `Select` remplace aussi le sélecteur natif sur mobile.
- **Vérifications :** `vp check`, `vp test` (83 tests), `svelte-check` et `vp run -r build` passent sans erreur ni avertissement.

## 6. Sources (consultées le 15/10/2026)

**Registre npm** (version `latest`, `time`, `peerDependencies`, `peerDependenciesMeta`, `dependencies`, `license`, `dist.unpackedSize`) :

- https://registry.npmjs.org/bits-ui
- https://registry.npmjs.org/runed
- https://registry.npmjs.org/svelte-toolbelt
- https://registry.npmjs.org/@internationalized%2Fdate
- https://registry.npmjs.org/shadcn-svelte
- https://registry.npmjs.org/melt
- https://registry.npmjs.org/@melt-ui%2Fsvelte
- https://registry.npmjs.org/@ark-ui%2Fsvelte
- https://registry.npmjs.org/@zag-js%2Fsvelte
- https://registry.npmjs.org/@skeletonlabs%2Fskeleton
- https://registry.npmjs.org/@skeletonlabs%2Fskeleton-svelte
- https://registry.npmjs.org/flowbite-svelte
- https://registry.npmjs.org/daisyui
- https://registry.npmjs.org/carbon-components-svelte
- https://registry.npmjs.org/@svar-ui%2Fsvelte-core
- https://registry.npmjs.org/wx-svelte-core
- https://registry.npmjs.org/@smui%2Fcommon
- https://registry.npmjs.org/@smui%2Fselect
- https://registry.npmjs.org/svelte-ux
- https://registry.npmjs.org/@layerstack%2Ftailwind
- https://registry.npmjs.org/svelte-headlessui
- https://registry.npmjs.org/@rgossiaux%2Fsvelte-headlessui
- https://registry.npmjs.org/sveltestrap
- https://registry.npmjs.org/@sveltestrap%2Fsveltestrap
- https://registry.npmjs.org/stwui
- https://registry.npmjs.org/attractions
- https://registry.npmjs.org/svelte-5-ui-lib
- https://registry.npmjs.org/@huntabyte%2Fprimitives
- https://registry.npmjs.org/@sveltejs%2Fkit
- https://registry.npmjs.org/svelte
- https://registry.npmjs.org/vite
- https://registry.npmjs.org/@sveltejs%2Fvite-plugin-svelte
- https://registry.npmjs.org/tailwindcss
- https://registry.npmjs.org/@tailwindcss%2Fvite
- https://registry.npmjs.org/@voidzero-dev%2Fvite-plus-core

**Tarballs inspectés** (code publié : rôles ARIA, chaînes codées en dur, imports `$app/*`, scripts) :

- https://registry.npmjs.org/bits-ui/-/bits-ui-2.19.5.tgz
- https://registry.npmjs.org/runed/-/runed-0.35.1.tgz
- https://registry.npmjs.org/melt/-/melt-0.44.0.tgz
- https://registry.npmjs.org/@ark-ui/svelte/-/svelte-5.24.3.tgz
- https://registry.npmjs.org/@zag-js/combobox/-/combobox-1.45.0.tgz
- https://registry.npmjs.org/@skeletonlabs/skeleton-svelte/-/skeleton-svelte-5.0.1.tgz
- https://registry.npmjs.org/flowbite-svelte/-/flowbite-svelte-1.33.1.tgz
- https://registry.npmjs.org/carbon-components-svelte/-/carbon-components-svelte-0.113.1.tgz
- https://registry.npmjs.org/@svar-ui/svelte-core/-/svelte-core-2.6.1.tgz
- https://registry.npmjs.org/@svar-ui/core-locales/-/core-locales-2.6.1.tgz

**Mesures CSS** (taille brute et gzip calculée localement) :

- https://cdn.jsdelivr.net/npm/daisyui@5.7.50/daisyui.css
- https://cdn.jsdelivr.net/npm/carbon-components-svelte@0.113.1/css/white.css

**Documentation officielle :**

- Bits UI :
  - https://bits-ui.com/docs/introduction
  - https://bits-ui.com/docs/components/command
  - https://bits-ui.com/docs/components/select
- shadcn-svelte :
  - https://shadcn-svelte.com/docs/installation
  - https://shadcn-svelte.com/docs/installation/sveltekit
  - https://shadcn-svelte.com/docs/migration/tailwind-v4
- Melt :
  - https://next.melt-ui.com/
  - https://next.melt-ui.com/guides/how-to-use
- Ark UI :
  - https://ark-ui.com/docs/components/combobox
  - https://ark-ui.com/docs/utilities/locale
- Skeleton :
  - https://www.skeleton.dev/docs/svelte/get-started/introduction
  - https://www.skeleton.dev/docs/svelte/get-started/installation/sveltekit
- daisyUI :
  - https://daisyui.com/docs/install/
  - https://daisyui.com/docs/cdn/
- Flowbite Svelte : https://flowbite-svelte.com/docs/pages/introduction (**inaccessible, HTTP 429**)
- pnpm :
  - https://pnpm.io/settings/peer-dependencies (`autoInstallPeers`, peers optionnels, `strictPeerDependencies`, `peerDependencyRules.allowedVersions`)

**GitHub** (dépôts, releases, issues et PR) :

- Dépôts :
  - https://github.com/huntabyte/bits-ui
  - https://github.com/huntabyte/shadcn-svelte
  - https://github.com/melt-ui/melt-ui
  - https://github.com/melt-ui/next-gen
  - https://github.com/chakra-ui/ark
  - https://github.com/chakra-ui/zag
  - https://github.com/skeletonlabs/skeleton
  - https://github.com/themesberg/flowbite-svelte
  - https://github.com/saadeghi/daisyui
  - https://github.com/carbon-design-system/carbon-components-svelte
  - https://github.com/svar-widgets/core
  - https://github.com/hperrin/svelte-material-ui
  - https://github.com/techniq/svelte-ux
  - https://github.com/svecosystem/runed
- Releases :
  - https://github.com/huntabyte/bits-ui/releases
  - https://github.com/huntabyte/shadcn-svelte/releases
  - https://github.com/melt-ui/next-gen/releases
  - https://github.com/chakra-ui/ark/releases
  - https://github.com/skeletonlabs/skeleton/releases
  - https://github.com/themesberg/flowbite-svelte/releases
  - https://github.com/carbon-design-system/carbon-components-svelte/releases
- runed :
  - https://github.com/svecosystem/runed/pull/432
  - https://github.com/svecosystem/runed/issues/428
- bits-ui :
  - https://github.com/huntabyte/bits-ui/issues/2151
  - https://github.com/huntabyte/bits-ui/issues/1858
  - https://github.com/huntabyte/bits-ui/issues/2200
  - https://github.com/huntabyte/bits-ui/issues/1972
  - https://github.com/huntabyte/bits-ui/pull/2125
  - https://github.com/huntabyte/bits-ui/pull/2082
- shadcn-svelte :
  - https://github.com/huntabyte/shadcn-svelte/issues/2849
  - https://github.com/huntabyte/shadcn-svelte/pull/2862
  - https://github.com/huntabyte/shadcn-svelte/pull/2864
  - https://github.com/huntabyte/shadcn-svelte/issues/2915
  - https://github.com/huntabyte/shadcn-svelte/issues/2917
- Ark : https://github.com/chakra-ui/ark/pull/4167
- Télémétrie IBM (référencée par le README de Carbon) : https://github.com/ibm-telemetry/telemetry-js

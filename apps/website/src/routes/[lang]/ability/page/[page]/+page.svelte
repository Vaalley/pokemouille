<script lang="ts">
  import ResourceCatalogue from "#lib/components/ResourceCatalogue.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<ResourceCatalogue lang={data.lang} catalogue={data.catalogue} />

<script lang="ts">
  import HomeCatalogue from "#lib/components/HomeCatalogue.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<HomeCatalogue {data} />

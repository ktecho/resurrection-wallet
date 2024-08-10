<script lang="ts">
  import { onMount } from "svelte";
  import { setupStore } from "$lib/setupStore";
  import { startPhoenixd, stopPhoenixd, phoenixBinaryExists } from "$lib/utils";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { info, error } from '@tauri-apps/plugin-log';
  import MainScreen from "$lib/components/MainScreen.svelte";
  import PhoenixdInstall from "$lib/components/PhoenixdInstall.svelte";

  let phoenixdExists = false;
  let phoenixdRunning = false;
  let checking = true;

  let bitcoinNetwork = "mainnet";

  async function handleSetupComplete() {
    phoenixdExists = true;
    phoenixdRunning = await startPhoenixd(bitcoinNetwork, 3000);
  }

  onMount(async () => {
    info("Starting Resurrection Wallet...");
    await setupStore.load();

    // Load saved settings from the store
    setupStore.subscribe((store) => {
      const savedNetwork = store.find(([key]) => key === "bitcoinNetwork");
      if (savedNetwork) bitcoinNetwork = savedNetwork[1] as string;
    });

    try {
      phoenixdExists = await phoenixBinaryExists();

      if (phoenixdExists) {
        phoenixdRunning = await startPhoenixd(bitcoinNetwork, 3000);
      }
    } catch (e) {
      console.error("Error while searching for or starting phoenixd:", e);
      error("Error while searching for or starting phoenixd");
    } finally {
      checking = false;
    }

    const unlistenOnClose = await getCurrentWindow().onCloseRequested(
      async (event) => {
          // prevent the default window close behavior
          event.preventDefault();

          await stopPhoenixd();

          unlistenOnClose();
          getCurrentWindow().close();
      },
    );
  });
</script>

{#if checking}
  <div class="flex justify-center items-center h-screen">
    <p class="text-xl">Checking configuration...</p>
  </div>
{:else if !phoenixdExists}
  <PhoenixdInstall on:setupComplete={handleSetupComplete} />
{:else if !phoenixdRunning}
  <div class="flex justify-center items-center h-screen">
    <p class="text-xl">Starting phoenixd...</p>
  </div>
{:else}
  <MainScreen />
{/if}

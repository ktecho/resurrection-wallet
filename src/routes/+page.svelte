<script lang="ts">
  import { onMount } from "svelte";
  import { exists } from "@tauri-apps/plugin-fs";
  import { Command } from "@tauri-apps/plugin-shell";
  import MainScreen from "$lib/components/MainScreen.svelte";
  import PhoenixdInstall from "$lib/components/PhoenixdInstall.svelte";

  let phoenixdExists = false;
  let phoenixdRunning = false;
  let checking = true;

  async function startPhoenixd() {
    console.log("Starting phoenixd...");
    try {
      // Kill the current phoenixd process
      await Command.create("exec-sh", ["-c", "pkill phoenixd"]).execute();

      Command.create("exec-sh", ["-c", "binaries/phoenixd"]).execute();

      phoenixdRunning = true;

    } catch (e) {
      console.error("Error starting phoenixd:", e);
    }
  }

  async function handleSetupComplete() {
    phoenixdExists = true;
    await startPhoenixd();
  }

  onMount(async () => {
    try {
      phoenixdExists = await exists("binaries/phoenixd");

      if (phoenixdExists) {
        await startPhoenixd();
      }
    } catch (e) {
      console.error("Error while searching for or starting phoenixd:", e);
    } finally {
      checking = false;
    }
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

<script>
    import { createEventDispatcher } from 'svelte';
    import { invoke } from "@tauri-apps/api/core";
    import { download } from '@tauri-apps/plugin-upload';
    import { Command } from "@tauri-apps/plugin-shell";
  
    const dispatch = createEventDispatcher();
  
    let selectedOption = null;
    let downloadProgress = 0;
    let downloadComplete = false;
    let error = null;
  
    async function handleOptionSelect(option) {
      selectedOption = option;
      if (option === 'download') {
        try {
          await download_install_phoenixd();
          dispatch('setupComplete');
        } catch (e) {
          error = `Error downloading phoenixd: ${e}`;
        }
      }
    }

    async function download_install_phoenixd() {
        downloadProgress = 10;

        await download(
            "https://github.com/ACINQ/phoenixd/releases/download/v0.3.0/phoenix-0.3.0-linux-x64.zip",
            "downloads/phoenixd.zip",
        );
        downloadProgress = 30;


        await Command.create("exec-sh", [
            "-c",
            "unzip downloads/phoenixd.zip",
        ]).execute();
        downloadProgress = 50;

        await Command.create("exec-sh", [
            "-c",
            "cp phoenix-0.3.0-linux-x64/* binaries/",
        ]).execute();
        downloadProgress = 70;

        let installed = await Command.create("exec-sh", [
            "-c",
            "rm -rf downloads/* ; rm -rf phoenix-0.3.0-linux-x64",
        ]).execute();

        downloadProgress = 100;
        await new Promise(resolve => setTimeout(resolve, 1000));

        downloadComplete = true;
    }
  </script>
  
  <div class="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
    <h1 class="text-2xl font-bold mb-4 text-center">Resurrection Wallet - Initial Setup</h1>
  
    <p class="mb-4 text-center">Resurrection Wallet is a frontend for the Phoenixd Lightning node, so it needs the phoenixd binary to function.</p>
    
    {#if error}
      <p class="text-red-500 text-center mb-4">{error}</p>
    {/if}
  
    <div class="flex flex-col space-y-4">
      <button
        class="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        on:click={() => handleOptionSelect('download')}
        disabled={selectedOption === 'download' && !downloadComplete}
      >
        Automatically download and install phoenixd (recommended)
      </button>
      <button
        class="py-2 px-4 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
        on:click={() => handleOptionSelect('manual')}
      >
        Use manually installed phoenixd
      </button>
    </div>
  
    {#if selectedOption === 'download' && !downloadComplete}
      <div class="mt-4">
        <p class="text-center mb-2">Downloading phoenixd...</p>
        <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div class="bg-blue-600 h-2.5 rounded-full" style="width: {downloadProgress}%"></div>
        </div>
      </div>
    {:else if selectedOption === 'manual'}
      <p class="mt-4 text-center">Please ensure that phoenixd is correctly installed on your system and listening on http://127.0.0.1:9740.</p>
      <button
        class="mt-4 w-full py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
        on:click={() => dispatch('setupComplete')}
      >
        I have manually installed phoenixd
      </button>
    {/if}
  </div>
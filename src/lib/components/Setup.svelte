<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { get_node_info } from "$lib/phoenixdApi";
  import { Command } from "@tauri-apps/plugin-shell";
    import NoWorkResult from "postcss/lib/no-work-result";

  export let selectedFiat = "USD";
  let selectedNetwork = "";
  $: isLoading = false;
  let nodeInfo = null;

  const dispatch = createEventDispatcher();

  let fiatCurrencies = [
    { code: "USD", symbol: "$" },
    { code: "EUR", symbol: "€" },
    { code: "GBP", symbol: "£" },
    { code: "JPY", symbol: "¥" },
  ];

  function saveFiatSelection() {
    dispatch("fiatChange", { selectedFiat });
  }

  $: console.log("isLoading:", isLoading);

  async function changeNetwork() {
    isLoading = true;

    try {
      // Kill the current phoenixd process
      await Command.create("exec-sh", ["-c", "pkill phoenixd"]).execute();

      // Start phoenixd with the new network parameter
      Command.create("exec-sh", ["-c", `binaries/phoenixd --chain=${selectedNetwork}`]).execute();

      // Wait a bit for the process to start up
      await new Promise((resolve) => setTimeout(resolve, 3000));

      await get_node_info_and_set_network();
      isLoading = false;

    } catch (e) {
      console.error("Error changing network:", e);
    } finally {
      console.log("SALIENDO POR EL FINALLY DE CHANGENETWORK");
      console.log("Before setting isLoading to false:", isLoading);
      try {
        isLoading = false;
      } catch (error) {
        console.error("Error setting isLoading to false:", error);
      }
      console.log("After setting isLoading to false:", isLoading);
    }
  }

  async function get_node_info_and_set_network() {
    try {
      nodeInfo = await get_node_info();
      selectedNetwork = nodeInfo.chain;
      console.log("nodeInfo:", nodeInfo);
    } catch (e) {
      console.error("Error fetching node info:", e);
    }
  }

  onMount(async () => {
    isLoading = true;

    try {
      await get_node_info_and_set_network();
    } finally {
      isLoading = false;
    }
  });
</script>

<div
  class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full"
  id="my-modal"
>
  <div
    class="relative top-20 mx-auto p-5 border w-3/4 max-w-3xl shadow-lg rounded-md bg-white"
  >
    <div class="mt-3">
      <h3 class="text-lg leading-6 font-medium text-gray-900 text-center">
        Setup
      </h3>

      <div class="mt-4 px-7 py-3">
        <label
          for="fiat-currency"
          class="block text-sm font-medium text-gray-700"
          >Select Fiat Currency</label
        >
        <select
          id="fiat-currency"
          bind:value={selectedFiat}
          on:change={saveFiatSelection}
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {#each fiatCurrencies as currency}
            <option value={currency.code}
              >{currency.symbol} {currency.code}</option
            >
          {/each}
        </select>
      </div>

      <hr class="my-6" />

      <div class="mt-4 px-7 py-3">
        <label for="network" class="block text-sm font-medium text-gray-700"
          >Select Network</label
        >
        <select
          id="network"
          bind:value={selectedNetwork}
          on:change={() => changeNetwork()}
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="mainnet">Mainnet</option>
          <option value="testnet">Testnet</option>
        </select>
      </div>

      <hr class="my-6" />

      <div class="px-7">
        <h4 class="text-md font-medium text-gray-900 mb-4">Node Information</h4>

        {#if nodeInfo}
          <div class="space-y-2 mb-6">
            <div><strong>Node ID:</strong> {nodeInfo.nodeId}</div>
            <div><strong>Block Height:</strong> {nodeInfo.blockHeight}</div>
            <div><strong>Network:</strong> {nodeInfo.chain}</div>
            <div><strong>Phoenixd Version:</strong> {nodeInfo.version}</div>
          </div>

          <h5 class="text-md font-medium text-gray-900 mb-2">Channels</h5>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >State</th
                  >
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >Channel ID</th
                  >
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >Balance (sat)</th
                  >
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >Inbound Liquidity (sat)</th
                  >
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >Capacity (sat)</th
                  >
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each nodeInfo.channels as channel}
                  <tr>
                    <td
                      class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >{channel.state}</td
                    >
                    <td
                      class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >{channel.channelId}</td
                    >
                    <td
                      class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >{channel.balanceSat}</td
                    >
                    <td
                      class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >{channel.inboundLiquiditySat}</td
                    >
                    <td
                      class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >{channel.capacitySat}</td
                    >
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <p class="text-gray-500">No node information available</p>
        {/if}

        {#if isLoading}
          <div
            class="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center"
          >
            <div
              class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"
            ></div>
          </div>
        {/if}
      </div>

      <div class="items-center px-4 py-3 mt-6">
        <button
          id="ok-btn"
          class="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          on:click={() => dispatch("close")}
        >
          Close
        </button>
      </div>
    </div>
  </div>
</div>

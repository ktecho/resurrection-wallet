<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { getVersion } from "@tauri-apps/api/app";
  import { setupStore } from "$lib/setupStore";
  import { get_node_info } from "$lib/phoenixdApi";
  import { startPhoenixd, copyToClipboard } from "$lib/utils";
  import { fiatCurrencies } from "$lib/currency";

  export let selectedFiat = "USD";
  let bitcoinNetwork = "mainnet";
  let isLoading = false;
  let nodeInfo = null;
  let appVersion = null;

  let showBalanceInFiat = true;
  let showTransactionsInFiat = false;

  const dispatch = createEventDispatcher();

  function saveFiatSelection() {
    setupStore.update((store) => {
      const newStore = store.filter(([key]) => key !== "selectedFiat");
      newStore.push(["selectedFiat", selectedFiat]);
      return newStore;
    });

    dispatch("fiatChange", { selectedFiat });
  }

  function saveDisplayPreferences() {
    setupStore.update((store) => {
      const newStore = store.filter(
        ([key]) =>
          !["showBalanceInFiat", "showTransactionsInFiat"].includes(key),
      );
      newStore.push(["showBalanceInFiat", showBalanceInFiat]);
      newStore.push(["showTransactionsInFiat", showTransactionsInFiat]);
      return newStore;
    });

    dispatch("displayPreferencesChange", {
      showBalanceInFiat,
      showTransactionsInFiat,
    });
  }

  async function changeNetwork() {
    isLoading = true;

    try {
      await startPhoenixd(bitcoinNetwork);

      await getNodeInfo();

      setupStore.update((store) => {
        const newStore = store.filter(([key]) => key !== "bitcoinNetwork");
        newStore.push(["bitcoinNetwork", bitcoinNetwork]);
        return newStore;
      });
    } catch (e) {
      console.error("Error changing network:", e);
    } finally {
      isLoading = false;
    }
  }

  async function getNodeInfo() {
    try {
      nodeInfo = await get_node_info();
      console.log("nodeInfo:", nodeInfo);
    } catch (e) {
      console.error("Error fetching node info:", e);
    }
  }

  onMount(async () => {
    isLoading = true;

    try {
      await getNodeInfo();

      appVersion = await getVersion();

      // Load saved settings from the store
      setupStore.subscribe((store) => {
        const savedFiat = store.find(([key]) => key === "selectedFiat");
        if (savedFiat) selectedFiat = savedFiat[1] as string;

        const savedNetwork = store.find(([key]) => key === "bitcoinNetwork");
        if (savedNetwork) bitcoinNetwork = savedNetwork[1] as string;

        const savedShowBalanceInFiat = store.find(
          ([key]) => key === "showBalanceInFiat",
        );
        if (savedShowBalanceInFiat)
          showBalanceInFiat = savedShowBalanceInFiat[1] as boolean;

        const savedShowTransactionsInFiat = store.find(
          ([key]) => key === "showTransactionsInFiat",
        );
        if (savedShowTransactionsInFiat)
          showTransactionsInFiat = savedShowTransactionsInFiat[1] as boolean;
      });
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
        <div><strong>Resurrection Wallet version:</strong> {appVersion}</div>
      </div>

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
            <option value={currency.code}>{currency.code}</option>
          {/each}
        </select>
      </div>

      <div class="mt-4 px-7 py-3">
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={showBalanceInFiat}
            on:change={saveDisplayPreferences}
            class="form-checkbox h-5 w-5 text-indigo-600"
          />
          <span class="ml-2 text-sm text-gray-700"
            >Show balance in fiat currency</span
          >
        </label>
      </div>

      <div class="mt-2 px-7 py-3">
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={showTransactionsInFiat}
            on:change={saveDisplayPreferences}
            class="form-checkbox h-5 w-5 text-indigo-600"
          />
          <span class="ml-2 text-sm text-gray-700"
            >Show transaction amounts in fiat currency</span
          >
        </label>
      </div>

      <hr class="my-6" />

      <div class="mt-4 px-7 py-3">
        <label for="network" class="block text-sm font-medium text-gray-700"
          >Select Network</label
        >
        <select
          id="network"
          bind:value={bitcoinNetwork}
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
                      >{channel.channelId.slice(0, 15)}...
                      <button
                        class="ml-2 text-blue-500 hover:text-blue-700"
                        on:click={() => copyToClipboard(channel.channelId)}
                        title="Copy full Channel ID"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button></td
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

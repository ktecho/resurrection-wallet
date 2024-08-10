<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Setup from "$lib/components/Setup.svelte";
  import {
    formatDate,
    formatAmount,
    truncateString,
    checkAndInstallUpdates,
  } from "$lib/utils";
  import {
    get_balance_sats,
    get_incoming_payments,
    get_outgoing_payments,
    setupPaymentsWebSocket,
  } from "$lib/phoenixdApi";
  import Modal from "./Modal.svelte";
  import Receive from "./Receive.svelte";
  import Send from "./Send.svelte";
  import WebSocket from "@tauri-apps/plugin-websocket";
  import { debug, info, error } from "@tauri-apps/plugin-log";
  import { convertBtcToFiat, getPrefix, getSuffix } from "$lib/currency";
  import { setupStore } from "$lib/setupStore";

  let balanceSats: number = 0;
  let balanceFiat: number = 0;
  let balanceSatsFees: number = 0;

  let allTransactions = [];
  let visibleTransactions: any[] = [];
  let selectedTransaction = null;

  let showModal = false;
  let showSendModal = false;
  let showReceiveModal = false;
  let showSetup = false;
  let showBalanceInFiat = true;
  let showTransactionsInFiat = false;
  let showSatoshis = true;
  let selectedFiat: string = "USD";

  let isRefreshing = false;
  let showNthFirstTransactions = 6;

  let showAllDetails = false;

  let ws: WebSocket;

  function openSetup() {
    showSetup = true;
  }
  function closeSetup() {
    showSetup = false;
    refreshEverything();
  }

  function closeReceiveModal() {
    showReceiveModal = false;
    refreshEverything();
  }

  function closeSendModal() {
    showSendModal = false;
    showAllDetails = false;
    refreshEverything();
  }

  function handleReceive() {
    showReceiveModal = true;
  }

  function handleSend() {
    showSendModal = true;
  }

  async function refreshEverything() {
    isRefreshing = true;

    [balanceSats, balanceSatsFees] = await get_balance_sats();
    const incoming_payments = await get_incoming_payments();
    const outgoing_payments = await get_outgoing_payments();

    if (showBalanceInFiat) {
      const btcAmount = balanceSats / 100000000; // Convert sats to BTC
      balanceFiat = await convertBtcToFiat(btcAmount, selectedFiat);
    }

    isRefreshing = false;

    console.log("incoming_payments", incoming_payments);

    allTransactions = [...incoming_payments, ...outgoing_payments];

    console.debug("allTransactions", allTransactions);
    debug("allTransactions to show: " + JSON.stringify(allTransactions));

    // Order transactions by date, most recent first
    allTransactions.sort((a, b) => b.createdAt - a.createdAt);

    // Asign the first showNthFirstTransactions transactions to visibleTransactions
    visibleTransactions = allTransactions.slice(0, showNthFirstTransactions);
  }

  function loadMoreTransactions() {
    const currentLength = visibleTransactions.length;
    visibleTransactions = allTransactions.slice(
      0,
      currentLength + showNthFirstTransactions,
    );
  }

  function toggleBalanceUnit() {
    showSatoshis = !showSatoshis;
  }

  function handleFiatChange(event) {
    selectedFiat = event.detail.selectedFiat;
    refreshEverything();
  }

  function handleDisplayPreferencesChange(event) {
    showBalanceInFiat = event.detail.showBalanceInFiat;
    showTransactionsInFiat = event.detail.showTransactionsInFiat;
    refreshEverything();
  }

  async function openTransactionDetails(transaction) {
    showModal = true;
    selectedTransaction = transaction;
  }

  function closeModal() {
    showModal = false;
    selectedTransaction = null;
    showAllDetails = false;
  }

  function toggleDetails() {
    showAllDetails = !showAllDetails;
  }

  $: if (balanceSats || selectedFiat) {
    updateFiatBalance();
  }

  async function updateFiatBalance() {
    const btcAmount = balanceSats / 100000000; // Convert sats to BTC
    balanceFiat = await convertBtcToFiat(btcAmount, selectedFiat);
  }

  onMount(async () => {
    await refreshEverything();

    updateFiatBalance();

    ws = await setupPaymentsWebSocket();

    ws.addListener((msg) => {
      if (msg.type !== "Ping" && msg.type !== "Close") {
        console.debug("Received message from phoenixd :", msg);
        refreshEverything();
      }
    });

    checkAndInstallUpdates();

    // Load saved settings from the store
    setupStore.subscribe((store) => {
      const savedFiat = store.find(([key]) => key === "selectedFiat");
      if (savedFiat) selectedFiat = savedFiat[1] as string;

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
  });

  onDestroy(() => {
    if (ws) {
      ws.disconnect();
    }
  });
</script>

<svelte:head>
  <title>Resurrection Wallet</title>
</svelte:head>

<div class="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md relative">
  <button
    on:click={openSetup}
    class="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-6 w-6 text-gray-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  </button>

  <!-- Balance + update balance -->
  <div class="flex flex-col items-center justify-center mb-6">
    <div class="flex items-center">
      <div class="mr-2 text-center">
        <p
          class="text-2xl font-semibold text-gray-800 cursor-pointer"
          on:click={toggleBalanceUnit}
        >
          {#if showSatoshis}
            {balanceSats.toFixed(0)} sats
          {:else}
            {(balanceSats / 100000000).toFixed(8)} BTC
          {/if}
        </p>
        {#if showBalanceInFiat}
          <p class="text-xl text-gray-600">
            {getPrefix(selectedFiat)}{balanceFiat}
            {getSuffix(selectedFiat)}
          </p>
        {/if}
        {#if balanceSatsFees > 0}
          <p class="aatext-lg text-gray-600 mt-2">
            ({balanceSatsFees} sats)
          </p>
        {/if}
      </div>

      <button
        on:click={refreshEverything}
        class="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        title="Refresh"
        disabled={isRefreshing}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 text-gray-600 transform transition-transform duration-1000 ease-in-out {isRefreshing
            ? 'rotate-180'
            : ''}"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
  </div>

  <!-- Send / Receive buttons -->
  <div class="flex flex-col items-center justify-center mb-6">
    <div class="flex justify-center space-x-4 mt-1 w-full">
      <button
        on:click={handleSend}
        class="flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 transition duration-150 ease-in-out"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 mr-2 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
        Send
      </button>
      <button
        on:click={handleReceive}
        class="flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 transition duration-150 ease-in-out"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 mr-2 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Receive
      </button>
    </div>
  </div>

  <h3 class="text-xl font-semibold mb-4 text-gray-800 text-center">
    Recent Transactions
  </h3>

  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th
            scope="col"
            class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >Type</th
          >
          <th
            scope="col"
            class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >Description</th
          >
          <th
            scope="col"
            class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >Amount</th
          >
          <th
            scope="col"
            class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >Date</th
          >
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each visibleTransactions as transaction}
          <tr
            class="cursor-pointer hover:bg-gray-50 transition-colors duration-150 ease-in-out {transaction.isPaid
              ? ''
              : 'bg-gray-100 text-gray-500'}"
            on:click={() => openTransactionDetails(transaction)}
          >
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <span
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {transaction.receivedSat
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'}"
              >
                {transaction.receivedSat ? "Received" : "Sent"}
              </span>
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm text-center {transaction.isPaid
                ? 'font-bold'
                : ''}"
            >
              {truncateString(transaction.description)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
              <span class={transaction.isPaid ? "font-bold" : ""}>
                {transaction.receivedSat
                  ? transaction.receivedSat
                  : transaction.sent} sats
              </span>

              {#if showTransactionsInFiat}
                <span>
                  - {getPrefix(
                    selectedFiat,
                  )}{#await convertBtcToFiat(transaction.receivedSat ? transaction.receivedSat : transaction.sent, selectedFiat, true)}
                    <p>...waiting</p>
                  {:then amountFiat}
                    {amountFiat}
                  {:catch error}
                    <p style="color: red">{error.message}</p>
                  {/await}

                  {getSuffix(selectedFiat)}
                </span>
              {/if}
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm text-center {transaction.isPaid
                ? 'font-bold'
                : ''}"
            >
              {formatDate(transaction.createdAt)}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if visibleTransactions.length < allTransactions.length}
    <div class="mt-4 text-center">
      <button
        on:click={loadMoreTransactions}
        class="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        More
      </button>
    </div>
  {/if}
</div>

{#if showModal && selectedTransaction}
  <Modal on:close={closeModal}>
    <h2 slot="header">
      {#if selectedTransaction.receivedSat}
        {selectedTransaction.isPaid
          ? "Payment Received"
          : "Incoming Transaction"}
      {:else}
        {selectedTransaction.isPaid ? "Payment Sent" : "Outgoing Transaction"}
      {/if}
    </h2>
    <div slot="content" class="grid grid-cols-2 gap-4 mt-8">
      <div>
        <strong>Amount:</strong>
        {formatAmount(
          selectedTransaction.receivedSat
            ? selectedTransaction.receivedSat
            : selectedTransaction.sent,
        )}
      </div>
      <div>
        <strong>Fees:</strong>
        {formatAmount(selectedTransaction.fees, true)}
      </div>
      <div>
        <strong>Created At:</strong>
        {formatDate(selectedTransaction.createdAt)}
      </div>
      <div>
        <strong>Completed At:</strong>
        <span class={selectedTransaction.completedAt ? "" : "text-red-500"}
          >{selectedTransaction.completedAt
            ? formatDate(selectedTransaction.completedAt)
            : "Not completed"}</span
        >
      </div>
      {#if selectedTransaction.description}
        <div class="col-span-2">
          <strong>Description:</strong>
          {selectedTransaction.description}
        </div>
      {/if}

      {#if !showAllDetails}
        <div class="col-span-2 text-sm mt-2">
          <button
            on:click={toggleDetails}
            class="text-blue-500 hover:text-blue-700 underline focus:outline-none"
          >
            (see more)
          </button>
        </div>
      {/if}

      {#if showAllDetails}
        <hr class="my-6 col-span-2" />

        <span class="text-sm text-gray-500 mb-4">Advanced Details</span>

        <div class="col-span-2 text-gray-500 text-sm">
          <strong>Payment Hash:</strong>
          {selectedTransaction.paymentHash}
        </div>
        <div class="col-span-2 text-gray-500 text-sm">
          <strong>Preimage:</strong>
          {selectedTransaction.preimage}
        </div>
        {#if selectedTransaction.invoice}
          <div class="col-span-2 text-gray-500 text-sm">
            <strong>Invoice:</strong>
            <div class="break-all">{selectedTransaction.invoice}</div>
          </div>
        {/if}
        <!--
      {#if selectedTransaction.receivedSat}
        <div class="col-span-2">
          <strong>Payment ID:</strong>
          {selectedTransaction.paymentId}
        </div>
      {:else}
        <div class="col-span-2">
          <strong>External ID:</strong>
          {selectedTransaction.externalId}
        </div>
      {/if}
      -->
      {/if}
    </div>
  </Modal>
{/if}

{#if showSetup}
  <Setup
    {selectedFiat}
    {showBalanceInFiat}
    {showTransactionsInFiat}
    on:close={closeSetup}
    on:fiatChange={handleFiatChange}
    on:displayPreferencesChange={handleDisplayPreferencesChange}
  />
{/if}

{#if showReceiveModal}
  <Receive on:close={closeReceiveModal} />
{/if}

{#if showSendModal}
  <Send on:close={closeSendModal} />
{/if}

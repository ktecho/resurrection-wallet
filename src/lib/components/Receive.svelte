<script>
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import QrCode from "qrcode";
  import {
    create_invoice_bolt11,
    create_offer_bolt12,
    check_payment,
  } from "$lib/phoenixdApi";

  const dispatch = createEventDispatcher();

  let showEditForm = false;
  let description = "";
  let amount = "";
  let serialized = "";
  let qrCodeData = "";
  let paymentType = "bolt11";
  let showTokens = false;
  let paymentHash = "";
  let isMonitoring = false;
  let paymentReceived = false;

  async function generatePaymentRequest(
    type = paymentType,
    description = "",
    amount,
  ) {
    let data = null;

    if (type === "bolt11") {
      let response = await create_invoice_bolt11(description, amount);

      data = response.serialized;
      paymentHash = response.paymentHash;
    } else {
      data = await create_offer_bolt12();
    }

    serialized = data;
    generateQRCode(data);
    showTokens = !!description || !!amount;

    if (type === "bolt11") {
      isMonitoring = true;
      paymentReceived = false;
      monitorPayment();
    }
  }

  async function monitorPayment() {
    while (isMonitoring && !paymentReceived) {
      try {
        const paid = await check_payment(paymentHash);
        if (paid && paid.isPaid) {
          paymentReceived = true;
          isMonitoring = false;
        }
      } catch (error) {
        console.error("Error checking payment:", error);
      }
      if (isMonitoring) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds before checking again
      }
    }
  }

  async function generateQRCode(data) {
    try {
      qrCodeData = await QrCode.toDataURL(data);
    } catch (err) {
      console.error(err);
    }
  }

  function copyToClipboard() {
    navigator.clipboard
      .writeText(serialized)
      .then(() => alert("Copied to clipboard!"))
      .catch((err) => console.error("Error copying text: ", err));
  }

  function handleModifyPayment() {
    generatePaymentRequest(paymentType, description, amount);
    showEditForm = false;
  }

  function handlePaymentTypeChange() {
    generatePaymentRequest(paymentType);
    showTokens = false;
  }

  function closeModal() {
    isMonitoring = false; // Detener el monitoreo
    dispatch("close");
  }

  onMount(() => {
    generatePaymentRequest();
  });

  onDestroy(() => {
    isMonitoring = false; // Asegurarse de que el monitoreo se detenga si el componente se destruye
  });
</script>

<div
  class="fixed z-10 inset-0 overflow-y-auto"
  aria-labelledby="modal-title"
  role="dialog"
  aria-modal="true"
>
  <div
    class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
  >
    <div
      class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
      aria-hidden="true"
    ></div>
    <span
      class="hidden sm:inline-block sm:align-middle sm:h-screen"
      aria-hidden="true">&#8203;</span
    >
    <div
      class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
    >
      <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
        {#if !paymentReceived}
          <h3
            class="text-lg leading-6 font-medium text-gray-900"
            id="modal-title"
          >
            Receive Payment
          </h3>

          <div class="mt-4">
            <select
              bind:value={paymentType}
              on:change={handlePaymentTypeChange}
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="bolt11">Bolt11 invoice</option>
              <option value="bolt12">Bolt12 offer</option>
            </select>
          </div>
          <div class="mt-2 flex items-center justify-center">
            {#if qrCodeData}
              <img src={qrCodeData} alt="QR Code" class="mx-auto" />
            {/if}
            {#if isMonitoring}
              <div class="ml-4">
                <svg
                  class="animate-spin h-5 w-5 text-indigo-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            {/if}
          </div>
          {#if showTokens}
            <div class="mt-2 text-sm text-gray-600">
              {#if description}
                <p><strong>Description:</strong> {description}</p>
              {/if}
              {#if amount}
                <p><strong>Amount:</strong> {amount} sats</p>
              {/if}
            </div>
          {/if}
          <div class="mt-4 flex justify-center space-x-4">
            <button
              on:click={copyToClipboard}
              class="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Copy
            </button>
            {#if paymentType === "bolt11"}
              <button
                on:click={() => (showEditForm = true)}
                class="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Edit
              </button>
            {/if}
          </div>
          {#if showEditForm && paymentType === "bolt11"}
            <div class="mt-4">
              <input
                type="text"
                bind:value={description}
                placeholder="Description (optional, max 128 chars)"
                maxlength="128"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <input
                type="number"
                bind:value={amount}
                placeholder="Amount (optional, in sats)"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <button
                on:click={handleModifyPayment}
                class="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              >
                Modify Payment
              </button>
            </div>
          {/if}
        {:else}
          <div class="mt-4 flex flex-col items-center justify-center">
            <svg
              class="h-52 w-52 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <p class="mt-2 text-xl font-semibold text-gray-900">
              Payment Received!
            </p>
          </div>
        {/if}
      </div>
      <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
        <button
          type="button"
          class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          on:click={closeModal}
        >
          Close
        </button>
      </div>
    </div>
  </div>
</div>

<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { formatDate } from "$lib/utils";
  import { decode_bolt11_invoice, decode_bolt12_offer, pay_bolt11_invoice, get_balance_sats } from "$lib/phoenixdApi";
  import { invoke } from "@tauri-apps/api/core";
  import { listen } from "@tauri-apps/api/event";

  const dispatch = createEventDispatcher();

  let invoiceField = "";
  let decodedData = null;
  let paymentType: string = "";
  let amount: number = 0;
  let message = "";
  let expiryDate = "";
  let showPreviewButton = false;
  let scanning = false;
  let balanceSats = 0;

  function showImage() {
    document.getElementById("qr-image").style.display = "block";
  }
  function hideImage() {
    document.getElementById("qr-image").style.display = "none";
  }

  function showErrorMessage(message: string) {
    document.getElementById("error-message").innerText = message;
  }
  function hideErrorMessage() {
    document.getElementById("error-message").innerText = "";
  }

  async function stopCamera() {
    scanning = false;

    await invoke("stop_camera");

    hideImage();
  }

  async function scanQR() {
    showImage();

    scanning = true;

    const canvas = document.getElementById("qr-image");
    const ctx = canvas.getContext("2d");

    listen("camera-frame", (event) => {
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      };
      img.src = "data:image/jpeg;base64," + event.payload;
    });

    listen("qr-detected", (event) => {
      console.log("QR Code detected:", event.payload);

      hideImage();

      invoiceField = event.payload;

      previewPayment();
    });

    try {
      const resultado = await invoke("start_camera");
      console.log(resultado);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  function closeModal() {
    stopCamera();
    dispatch("close");
  }

  async function handleInputChange() {
    if (invoiceField.includes("@")) {
      paymentType = "Lightning Address";
      showPreviewButton = true;
    } else if (invoiceField.trim() !== "") {
      showPreviewButton = true;
    } else {
      showPreviewButton = false;
    }

    stopCamera();

    previewPayment();
  }

  async function previewPayment() {
    hideErrorMessage();

    if (invoiceField.trim() === "") {
      return;
    }

    if (paymentType !== "Lightning Address") {
      try {
        console.log("Decoding invoice:", invoiceField);
        decodedData = await decode_bolt11_invoice(invoiceField);
        console.log("------------  Decoded invoice:", decodedData);
        paymentType = "BOLT11";
      } catch {
        try {
          decodedData = await decode_bolt12_offer(invoiceField);
          paymentType = "BOLT12";
        } catch {
          showErrorMessage(
            "Invalid input: this is not a Lightning Address, invoice (bolt11) or offer (bolt12).",
          );

          console.error(
            "Invalid input: neither Lightning Address nor BOLT11 nor BOLT12",
          );

          decodedData = null;

          return;
        }
      }
    }

    if (paymentType === "BOLT11") {
      amount = decodedData.amount / 1000;
      message = decodedData.description || "";

      let whenExpires = new Date(
        decodedData.timestampSeconds * 1000 + decodedData.expirySeconds * 1000,
      );
      expiryDate = formatDate(whenExpires);

      if (amount > balanceSats) {
        showErrorMessage("Insufficient funds. Current balance: " + balanceSats);
        return;
      }
    } else if (paymentType === "BOLT12") {
      //      amount = decodedData.amount ? decodedData.amount : '';
      //      message = decodedData.description || '';
    }

    showPreviewButton = false;
  }

  async function payNow() {
    hideErrorMessage();

    console.log("Procesando pago:", { paymentType, amount, message });

    let pay_bolt11_response = await pay_bolt11_invoice(invoiceField, amount);
    console.log("----------------------------  pay_bolt11_response:", pay_bolt11_response);
    console.log("----------------------------  pay_bolt11_response.reason:", pay_bolt11_response.reason);

    if (pay_bolt11_response.hasOwnProperty("reason")) {
      showErrorMessage(pay_bolt11_response.reason);
      console.error("Error paying bolt11 invoice:", pay_bolt11_response);
      return;
    } else {
      console.log("Successfully paid bolt11 invoice:", pay_bolt11_response);

      closeModal();
    }

    onMount(async () => {
      balanceSats, balanceSatsFees = await get_balance_sats();
    });
}
</script>

<div
  class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full"
  id="my-modal"
>
  <div
    class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
  >
    <div class="mt-3 text-center">
      <h3 class="text-lg leading-6 font-medium text-gray-900">Send Payment</h3>
      <div id="qrDiv" width="600px"></div>

      <div class="mt-2 px-7 py-3">
        <p class="text-sm mb-4">
          Paste bolt11 invoices, bolt12 offers, or Lightning addresses here:
        </p>
        <input
          type="text"
          class="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
          placeholder="Paste the invoice here"
          bind:value={invoiceField}
          on:input={handleInputChange}
        />

        {#if decodedData || paymentType === "Lightning Address"}
          <div class="mt-8">
            <div class="mb-4">
              <label
                for="amount"
                class="block text-sm font-medium text-gray-700 mb-1"
                >Amount (sats)</label
              >
              <input
                id="amount"
                type="text"
                class="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none text-center"
                placeholder="Enter amount"
                bind:value={amount}
              />
            </div>

            {#if paymentType === "BOLT11"}
              <div class="mb-4">
                <label
                  for="message"
                  class="block text-sm font-medium text-gray-700 mb-1"
                  >Message</label
                >
                <input
                  id="message"
                  type="text"
                  class="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none text-center"
                  placeholder="Enter message"
                  bind:value={message}
                  readonly
                />
              </div>
            {/if}

            {#if paymentType === "BOLT11"}
              <div class="mb-4">
                <label
                  for="expiry"
                  class="block text-sm font-medium text-gray-700 mb-1"
                  >Expiry Date</label
                >
                <input
                  id="expiry"
                  type="text"
                  class="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none text-center"
                  value={expiryDate}
                  readonly
                />
              </div>
            {/if}

            <button
              on:click={payNow}
              class="w-full bg-green-500 text-white active:bg-green-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
              type="button"
              disabled={amount > balanceSats}
            >
              Send Payment
            </button>
          </div>
        {/if}
      </div>
    </div>

    <canvas class="w-64 mx-auto hidden" id="qr-image"></canvas>
    <p class="text-sm text-red-600 mb-2 mx-auto text-center" id="error-message"></p>

    <div class="px-1 pt-3 pb-1 sm:flex sm:flex-row-reverse">
      <button
        type="button"
        class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
        on:click={closeModal}
      >
        Close
      </button>

      {#if !scanning}
        <button
          type="button"
          class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          on:click={scanQR}
        >
          Scan QR
        </button>
      {/if}
    </div>
  </div>
</div>

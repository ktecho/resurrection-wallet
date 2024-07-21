<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import {formatDate} from "$lib/utils";
  import { decode_invoice_bolt11, decode_offer_bolt12 } from '$lib/phoenixdApi';

  const dispatch = createEventDispatcher();

  let invoiceInput = '';
  let decodedData = null;
  let paymentType = null;
  let amount = '';
  let message = '';
  let expiryDate = '';
  let showPreview = false;

  function closeModal() {
    dispatch('close');
  }

  async function handleInputChange() {
    if (invoiceInput.includes('@')) {
      paymentType = 'Lightning Address';
      showPreview = true;
    } else if (invoiceInput.trim() !== '') {
      showPreview = true;
    } else {
      showPreview = false;
    }
  }

  async function previewPayment() {
    if (paymentType !== 'Lightning Address') {
      try {
        console.debug('Decoding invoice:', invoiceInput);
        decodedData = await decode_invoice_bolt11(invoiceInput);
        console.debug('Decoded invoice:', decodedData);
        paymentType = 'BOLT11';
      } catch {
        try {
          decodedData = await decode_offer_bolt12(invoiceInput);
          paymentType = 'BOLT12';
        } catch {
          console.error('Invalid input: neither BOLT11 nor BOLT12');
          return;
        }
      }
    }

    if (paymentType === 'BOLT11') {
      amount = (decodedData.amount / 1000).toString();
      message = decodedData.description || '';
      let whenExpires = new Date(decodedData.timestampSeconds * 1000 + decodedData.expirySeconds * 1000);
      expiryDate = formatDate(whenExpires);
    } else if (paymentType === 'BOLT12') {
      // Ajusta esto según la estructura real de la respuesta de decode_offer_bolt12
//      amount = decodedData.amount ? decodedData.amount.toString() : '';
//      message = decodedData.description || '';
    }
    
    showPreview = true;
  }

  function handleSubmit() {
    // Aquí iría la lógica para procesar el pago
    console.log("Procesando pago:", { paymentType, amount, message });
    closeModal();
  }
</script>

<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
  <div class="mt-3 text-center">
    <h3 class="text-lg leading-6 font-medium text-gray-900">Send Payment</h3>
    <div class="mt-2 px-7 py-3">
      <p class="text-sm mb-4">Paste bolt11 invoices, bolt12 offers, or lightning addresses here:</p>
      <input
        type="text"
        class="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
        placeholder="Paste the invoice here"
        bind:value={invoiceInput}
        on:input={handleInputChange}
      />
      {#if showPreview}
        <button
          on:click={previewPayment}
          class="mt-4 bg-blue-500 text-white active:bg-blue-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
          type="button"
        >
          Preview Payment
        </button>
      {/if}
      {#if decodedData || paymentType === 'Lightning Address'}
        <div class="mt-4">
          <input
            type="text"
            class="w-1/2 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none mb-2"
            placeholder="Amount (sats)"
            bind:value={amount}
          />
          {#if paymentType !== 'BOLT11'}
            <input
              type="text"
              class="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none mb-2"
              placeholder="Message"
              bind:value={message}
            />
          {/if}
          {#if paymentType === 'BOLT11'}
            <p class="text-sm text-gray-600 mb-2">Expiry date: {expiryDate}</p>
          {/if}
          <button
            on:click={handleSubmit}
            class="mt-4 bg-green-500 text-white active:bg-green-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
            type="button"
          >
            Send Payment
          </button>
        </div>
      {/if}
    </div>
  </div>
  <div class="px-1 pt-3 pb-1 sm:flex sm:flex-row-reverse">
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
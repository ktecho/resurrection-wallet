<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import jsQR from 'jsqr';
  
    const dispatch = createEventDispatcher();
  
    let showScanner = false;
    let invoiceInput = '';
    let videoElement;
    let canvasElement;
    let canvasContext;
    let scanning = false;
  
    function closeModal() {
      dispatch('close');
    }
  
    function toggleScanner() {
      showScanner = !showScanner;
      if (showScanner) {
        startScanner();
      } else {
        stopScanner();
      }
    }
  
    function startScanner() {
      if (!videoElement) {
        videoElement = document.getElementById('qr-video');
        canvasElement = document.getElementById('qr-canvas');
        canvasContext = canvasElement.getContext('2d');
      }
  
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(function(stream) {
          videoElement.srcObject = stream;
          videoElement.setAttribute("playsinline", true);
          videoElement.play();
          scanning = true;
          requestAnimationFrame(tick);
        })
        .catch(function(error) {
          console.error("Error accessing the camera", error);
        });
    }
  
    function stopScanner() {
      scanning = false;
      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
      }
    }
  
    function tick() {
      if (scanning && videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        canvasElement.height = videoElement.videoHeight;
        canvasElement.width = videoElement.videoWidth;
        canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        const imageData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        if (code) {
          console.log("QR Code detected", code.data);
          invoiceInput = code.data;
          toggleScanner();
        }
      }
      if (scanning) {
        requestAnimationFrame(tick);
      }
    }
  
    function handleSubmit() {
      // Aquí iría la lógica para procesar el pago con el invoice
      console.log("Procesando pago con invoice:", invoiceInput);
      // Después de procesar, cerrar el modal
      closeModal();
    }
  
    onMount(() => {
      return () => {
        stopScanner();
      };
    });
  </script>
  
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3 text-center">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Enviar Pago</h3>
        <div class="mt-2 px-7 py-3">
          <input
            type="text"
            class="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
            placeholder="Pega aquí el invoice Lightning"
            bind:value={invoiceInput}
          />
          <button
            on:click={toggleScanner}
            class="mt-4 bg-blue-500 text-white active:bg-blue-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
            type="button"
          >
            {showScanner ? 'Cerrar Scanner' : 'Escanear QR'}
          </button>
          {#if showScanner}
            <div class="mt-4">
              <video id="qr-video" class="w-full h-auto"></video>
              <canvas id="qr-canvas" class="hidden"></canvas>
            </div>
          {/if}
          <button
            on:click={handleSubmit}
            class="mt-4 bg-green-500 text-white active:bg-green-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
            type="button"
          >
            Enviar Pago
          </button>
        </div>
      </div>
      <div class="items-center px-4 py-3">
        <button
          on:click={closeModal}
          class="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
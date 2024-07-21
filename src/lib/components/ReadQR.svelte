<script>
    import { onMount } from 'svelte';
    import jsQR from 'jsqr';
  
    let videoElement;
    let canvasElement;
    let canvasContext;
    let scanning = false;
  
    onMount(() => {
      canvasElement = document.getElementById('qr-canvas');
      canvasContext = canvasElement.getContext('2d');
      videoElement = document.getElementById('qr-video');
  
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(function(stream) {
          videoElement.srcObject = stream;
          videoElement.setAttribute("playsinline", true);
          videoElement.play();
          requestAnimationFrame(tick);
        });
    });
  
    function tick() {
      if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        canvasElement.height = videoElement.videoHeight;
        canvasElement.width = videoElement.videoWidth;
        canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        var imageData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
        var code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        if (code) {
          console.log("QR Code detected", code.data);
          // Aquí puedes manejar el código QR detectado
        }
      }
      requestAnimationFrame(tick);
    }
  </script>
  
  <div class="qr-scanner">
    <video id="qr-video" class="w-full h-auto"></video>
    <canvas id="qr-canvas" class="hidden"></canvas>
  </div>
const video = document.getElementById("video");

// Load face-api models from the models folder
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  faceapi.nets.ageGenderNet.loadFromUri("/models"),
])
  .then(startWebCam)
  .catch((error) => console.error("Error loading models:", error));

// Start the webcam
function startWebCam() {
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then((stream) => {
      video.srcObject = stream;
      video.play();
    })
    .catch((error) => {
      console.error("Error accessing the webcam:", error);
    });

  video.addEventListener("loadeddata", () => {
    initializeCanvas();
  });
}

// Dynamically create a canvas from the video element
let canvas;

function initializeCanvas() {
  canvas = faceapi.createCanvasFromMedia(video);
  document.body.appendChild(canvas);

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  detectAndDraw();
}

// Adjust canvas size to always match video dimensions
function resizeCanvas() {
  const displaySize = { width: video.videoWidth, height: video.videoHeight };
  if (canvas) {
    canvas.width = displaySize.width;
    canvas.height = displaySize.height;
    faceapi.matchDimensions(canvas, displaySize);
  }
}

// Main function to handle detection and drawing on a timer
function detectAndDraw() {
  setInterval(async () => {
    if (!canvas) return; // Ensure canvas is initialized

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();

    const displaySize = { width: canvas.width, height: canvas.height };
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw detections, landmarks, and expressions
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    resizedDetections.forEach((detection) => {
      const { age, gender } = detection;
      const box = detection.detection.box;
      const label = `${Math.round(age)} yrs, ${gender}`;
      const drawBox = new faceapi.draw.DrawBox(box, { label });
      drawBox.draw(canvas);
    });
  }, 100);
}

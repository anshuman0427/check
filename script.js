const video = document.getElementById("video");

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  faceapi.nets.ageGenderNet.loadFromUri("/models"),
]).then(webCam);

function webCam() {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false,
    })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((error) => {
      console.log(error);
    });
}

video.addEventListener("play", () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  faceapi.matchDimensions(canvas, { height: video.height, width: video.width });

  setInterval(async () => {
    const detection = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions().withAgeAndGender();
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    const resizedWindow = faceapi.resizeResults(detection, {
      height: video.height,
      width: video.width,
    });

    faceapi.draw.drawDetections(canvas, resizedWindow);
    faceapi.draw.drawFaceLandmarks(canvas, resizedWindow);
    faceapi.draw.drawFaceExpressions(canvas, resizedWindow);

    detectedData.numberOfPeople = resizedWindow.length;
    detectedData.agesAndGenders = resizedWindow.map((detection) => {
      return `Age: ${Math.round(detection.age)}, Gender: ${detection.gender}`;
    }).join("\n");

    detectedData.expressions = resizedWindow.map((detection) => {
      return Object.entries(detection.expressions)
        .map(([expression, value]) => `${expression}: ${Math.round(value * 100)}%`)
        .join(", ");
    }).join("\n");

    resizedWindow.forEach((detection) => {
      const box = detection.detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: Math.round(detection.age) + " years old " + detection.gender,
        boxColor: "#0279F9FF", // Set detection box color
    lineWidth: 3,
      });
      drawBox.draw(canvas);
    });

    console.log(detection);
  }, 100);
});


document.getElementById("sendEmail").addEventListener("click", () => {
  // Send email using Email.js
  emailjs.init("C0ErMorIVb9w3JerN"); // Replace with your Email.js user ID
  
  const emailParams = {
    number_of_people: detectedData.numberOfPeople,
    ages_and_genders: detectedData.agesAndGenders,
    expressions: detectedData.expressions,
    reply_to: "anshuman0427@yahoo.com",
  };

  emailjs.send("service_iqwcsdj", "template_47c9v2q", emailParams)
    .then((response) => {
      console.log("Email sent successfully:", response);
    })
    .catch((error) => {
      console.error("Error sending email:", error);
    });
});

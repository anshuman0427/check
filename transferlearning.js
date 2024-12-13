import * as tf from '@tensorflow/tfjs';

// Load pre-trained MobileNet and fine-tune
async function createGenderClassifier() {
    // Load MobileNet (pre-trained)
    const mobilenet = await tf.loadLayersModel(
        'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_140_224/classification/3/default/1',
        { fromTFHub: true }
    );

    // Freeze the base layers of MobileNet
    for (let i = 0; i < mobilenet.layers.length - 5; i++) {
        mobilenet.layers[i].trainable = false;
    }

    // Create a new model by adding dense layers
    const model = tf.sequential();
    model.add(mobilenet);
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' })); // Binary classification

    // Compile the model
    model.compile({
        optimizer: tf.train.adam(),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy'],
    });

    return model;
}

// Train the model with FER 2013 data
async function trainGenderClassifier(model, dataset) {
    const { trainData, trainLabels, valData, valLabels } = dataset;

    // Training the model
    await model.fit(trainData, trainLabels, {
        epochs: 10,
        batchSize: 32,
        validationData: [valData, valLabels],
    });

    // Save the model
    await model.save('localstorage://gender-classifier');
    console.log('Model training complete!');
}


async function fullPipeline(imageElement) {
  // Load pre-trained models for face and landmark detection
  const models = await loadFaceModels();

  // Perform face and landmark detection
  const { facePredictions, landmarkPredictions } = await detectFaceAndLandmarks(imageElement, models);

  // Crop the detected face for gender classification
  if (facePredictions.length > 0) {
      const face = facePredictions[0];
      const croppedFace = tf.image.cropAndResize(
          tf.browser.fromPixels(imageElement),
          [face.topLeft, face.bottomRight],
          [0],
          [224, 224] // Match MobileNet's input size
      );

      // Load fine-tuned gender classifier
      const genderClassifier = await tf.loadLayersModel('localstorage://gender-classifier');

      // Predict gender
      const prediction = genderClassifier.predict(croppedFace.expandDims(0));
      const gender = (await prediction.data())[0] > 0.5 ? 'Female' : 'Male';

      console.log('Predicted Gender:', gender);
  }
}

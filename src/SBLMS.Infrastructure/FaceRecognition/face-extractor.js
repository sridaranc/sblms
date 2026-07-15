const fs = require('fs');
const path = require('path');
const faceapi = require('face-api.js');
const tf = faceapi.tf;
const jpeg = require('jpeg-js');
const png = require('pngjs').PNG;

// Polyfill environment for face-api.js in Node.js
// We use tensors directly so canvas is not required


// Decodes a base64 image string to raw RGB pixel values
function decodeImage(base64Str) {
  const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Detect file type using magic bytes
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    // JPEG
    const rawImageData = jpeg.decode(buffer, { maxMemoryUsageInMB: 1024 });
    return {
      width: rawImageData.width,
      height: rawImageData.height,
      data: rawImageData.data // RGBA Uint8Array
    };
  } else if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    // PNG
    const pngImage = png.sync.read(buffer);
    return {
      width: pngImage.width,
      height: pngImage.height,
      data: pngImage.data // RGBA Uint8Array
    };
  } else {
    // Fallback: Try decoding as JPEG
    try {
      const rawImageData = jpeg.decode(buffer, { maxMemoryUsageInMB: 1024 });
      return {
        width: rawImageData.width,
        height: rawImageData.height,
        data: rawImageData.data
      };
    } catch (e) {
      throw new Error('Unsupported image format. Only JPEG and PNG are supported.');
    }
  }
}

// Converts raw RGBA pixels to a 3D RGB tensor, and resizes if too large
function imageToTensor(width, height, rgbaData) {
  const numPixels = width * height;
  const rgbValues = new Int32Array(numPixels * 3);
  
  for (let i = 0; i < numPixels; i++) {
    rgbValues[i * 3] = rgbaData[i * 4];       // R
    rgbValues[i * 3 + 1] = rgbaData[i * 4 + 1]; // G
    rgbValues[i * 3 + 2] = rgbaData[i * 4 + 2]; // B
  }
  
  const tensor = tf.tensor3d(rgbValues, [height, width, 3], 'int32');
  
  // Downscale if image is too large (max 800px on longest side)
  const MAX_SIZE = 800;
  if (width > MAX_SIZE || height > MAX_SIZE) {
    const scale = MAX_SIZE / Math.max(width, height);
    const newWidth = Math.round(width * scale);
    const newHeight = Math.round(height * scale);
    
    // Resize requires float32, so cast to float, resize, then back to int32
    const resized = tf.image.resizeBilinear(tensor, [newHeight, newWidth], true);
    const intResized = resized.cast('int32');
    
    tensor.dispose();
    resized.dispose();
    
    return intResized;
  }
  
  return tensor;
}

// Reads data from standard input
async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => { resolve(data); });
    process.stdin.on('error', err => { reject(err); });
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error(JSON.stringify({ error: "Missing arguments. Usage: node face-extractor.js <base64Image|stdin> <modelsPath>" }));
    process.exit(1);
  }

  let base64Image = args[0];
  const modelsPath = args[1];

  try {
    if (base64Image === 'stdin' || base64Image === '-') {
      base64Image = await readStdin();
    }
    // Load models
    await faceapi.nets.tinyFaceDetector.loadFromDisk(modelsPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);

    // Decode image
    const { width, height, data } = decodeImage(base64Image);
    const tensor = imageToTensor(width, height, data);

    // Detect face
    // TinyFaceDetector is fast and works well
    let detection = await faceapi.detectSingleFace(tensor, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    // Fallback to SsdMobilenetv1 if TinyFaceDetector fails
    if (!detection) {
      detection = await faceapi.detectSingleFace(tensor, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptor();
    }

    tensor.dispose();

    if (detection) {
      console.log(JSON.stringify({
        success: true,
        descriptor: Array.from(detection.descriptor)
      }));
    } else {
      console.log(JSON.stringify({
        success: false,
        error: "No face detected in image."
      }));
    }
  } catch (err) {
    console.log(JSON.stringify({
      success: false,
      error: err.message
    }));
  }
}

main();

import * as faceApi from 'face-api.js';

export const drawFaceDetectionResult = (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  detection: any
) => {
  const displaySize = { width: video.width, height: video.height };
  faceApi.matchDimensions(canvas, displaySize);
  const resizedDetections = faceApi.resizeResults(detection, displaySize);
  canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  faceApi.draw.drawDetections(canvas, resizedDetections);
  faceApi.draw.drawFaceLandmarks(canvas, resizedDetections);
};
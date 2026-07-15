import * as faceApi from 'face-api.js';

export interface FaceQuality {
  score: number;
  isGood: boolean;
  message: string;
}

export interface FaceDetectionResult {
  descriptor: number[];
  detection: any;
  landmarks: any;
  box: any;
  quality: FaceQuality;
  videoWidth: number;
  videoHeight: number;
}

const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;
  return isMobile || (isTouch && isSmallScreen);
};

const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const faceRecognitionService = {
  isModelsLoaded: false,
  _detectionFrame: null as number | null,
  _isDetecting: false,
  _lastDetectionTime: 0,
  _consecutiveFailures: 0,

  getMobileConfig() {
    const mobile = isMobileDevice();
    return {
      isMobile: mobile,
      fps: mobile ? 6 : 12,
      maxConsecutiveFailures: mobile ? 3 : 5,
      detectionInterval: mobile ? 180 : 90,
      maxCanvasWidth: mobile ? 320 : 640,
      maxCanvasHeight: mobile ? 240 : 480,
      videoConstraints: mobile
        ? { width: { ideal: 320, max: 640 }, height: { ideal: 240, max: 480 } }
        : { width: { ideal: 640, max: 1280 }, height: { ideal: 480, max: 720 } },
    };
  },

  async loadModels(): Promise<boolean> {
    try {
      const modelPath = '/models';
      const config = this.getMobileConfig();

      if (config.isMobile) {
        await faceApi.nets.tinyFaceDetector.loadFromUri(modelPath);
        await faceApi.nets.faceLandmark68Net.loadFromUri(modelPath);
        await faceApi.nets.faceRecognitionNet.loadFromUri(modelPath);
        try {
          await faceApi.nets.ssdMobilenetv1.loadFromUri(modelPath);
        } catch {
          console.warn('SSD MobileNet failed to load on mobile, using TinyFaceDetector only');
        }
      } else {
        await Promise.all([
          faceApi.nets.tinyFaceDetector.loadFromUri(modelPath),
          faceApi.nets.faceLandmark68Net.loadFromUri(modelPath),
          faceApi.nets.faceRecognitionNet.loadFromUri(modelPath),
          faceApi.nets.ssdMobilenetv1.loadFromUri(modelPath),
        ]);
      }

      this.isModelsLoaded = true;
      return true;
    } catch (error) {
      console.error('Failed to load face recognition models:', error);
      this.isModelsLoaded = false;
      return false;
    }
  },

  evaluateFaceQuality(detection: faceApi.WithFaceDetection<{}>, videoWidth: number, videoHeight: number): FaceQuality {
    const box = detection.detection.box;
    const score = detection.detection.score;

    const vw = videoWidth || 640;
    const vh = videoHeight || 480;
    const videoArea = vw * vh;

    const sizeRatio = (box.width * box.height) / videoArea;
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const toleranceX = vw * 0.3;
    const toleranceY = vh * 0.25;
    const centered = Math.abs(centerX - vw / 2) < toleranceX && Math.abs(centerY - vh / 2) < toleranceY;

    if (score < 0.4) {
      return { score: 0, isGood: false, message: 'Face not clear enough' };
    }
    if (sizeRatio < 0.02) {
      return { score: 15, isGood: false, message: 'Move closer to the camera' };
    }
    if (sizeRatio > 0.7) {
      return { score: 25, isGood: false, message: 'Move away from the camera' };
    }
    if (!centered) {
      return { score: 35, isGood: false, message: 'Center your face in the frame' };
    }

    const qualityScore = Math.min(100, Math.round(
      score * 55 +
      (centered ? 25 : 0) +
      (sizeRatio > 0.04 && sizeRatio < 0.45 ? 20 : 10)
    ));
    return {
      score: qualityScore,
      isGood: qualityScore >= 65,
      message: qualityScore >= 65 ? 'Face detected - Ready to capture' : 'Adjust your position',
    };
  },

  async captureFaceDescriptor(video: HTMLVideoElement): Promise<number[] | null> {
    try {
      if (!video || video.paused || video.ended || video.readyState < 2) return null;

      const detection = await faceApi
        .detectSingleFace(video, new faceApi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) return null;
      this._consecutiveFailures = 0;
      return Array.from(detection.descriptor);
    } catch (error) {
      this._consecutiveFailures++;
      console.error('Face detection error:', error);
      return null;
    }
  },

  async detectWithQuality(video: HTMLVideoElement): Promise<FaceDetectionResult | null> {
    try {
      if (!video || video.paused || video.ended || video.readyState < 2) return null;

      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;

      const detection = await faceApi
        .detectSingleFace(video, new faceApi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        this._consecutiveFailures++;
        return null;
      }

      this._consecutiveFailures = 0;
      const quality = this.evaluateFaceQuality(detection, vw, vh);
      return {
        descriptor: Array.from(detection.descriptor),
        detection,
        landmarks: detection.landmarks,
        box: detection.detection.box,
        quality,
        videoWidth: vw,
        videoHeight: vh,
      };
    } catch (error) {
      this._consecutiveFailures++;
      console.error('Face detection error:', error);
      return null;
    }
  },

  startAutoDetection(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    onDetection: (result: FaceDetectionResult) => void,
    onNoFace: () => void,
    fps?: number
  ) {
    this.stopAutoDetection();

    const config = this.getMobileConfig();
    const targetFps = fps || config.fps;
    const frameInterval = 1000 / targetFps;

    this._isDetecting = true;
    this._lastDetectionTime = 0;
    this._consecutiveFailures = 0;

    const loop = async (timestamp: number) => {
      if (!this._isDetecting) return;

      if (!video || video.paused || video.ended || video.readyState < 2) {
        this._detectionFrame = requestAnimationFrame(loop);
        return;
      }

      if (timestamp - this._lastDetectionTime < frameInterval) {
        this._detectionFrame = requestAnimationFrame(loop);
        return;
      }

      this._lastDetectionTime = timestamp;

      try {
        const result = await this.detectWithQuality(video);
        if (result) {
          this.drawDetection(video, canvas, result);
          onDetection(result);
        } else {
          this.clearCanvas(canvas);
          onNoFace();
        }
      } catch {
        this.clearCanvas(canvas);
        onNoFace();
      }

      if (this._isDetecting) {
        this._detectionFrame = requestAnimationFrame(loop);
      }
    };

    this._detectionFrame = requestAnimationFrame(loop);
  },

  stopAutoDetection() {
    this._isDetecting = false;
    if (this._detectionFrame !== null) {
      cancelAnimationFrame(this._detectionFrame);
      this._detectionFrame = null;
    }
  },

  drawDetection(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    result: FaceDetectionResult
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;

    const displayRect = video.getBoundingClientRect();
    const displayWidth = Math.floor(displayRect.width);
    const displayHeight = Math.floor(displayRect.height);

    canvas.width = displayWidth;
    canvas.height = displayHeight;
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    const scaleX = displayWidth / vw;
    const scaleY = displayHeight / vh;

    const { box } = result;
    const color = result.quality.isGood ? '#00c9a7' : '#ffc107';

    const bx = box.x * scaleX;
    const by = box.y * scaleY;
    const bw = box.width * scaleX;
    const bh = box.height * scaleY;

    ctx.strokeStyle = color;
    ctx.lineWidth = isMobileDevice() ? 2 : 3;
    ctx.setLineDash([6, 3]);
    const radius = Math.min(bw, bh) * 0.35;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(bx, by, bw, bh, radius);
    } else {
      ctx.rect(bx, by, bw, bh);
    }
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.font = `bold ${isMobileDevice() ? 11 : 14}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(result.quality.message, bx + bw / 2, by - 10);

    const cornerLen = isMobileDevice() ? 10 : 15;
    const corners = [
      { x: bx, y: by, dx: 1, dy: 1 },
      { x: bx + bw, y: by, dx: -1, dy: 1 },
      { x: bx, y: by + bh, dx: 1, dy: -1 },
      { x: bx + bw, y: by + bh, dx: -1, dy: -1 },
    ];
    ctx.lineWidth = isMobileDevice() ? 3 : 4;
    ctx.strokeStyle = color;
    corners.forEach(c => {
      ctx.beginPath();
      ctx.moveTo(c.x + cornerLen * c.dx, c.y);
      ctx.lineTo(c.x, c.y);
      ctx.lineTo(c.x, c.y + cornerLen * c.dy);
      ctx.stroke();
    });
  },

  clearCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  },

  async compareFaces(descriptor1: number[], descriptor2: number[]): Promise<number> {
    const face1 = new Float32Array(descriptor1);
    const face2 = new Float32Array(descriptor2);
    return faceApi.euclideanDistance(face1, face2);
  },

  async verifyFace(capturedDescriptor: number[], enrolledDescriptor: number[], threshold: number = 0.6): Promise<{ verified: boolean; distance: number }> {
    const distance = await this.compareFaces(capturedDescriptor, enrolledDescriptor);
    return { verified: distance < threshold, distance };
  },

  getCameraConstraints(): MediaStreamConstraints {
    const config = this.getMobileConfig();
    const facingMode = isMobileDevice() ? { exact: 'user' } : 'user';

    return {
      video: {
        facingMode,
        ...config.videoConstraints,
      },
      audio: false,
    };
  },

  async startCamera(video: HTMLVideoElement): Promise<MediaStream | null> {
    try {
      const constraints = this.getCameraConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;

      return new Promise((resolve) => {
        const onLoaded = () => {
          video.removeEventListener('loadedmetadata', onLoaded);
          resolve(stream);
        };
        video.addEventListener('loadedmetadata', onLoaded);

        video.play().catch((err) => {
          console.warn('Video autoplay blocked:', err);
          if (isIOS()) {
            const playHandler = () => {
              video.removeEventListener('click', playHandler);
              video.play().catch(() => {});
            };
            video.addEventListener('click', playHandler);
          }
          resolve(stream);
        });
      });
    } catch (err) {
      console.error('Camera start error:', err);

      if (isMobileDevice()) {
        try {
          const fallbackConstraints: MediaStreamConstraints = {
            video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } },
            audio: false,
          };
          const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          video.srcObject = stream;
          await video.play().catch(() => {});
          return stream;
        } catch (fallbackErr) {
          console.error('Fallback camera also failed:', fallbackErr);
        }
      }

      return null;
    }
  },

  stopCamera(video: HTMLVideoElement | null) {
    if (video?.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
  },
};

export type { faceRecognitionService as FaceRecognitionService };

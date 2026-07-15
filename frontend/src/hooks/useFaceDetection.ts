import { useRef, useCallback, useEffect } from 'react';
import { faceRecognitionService, FaceDetectionResult } from '../services/faceRecognitionService';

interface UseFaceDetectionOptions {
  onDetection?: (result: FaceDetectionResult) => void;
  onNoFace?: () => void;
  fps?: number;
}

export const useFaceDetection = (options: UseFaceDetectionOptions = {}) => {
  const { onDetection, onNoFace, fps } = options;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDetectingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async (video: HTMLVideoElement) => {
    try {
      const stream = await faceRecognitionService.startCamera(video);
      if (stream) {
        videoRef.current = video;
        streamRef.current = stream;
        return true;
      }
      return false;
    } catch (err) {
      console.error('Camera error:', err);
      return false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current) {
      faceRecognitionService.stopCamera(videoRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    faceRecognitionService.stopAutoDetection();
    isDetectingRef.current = false;
    videoRef.current = null;
  }, []);

  const startDetection = useCallback((canvas: HTMLCanvasElement) => {
    if (!videoRef.current || isDetectingRef.current) return;
    canvasRef.current = canvas;
    isDetectingRef.current = true;

    faceRecognitionService.startAutoDetection(
      videoRef.current,
      canvas,
      (result) => onDetection?.(result),
      () => onNoFace?.(),
      fps
    );
  }, [onDetection, onNoFace, fps]);

  const stopDetection = useCallback(() => {
    faceRecognitionService.stopAutoDetection();
    isDetectingRef.current = false;
  }, []);

  const captureDescriptor = useCallback(async (): Promise<number[] | null> => {
    if (!videoRef.current) return null;
    return faceRecognitionService.captureFaceDescriptor(videoRef.current);
  }, []);

  const detectWithQuality = useCallback(async (): Promise<FaceDetectionResult | null> => {
    if (!videoRef.current) return null;
    return faceRecognitionService.detectWithQuality(videoRef.current);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return {
    startCamera,
    stopCamera,
    startDetection,
    stopDetection,
    captureDescriptor,
    detectWithQuality,
    videoRef,
    canvasRef,
  };
};

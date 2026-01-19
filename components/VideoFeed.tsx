
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface VideoFeedProps {
  isActive: boolean;
  onFrame: (base64Data: string) => void;
}

export interface VideoFeedHandle {
  start: () => Promise<void>;
  stop: () => void;
}

const VideoFeed = forwardRef<VideoFeedHandle, VideoFeedProps>(({ isActive, onFrame }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useImperativeHandle(ref, () => ({
    start: async () => {
      if (!videoRef.current) return;
      
      // OPTIMIZATION: If stream is already active, don't re-request it.
      // This prevents the "black flicker" when the AI session reconnects.
      if (streamRef.current && streamRef.current.active) {
          if (videoRef.current.srcObject !== streamRef.current) {
              videoRef.current.srcObject = streamRef.current;
          }
          await videoRef.current.play().catch(() => {});
          startFrameCapture();
          return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Camera API not supported.");
        return;
      }
      
      try {
        // Request HD resolution (720p) for better detection accuracy, 
        // but we will downsample before sending to the API.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 }, 
            facingMode: 'user' 
          }
        });
        
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        startFrameCapture();
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    },
    stop: () => {
      stopFrameCapture();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }));

  const stopFrameCapture = () => {
    if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
  }

  const startFrameCapture = () => {
    stopFrameCapture();
    
    // Send frames at 1 FPS (every 1000ms) to prevent "Network Error" due to payload size.
    intervalRef.current = window.setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      if (document.hidden) return; // Optimization: Don't process/send if tab is hidden
      
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      
      // Safety check: videoWidth can be 0 if metadata isn't loaded yet
      if (videoWidth === 0 || videoHeight === 0) return;

      // Downsample for Gemini Live API to avoid "Network error" (payload limits)
      // Reduced from 640 to 480 for stability.
      const maxWidth = 480;
      const scale = Math.min(1, maxWidth / videoWidth);
      
      const targetWidth = videoWidth * scale;
      const targetHeight = videoHeight * scale;

      // PERFORMANCE FIX: Only resize canvas if dimensions change.
      if (canvasRef.current.width !== targetWidth || canvasRef.current.height !== targetHeight) {
          canvasRef.current.width = targetWidth;
          canvasRef.current.height = targetHeight;
      }
      
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

      // Convert to base64 jpeg with quality 0.25 (reduced from 0.4) to keep payload size small (<15KB).
      const base64 = canvasRef.current.toDataURL('image/jpeg', 0.25).split(',')[1];
      if (base64) {
        onFrame(base64);
      }
    }, 1000); 
  };

  useEffect(() => {
    return () => {
      stopFrameCapture();
       // CRITICAL FIX: Ensure tracks are stopped on unmount
       if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden shadow-xl border-4 border-blue-900">
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Live Video Feed */}
      {/* FIX: Added 'scale-x-[-1]' (transform: scaleX(-1)) to create a mirror effect. 
          This makes it much easier for users to align their tickets with the camera. 
          The canvas capture remains un-mirrored for correct OCR text reading. */}
      <video 
        ref={videoRef} 
        className={`w-full h-full object-cover transition-opacity duration-500 transform scale-x-[-1] ${isActive ? 'opacity-100' : 'opacity-30'}`} 
        muted 
        playsInline
      />
      
      {/* Overlay UI elements */}
      {isActive && (
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
            <span className="bg-black/50 text-white px-2 py-1 rounded text-xs font-bold backdrop-blur-sm">
                LIVE VISION (MIRRORED)
            </span>
          </div>
      )}
      
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-6 bg-black/60 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="text-4xl mb-2">📷</div>
              <p className="text-white text-xl font-semibold">Kiosk Offline</p>
              <p className="text-gray-400 text-sm mt-1">Camera disabled</p>
          </div>
        </div>
      )}
    </div>
  );
});

VideoFeed.displayName = 'VideoFeed';
export default React.memo(VideoFeed);

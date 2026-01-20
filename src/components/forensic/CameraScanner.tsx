'use client';

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

export interface CameraScannerHandle {
    captureFrame: () => string | null;
}

interface CameraScannerProps {
    onPermissionError?: (error: any) => void;
}

const DEEP_FOREST_GREEN = '#0A4D3C';

export const CameraScanner = forwardRef<CameraScannerHandle, CameraScannerProps>(
    ({ onPermissionError }, ref) => {
        const videoRef = useRef<HTMLVideoElement>(null);
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const [stream, setStream] = useState<MediaStream | null>(null);

        useImperativeHandle(ref, () => ({
            captureFrame: () => {
                const video = videoRef.current;
                const canvas = canvasRef.current;

                if (!video || !canvas) return null;

                const context = canvas.getContext('2d');
                if (!context) return null;

                // Set canvas dimensions to match video stream directly
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                // Draw the current frame
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Export as base64 - standard JPEG is fine for Gemini
                return canvas.toDataURL('image/jpeg', 0.9);
            }
        }));

        useEffect(() => {
            async function setupCamera() {
                try {
                    const mediaStream = await navigator.mediaDevices.getUserMedia({
                        audio: false,
                        video: {
                            facingMode: 'environment', // Default to back camera
                            width: { ideal: 1920 },    // High res for typography
                            height: { ideal: 1080 }
                        }
                    });

                    setStream(mediaStream);

                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                } catch (err) {
                    console.error("Camera Access Error:", err);
                    if (onPermissionError) onPermissionError(err);
                }
            }

            setupCamera();

            return () => {
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
            };
        }, []);

        return (
            <div className="relative w-full h-full overflow-hidden bg-black">
                {/* Hidden Canvas for Capture */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Live Viewfinder */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                />

                {/* Forensic Overlay Reticle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-72 h-72 rounded-3xl backdrop-blur-[2px] shadow-2xl">
                        {/* Custom Border Implementation simulating SVG corners */}
                        <div style={{ borderColor: DEEP_FOREST_GREEN }} className="absolute top-0 left-0 w-12 h-12 border-t-[4px] border-l-[4px] rounded-tl-2xl -mt-0.5 -ml-0.5" />
                        <div style={{ borderColor: DEEP_FOREST_GREEN }} className="absolute top-0 right-0 w-12 h-12 border-t-[4px] border-r-[4px] rounded-tr-2xl -mt-0.5 -mr-0.5" />
                        <div style={{ borderColor: DEEP_FOREST_GREEN }} className="absolute bottom-0 left-0 w-12 h-12 border-b-[4px] border-l-[4px] rounded-bl-2xl -mb-0.5 -ml-0.5" />
                        <div style={{ borderColor: DEEP_FOREST_GREEN }} className="absolute bottom-0 right-0 w-12 h-12 border-b-[4px] border-r-[4px] rounded-br-2xl -mb-0.5 -mr-0.5" />

                        {/* Scanning Line Animation */}
                        <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-[#4bb814]/80 shadow-[0_0_15px_rgba(75,184,20,0.8)] animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }
);

CameraScanner.displayName = 'CameraScanner';

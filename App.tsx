import React, { useEffect, useRef, useState } from 'react';
import { Scene } from './components/Scene';
import { UIOverlay } from './components/UIOverlay';
import { HandDetectionService } from './services/handDetection';
import { GestureType } from './types';

function App() {
  const [loading, setLoading] = useState(true);
  const [gesture, setGesture] = useState<GestureType>(GestureType.NONE);
  const [handPosition, setHandPosition] = useState({ x: 0.5, y: 0.5 });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const handService = useRef(new HandDetectionService());

  useEffect(() => {
    const init = async () => {
      try {
        await handService.current.initialize();
        
        // Setup Camera
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 640, 
                height: 480,
                facingMode: 'user' 
            } 
        });
        
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadeddata = () => {
                setLoading(false);
                videoRef.current?.play();
                handService.current.start(videoRef.current!, (detectedGesture, pos) => {
                    setGesture(detectedGesture);
                    setHandPosition(pos);
                });
            };
        }
      } catch (err) {
        console.error("Initialization failed", err);
        alert("Camera access is required for the magic to work! Please check permissions.");
        setLoading(false);
      }
    };

    init();

    return () => {
      handService.current.stop();
    };
  }, []);

  return (
    <div className="w-screen h-screen relative bg-[#050505] overflow-hidden">
      <Scene gesture={gesture} handPosition={handPosition} />
      <UIOverlay 
        loading={loading} 
        gesture={gesture} 
        videoRef={videoRef} 
      />
    </div>
  );
}

export default App;
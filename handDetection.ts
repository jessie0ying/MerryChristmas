import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { GestureType } from "../types";

export class HandDetectionService {
  private handLandmarker: HandLandmarker | null = null;
  private video: HTMLVideoElement | null = null;
  private lastVideoTime = -1;
  private animationFrameId: number | null = null;

  async initialize() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 1,
    });
  }

  async start(
    videoElement: HTMLVideoElement,
    onResults: (gesture: GestureType, position: { x: number; y: number }) => void
  ) {
    this.video = videoElement;

    const predict = () => {
      if (!this.handLandmarker || !this.video) return;

      if (this.video.currentTime !== this.lastVideoTime && this.video.readyState >= 2) {
        this.lastVideoTime = this.video.currentTime;
        const results = this.handLandmarker.detectForVideo(this.video, performance.now());

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          const gesture = this.detectGesture(landmarks);
          
          // Calculate center of palm roughly
          const x = landmarks[9].x; // Middle finger MCP
          const y = landmarks[9].y;

          onResults(gesture, { x, y });
        } else {
          onResults(GestureType.NONE, { x: 0.5, y: 0.5 });
        }
      }
      this.animationFrameId = requestAnimationFrame(predict);
    };

    this.animationFrameId = requestAnimationFrame(predict);
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private detectGesture(landmarks: any[]): GestureType {
    // Simple heuristic for Open Hand vs Fist
    // Check if fingertips are above (lower y value) the PIP joints (Proximal Interphalangeal)
    
    // Indices for fingertips: 4, 8, 12, 16, 20
    // Indices for PIP/MCP: 2, 6, 10, 14, 18 (using MCP for thumb, PIP for others)
    
    const fingerTips = [8, 12, 16, 20];
    const fingerPIPs = [6, 10, 14, 18];
    
    let extendedFingers = 0;
    
    // Check 4 fingers
    for (let i = 0; i < 4; i++) {
        // Measure distance from wrist(0) to tip vs wrist to PIP
        // Or simpler: relative Y if hand is upright. 
        // Let's use distance from wrist to determine extension.
        const tip = landmarks[fingerTips[i]];
        const pip = landmarks[fingerPIPs[i]];
        const wrist = landmarks[0];

        const distTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
        const distPip = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);

        if (distTip > distPip * 1.3) { // Tip is significantly further than PIP
            extendedFingers++;
        }
    }

    // Thumb check (vector comparison roughly)
    const thumbTip = landmarks[4];
    const thumbMCP = landmarks[2];
    const wrist = landmarks[0];
    const distThumbTip = Math.hypot(thumbTip.x - wrist.x, thumbTip.y - wrist.y);
    const distThumbMCP = Math.hypot(thumbMCP.x - wrist.x, thumbMCP.y - wrist.y);
    if (distThumbTip > distThumbMCP * 1.2) extendedFingers++;

    if (extendedFingers >= 4) return GestureType.OPEN_HAND;
    if (extendedFingers <= 1) return GestureType.FIST;
    
    return GestureType.MOVING;
  }
}
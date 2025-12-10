import React from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Sparkles, Stars, PerspectiveCamera, Environment } from '@react-three/drei';
import { TreeParticles } from './TreeParticles';
import { GestureType } from '../types';

interface SceneProps {
  gesture: GestureType;
  handPosition: { x: number; y: number };
}

export const Scene: React.FC<SceneProps> = ({ gesture, handPosition }) => {
  return (
    <Canvas className="w-full h-full block" gl={{ toneMappingExposure: 1.2 }}>
        <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={50} />
        
        {/* Environment Map is crucial for Gold/Metallic materials to look bright */}
        <Environment preset="sunset" background={false} />
        
        {/* Cinematic Lighting - Boosted for visibility */}
        <ambientLight intensity={0.8} color="#ffffff" />
        <spotLight 
            position={[10, 15, 10]} 
            angle={0.3} 
            penumbra={1} 
            intensity={3.0} 
            color="#ffd700" 
            castShadow 
        />
        {/* Warm Red Fill */}
        <pointLight position={[-10, -5, -10]} intensity={1.5} color="#C41E3A" />
        {/* Cool rim light */}
        <pointLight position={[5, 5, -5]} intensity={1.0} color="#ffffff" />

        {/* The Magic */}
        <TreeParticles gesture={gesture} handPosition={handPosition} />
        
        {/* Gold Dust */}
        <Sparkles count={150} scale={12} size={4} speed={0.4} opacity={0.8} color="#ffd700" />
        {/* Multi-colored faint sparkles for atmosphere */}
        <Sparkles count={50} scale={10} size={3} speed={0.2} opacity={0.6} color="#ff3333" />
        <Sparkles count={50} scale={10} size={3} speed={0.2} opacity={0.6} color="#33ff33" />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        {/* Post Processing for Glow and Film look */}
        <EffectComposer enableNormalPass={false}>
            <Bloom 
                luminanceThreshold={0.6} // Higher threshold so only very bright things glow, preventing washout
                mipmapBlur 
                intensity={1.5} 
                radius={0.5}
            />
            <Vignette eskil={false} offset={0.1} darkness={0.8} />
        </EffectComposer>
    </Canvas>
  );
};
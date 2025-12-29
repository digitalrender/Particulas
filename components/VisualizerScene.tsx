import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';

// Fix for TypeScript errors where R3F elements are not recognized in JSX.IntrinsicElements
// We augment both global JSX and module 'react' JSX to cover different TS/React environment configurations
declare global {
  namespace JSX {
    interface IntrinsicElements {
      instancedMesh: any;
      boxGeometry: any;
      sphereGeometry: any;
      tetrahedronGeometry: any;
      instancedBufferAttribute: any;
      meshStandardMaterial: any;
      ambientLight: any;
      pointLight: any;
      directionalLight: any;
      color: any;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      instancedMesh: any;
      boxGeometry: any;
      sphereGeometry: any;
      tetrahedronGeometry: any;
      instancedBufferAttribute: any;
      meshStandardMaterial: any;
      ambientLight: any;
      pointLight: any;
      directionalLight: any;
      color: any;
    }
  }
}

// Particle Configuration
const CUBE_SIZE = 0.5;

interface ParticleGroupProps {
  getAudioData: () => any;
  isListening: boolean;
  count: number;
  shape: 'cube' | 'sphere' | 'tetrahedron';
}

const ParticleGroup: React.FC<ParticleGroupProps> = ({ getAudioData, isListening, count, shape }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Initialize particles in a spherical cloud
  const { initialPositions, colors, phases } = useMemo(() => {
    const p = new Float32Array(count * 3);
    const c = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    
    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      // Random position in a spherical shell
      const r = 15 + Math.random() * 20; // Radius between 15 and 35
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      p[i * 3] = x;
      p[i * 3 + 1] = y;
      p[i * 3 + 2] = z;

      // Full color spectrum
      // Using HSL for vibrant, saturated colors
      // Saturation: 1.0 (Max), Lightness: 0.6 (Bright)
      tempColor.setHSL(Math.random(), 1.0, 0.6);
      
      c[i * 3] = tempColor.r;
      c[i * 3 + 1] = tempColor.g;
      c[i * 3 + 2] = tempColor.b;

      // Random animation phase
      ph[i] = Math.random() * Math.PI * 2;
    }
    return { initialPositions: p, colors: c, phases: ph };
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Get audio data
    const { frequency, low } = isListening ? getAudioData() : { frequency: new Uint8Array(0), low: 0 };
    
    const bassIntensity = low / 255;
    const time = state.clock.getElapsedTime();

    // Rotate the entire cloud slowly
    meshRef.current.rotation.y = time * 0.05;
    meshRef.current.rotation.z = time * 0.02;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const ox = initialPositions[ix];
      const oy = initialPositions[ix + 1];
      const oz = initialPositions[ix + 2];

      // Audio reactive values
      const freqIndex = i % (frequency.length || 1);
      const audioValue = (frequency[freqIndex] || 0) / 255; 

      // Animation calculations
      const phase = phases[i];
      
      // Breathing effect
      const breathing = Math.sin(time + phase) * 2;
      // Pulse out on bass
      const bassPush = bassIntensity * 8; 

      // Normalize direction for push
      const dist = Math.sqrt(ox*ox + oy*oy + oz*oz);
      const dirX = ox / dist;
      const dirY = oy / dist;
      const dirZ = oz / dist;

      // Apply Position
      const totalOffset = breathing + bassPush;
      dummy.position.set(
        ox + dirX * totalOffset,
        oy + dirY * totalOffset,
        oz + dirZ * totalOffset
      );

      // Rotation (Spinning objects)
      dummy.rotation.x = time + phase + (audioValue * 5);
      dummy.rotation.y = time * 0.5 + phase;

      // Scale effect
      const baseScale = isListening ? 0.3 : 1;
      const dynamicScale = isListening ? audioValue * 4 : Math.sin(time * 2 + phase) * 0.5;
      const scale = baseScale + dynamicScale;

      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {shape === 'cube' && (
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]}>
           <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
        </boxGeometry>
      )}
      {shape === 'sphere' && (
        <sphereGeometry args={[CUBE_SIZE * 0.7, 16, 16]}>
           <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
        </sphereGeometry>
      )}
      {shape === 'tetrahedron' && (
        <tetrahedronGeometry args={[CUBE_SIZE]}>
           <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
        </tetrahedronGeometry>
      )}
      
      <meshStandardMaterial 
          vertexColors 
          metalness={1.0}
          roughness={0.35}
          envMapIntensity={1.5}
      />
    </instancedMesh>
  );
};

interface SceneProps {
  audioStream: MediaStream | null;
  isListening: boolean;
  bloomConfig: {
    intensity: number;
    threshold: number;
    radius: number;
  };
}

export const VisualizerScene: React.FC<SceneProps> = ({ audioStream, isListening, bloomConfig }) => {
  const { getAudioData } = useAudioAnalyzer(audioStream);

  return (
    <Canvas>
      <color attach="background" args={['#000000']} />
      <PerspectiveCamera makeDefault position={[0, 0, 60]} fov={60} />
      
      {/* Environment for reflections, 'city' provides good contrast for metal */}
      <Environment preset="city" background={false} />

      {/* Lighting optimized for metallic surfaces and bloom */}
      <ambientLight intensity={1.5} />
      <pointLight position={[20, 20, 20]} intensity={3.0} color="#ffffff" />
      <pointLight position={[-20, -20, -20]} intensity={2.5} color="#ffffff" />
      <directionalLight position={[0, 10, 5]} intensity={3} />

      <OrbitControls 
        autoRotate={!isListening} 
        autoRotateSpeed={0.5} 
        enablePan={false} 
        minDistance={20} 
        maxDistance={100} 
      />
      
      {/* Distribute 2000 particles across 3 shapes */}
      <ParticleGroup 
        getAudioData={getAudioData} 
        isListening={isListening} 
        count={800} 
        shape="cube" 
      />
      <ParticleGroup 
        getAudioData={getAudioData} 
        isListening={isListening} 
        count={600} 
        shape="sphere" 
      />
      <ParticleGroup 
        getAudioData={getAudioData} 
        isListening={isListening} 
        count={600} 
        shape="tetrahedron" 
      />

      {/* Post Processing Effects */}
      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={bloomConfig.threshold}
          mipmapBlur 
          intensity={bloomConfig.intensity}
          radius={bloomConfig.radius}
        />
      </EffectComposer>
    </Canvas>
  );
};

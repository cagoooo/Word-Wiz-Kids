import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, useTexture, Billboard } from '@react-three/drei';
import * as THREE from 'three';

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

function Mascot() {
  const texture = useTexture('/owl-mascot.png');
  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={1.5} floatingRange={[-0.5, 0.5]}>
      <Billboard position={[0, 0, 0]}>
        <mesh>
          <planeGeometry args={[4, 4]} />
          <meshBasicMaterial map={texture} transparent alphaTest={0.1} />
        </mesh>
      </Billboard>
    </Float>
  );
}

function AlphabetBlock() {
  const texture = useTexture('/alphabet-block.png');
  return (
    <Float speed={3} rotationIntensity={1} floatIntensity={2} floatingRange={[-1, 1]}>
      <Billboard position={[-3, 1, -2]}>
        <mesh>
          <planeGeometry args={[2.5, 2.5]} />
          <meshBasicMaterial map={texture} transparent alphaTest={0.1} />
        </mesh>
      </Billboard>
    </Float>
  );
}

function FloatingShapes() {
  const shapesRef = useRef<THREE.Group>(null);
  
  const shapes = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10 - 5
      ] as [number, number, number],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
      scale: Math.random() * 0.5 + 0.2,
      color: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#c7f464'][Math.floor(Math.random() * 4)],
    }));
  }, []);

  useFrame((state) => {
    if (shapesRef.current) {
      shapesRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.2;
      shapesRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group ref={shapesRef}>
      {shapes.map((shape, i) => (
        <Float key={i} speed={Math.random() * 2 + 1} rotationIntensity={2} floatIntensity={2}>
          <mesh position={shape.position} rotation={shape.rotation} scale={shape.scale}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={shape.color} roughness={0.2} metalness={0.8} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function CameraRig() {
  useFrame((state) => {
    // Subtle parallax effect based on mouse position
    const t = state.clock.elapsedTime;
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, (state.pointer.x * 2), 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, (state.pointer.y * 2), 0.05);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

const HeroFallback = () => (
  <div className="w-full h-full absolute inset-0 -z-10 bg-gradient-to-b from-[#2e026d] via-[#1a0050] to-[#150030]">
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/20 animate-pulse"
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${Math.random() * 2 + 2}s`,
          }}
        />
      ))}
    </div>
  </div>
);

export function HeroScene() {
  const webglSupported = isWebGLAvailable();

  if (!webglSupported) {
    return <HeroFallback />;
  }

  return (
    <div className="w-full h-full absolute inset-0 -z-10 bg-gradient-to-b from-[#2e026d] to-[#150030]">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#fff" />
        <pointLight position={[-10, -10, -5]} intensity={1} color="#ff00ff" />

        <Stars radius={50} depth={20} count={3000} factor={4} saturation={1} fade speed={1} />

        <Suspense fallback={null}>
          <Mascot />
          <AlphabetBlock />
        </Suspense>

        <FloatingShapes />
        <CameraRig />
      </Canvas>
    </div>
  );
}

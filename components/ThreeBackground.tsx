import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Define R3F elements as any to bypass TypeScript intrinsic element checks
const InstancedMesh = 'instancedMesh' as any;
const DodecahedronGeometry = 'dodecahedronGeometry' as any;
const MeshPhongMaterial = 'meshPhongMaterial' as any;
const Mesh = 'mesh' as any;
const OctahedronGeometry = 'octahedronGeometry' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;
const AmbientLight = 'ambientLight' as any;
const PointLight = 'pointLight' as any;
const Color = 'color' as any;
const Fog = 'fog' as any;

const ResponsiveCamera = () => {
  const { camera, size } = useThree();

  useEffect(() => {
    // If width is less than 768px (mobile), move camera back to see more of the scene
    const isMobile = size.width < 768;
    const targetZ = isMobile ? 30 : 20;
    
    // Smoothly update or set immediately
    camera.position.z = targetZ;
    camera.updateProjectionMatrix();
  }, [camera, size.width]);

  return null;
};

const ParticleField = () => {
  const count = 1000;
  const mesh = useRef<THREE.InstancedMesh>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      
      dummy.position.set(
        (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      dummy.scale.set(s, s, s);
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.updateMatrix();
      
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <InstancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <DodecahedronGeometry args={[0.2, 0]} />
      <MeshPhongMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.5} />
    </InstancedMesh>
  );
};

const CyberShape = ({ position, color, speed }: { position: [number, number, number], color: string, speed: number }) => {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current) {
        ref.current.rotation.x += speed;
        ref.current.rotation.y += speed * 0.5;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <Mesh ref={ref} position={position}>
            <OctahedronGeometry args={[1, 0]} />
            <MeshStandardMaterial 
                color={color} 
                wireframe 
                emissive={color}
                emissiveIntensity={2}
                transparent
                opacity={0.8}
            />
        </Mesh>
    </Float>
  );
};

const ThreeBackground = () => {
  return (
    <div className="fixed inset-0 z-0 bg-cyber-black pointer-events-none">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={75} />
        <ResponsiveCamera />
        <Color attach="background" args={['#020617']} />
        <Fog attach="fog" args={['#020617', 10, 50]} />
        
        <AmbientLight intensity={0.5} />
        <PointLight position={[10, 10, 10]} color="#00f0ff" intensity={1} />
        <PointLight position={[-10, -10, -10]} color="#ff00ff" intensity={1} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <ParticleField />
        
        <CyberShape position={[-10, 5, -5]} color="#00f0ff" speed={0.01} />
        <CyberShape position={[10, -5, -8]} color="#ff00ff" speed={0.005} />
        <CyberShape position={[0, 8, -10]} color="#7000ff" speed={0.008} />
      </Canvas>
    </div>
  );
};

export default ThreeBackground;
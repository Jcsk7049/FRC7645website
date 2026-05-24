import React, { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Loads and auto-scales a real GLB model
function GLBModel({ url }) {
  const { scene } = useGLTF(url);
  const ref = useRef();

  React.useLayoutEffect(() => {
    if (!ref.current) return;
    const box = new THREE.Box3().setFromObject(ref.current);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      ref.current.scale.setScalar(4 / maxDim);
      // Recompute after scaling
      box.setFromObject(ref.current);
      const center = box.getCenter(new THREE.Vector3());
      // Center on X/Z, lift so the model's bottom sits on y=0
      ref.current.position.x -= center.x;
      ref.current.position.y -= center.y;
      ref.current.position.z -= center.z;
    }
  }, [scene]);

  return <primitive ref={ref} object={scene} />;
}

// Placeholder assembly shown when no GLB is uploaded
function RobotAssembly({ exploded }) {
  const frontLeftWheel = useRef();
  const frontRightWheel = useRef();
  const backLeftWheel = useRef();
  const backRightWheel = useRef();
  const topGearRef = useRef();
  const bottomGearRef = useRef();
  const shaftRef = useRef();

  const targetOffset = exploded ? 1.5 : 0;
  const gearTargetOffset = exploded ? 1.2 : 0;
  const shaftTargetOffset = exploded ? 0.6 : 0;

  useFrame((state, delta) => {
    const speed = 5 * delta;
    if (frontLeftWheel.current) {
      frontLeftWheel.current.position.x = THREE.MathUtils.lerp(frontLeftWheel.current.position.x, -2 - targetOffset, speed);
      frontLeftWheel.current.position.z = THREE.MathUtils.lerp(frontLeftWheel.current.position.z, 2 + targetOffset, speed);
      frontLeftWheel.current.rotation.x += 1 * delta;
    }
    if (frontRightWheel.current) {
      frontRightWheel.current.position.x = THREE.MathUtils.lerp(frontRightWheel.current.position.x, 2 + targetOffset, speed);
      frontRightWheel.current.position.z = THREE.MathUtils.lerp(frontRightWheel.current.position.z, 2 + targetOffset, speed);
      frontRightWheel.current.rotation.x += 1 * delta;
    }
    if (backLeftWheel.current) {
      backLeftWheel.current.position.x = THREE.MathUtils.lerp(backLeftWheel.current.position.x, -2 - targetOffset, speed);
      backLeftWheel.current.position.z = THREE.MathUtils.lerp(backLeftWheel.current.position.z, -2 - targetOffset, speed);
      backLeftWheel.current.rotation.x += 1 * delta;
    }
    if (backRightWheel.current) {
      backRightWheel.current.position.x = THREE.MathUtils.lerp(backRightWheel.current.position.x, 2 + targetOffset, speed);
      backRightWheel.current.position.z = THREE.MathUtils.lerp(backRightWheel.current.position.z, -2 - targetOffset, speed);
      backRightWheel.current.rotation.x += 1 * delta;
    }
    if (topGearRef.current) {
      topGearRef.current.position.y = THREE.MathUtils.lerp(topGearRef.current.position.y, 1.8 + gearTargetOffset, speed);
      topGearRef.current.rotation.y += 1.5 * delta;
    }
    if (bottomGearRef.current) {
      bottomGearRef.current.position.y = THREE.MathUtils.lerp(bottomGearRef.current.position.y, 0.6 + gearTargetOffset * 0.4, speed);
      bottomGearRef.current.rotation.y -= 1.0 * delta;
    }
    if (shaftRef.current) {
      shaftRef.current.position.y = THREE.MathUtils.lerp(shaftRef.current.position.y, 1.0 + shaftTargetOffset, speed);
    }
  });

  const renderGearTeeth = (teethCount, radius, thickness) => {
    const teeth = [];
    for (let i = 0; i < teethCount; i++) {
      const angle = (i / teethCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      teeth.push(
        <mesh key={i} position={[x, 0, z]} rotation={[0, -angle, 0]}>
          <boxGeometry args={[0.2, thickness, 0.25]} />
          <meshStandardMaterial color="#B45309" roughness={0.4} metalness={0.8} />
        </mesh>
      );
    }
    return teeth;
  };

  return (
    <group position={[0, -0.5, 0]}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.2, 3.2]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh ref={shaftRef} position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 1.8, 16]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.1} />
      </mesh>
      <group ref={topGearRef} position={[0, 1.8, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.7, 0.7, 0.2, 32]} />
          <meshStandardMaterial color="#B45309" metalness={0.8} roughness={0.4} />
        </mesh>
        {renderGearTeeth(16, 0.7, 0.2)}
      </group>
      <group ref={bottomGearRef} position={[0, 0.6, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[1.1, 1.1, 0.15, 32]} />
          <meshStandardMaterial color="#D97706" metalness={0.8} roughness={0.4} />
        </mesh>
        {renderGearTeeth(24, 1.1, 0.15)}
      </group>
      <group ref={frontLeftWheel} position={[-2, 0.2, 2]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 0.6, 24]} />
          <meshStandardMaterial color="#1E293B" roughness={0.8} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.65, 8]} />
          <meshStandardMaterial color="#B45309" metalness={0.9} />
        </mesh>
      </group>
      <group ref={frontRightWheel} position={[2, 0.2, 2]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 0.6, 24]} />
          <meshStandardMaterial color="#1E293B" roughness={0.8} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.65, 8]} />
          <meshStandardMaterial color="#B45309" metalness={0.9} />
        </mesh>
      </group>
      <group ref={backLeftWheel} position={[-2, 0.2, -2]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 0.6, 24]} />
          <meshStandardMaterial color="#1E293B" roughness={0.8} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.65, 8]} />
          <meshStandardMaterial color="#B45309" metalness={0.9} />
        </mesh>
      </group>
      <group ref={backRightWheel} position={[2, 0.2, -2]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 0.6, 24]} />
          <meshStandardMaterial color="#1E293B" roughness={0.8} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.65, 8]} />
          <meshStandardMaterial color="#B45309" metalness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

export default function RobotViewer({ exploded, glbUrl }) {
  return (
    <Canvas shadows dpr={[1, 2]} style={{ background: "#E5E5E5", width: "100%", height: "100%" }}>
      <PerspectiveCamera makeDefault position={[6, 5, 8]} fov={50} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0001} />
      <directionalLight position={[-10, 5, -10]} intensity={0.4} />

      {glbUrl ? (
        <Suspense fallback={null}>
          <GLBModel url={glbUrl} />
        </Suspense>
      ) : (
        <RobotAssembly exploded={exploded} />
      )}

<OrbitControls enablePan={true} enableZoom={true} minDistance={3} maxDistance={15} maxPolarAngle={Math.PI} />
    </Canvas>
  );
}

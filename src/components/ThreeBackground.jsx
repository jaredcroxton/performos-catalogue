import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Float, Sparkles } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

const THEMES = [
  { bg: "#05090f", primary: "#b8e020", secondary: "#1a4060", fog: "#05090f" },
  { bg: "#0f0510", primary: "#d4809a", secondary: "#6a2050", fog: "#0f0510" },
  { bg: "#030a1a", primary: "#3a6ab0", secondary: "#0d2a60", fog: "#030a1a" },
  { bg: "#0c0800", primary: "#c0a050", secondary: "#603800", fog: "#0c0800" },
];

const FLOAT_SHAPES = [
  { pos: [4.5, 2.5, -14], scale: 2.0, speed: 0.9, type: 'icosahedron' },
  { pos: [-5.5, -1.5, -18], scale: 2.8, speed: 0.7, type: 'octahedron' },
  { pos: [1.5, -3.5, -10], scale: 1.4, speed: 1.2, type: 'box' },
  { pos: [-2.5, 4.5, -22], scale: 4.0, speed: 0.5, type: 'icosahedron' },
  { pos: [7.0, 0.5, -26], scale: 3.0, speed: 0.6, type: 'octahedron' },
  { pos: [-7.0, 2.0, -20], scale: 2.2, speed: 0.8, type: 'box' },
  { pos: [0.0, 6.0, -16], scale: 1.8, speed: 1.1, type: 'icosahedron' },
  { pos: [-4.0, -5.0, -24], scale: 3.5, speed: 0.4, type: 'octahedron' },
  { pos: [8.0, -2.0, -18], scale: 2.5, speed: 0.65, type: 'box' },
  { pos: [3.0, -6.0, -12], scale: 1.6, speed: 0.85, type: 'icosahedron' },
];

function FloatingShape({ position, scale, speed, type, primaryColorRef }) {
  const meshRef = useRef();
  const mat = useRef();

  useFrame((state, dt) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += dt * 0.18 * speed;
    meshRef.current.rotation.z += dt * 0.22 * speed;
    if (mat.current) {
      mat.current.emissive.lerp(primaryColorRef.current, dt * 1.2);
    }
  });

  return (
    <Float speed={speed * 1.8} rotationIntensity={0.7} floatIntensity={0.9} floatingRange={[-0.8, 0.8]}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {type === 'icosahedron' && <icosahedronGeometry args={[1, 0]} />}
        {type === 'octahedron' && <octahedronGeometry args={[1, 0]} />}
        {type === 'box' && <boxGeometry args={[1.2, 1.2, 1.2]} />}
        <meshStandardMaterial
          ref={mat}
          color="#000000"
          emissive="#ffffff"
          emissiveIntensity={0.08}
          wireframe
          transparent
          opacity={0.18}
        />
      </mesh>
    </Float>
  );
}

function GlowOrb({ position, scale, colorRef, opacity = 0.04 }) {
  const meshRef = useRef();
  useFrame((_, dt) => {
    if (meshRef.current) {
      meshRef.current.material.color.lerp(colorRef.current, dt * 1.5);
    }
  });
  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <sphereGeometry args={[1, 24, 24]} />
      <meshBasicMaterial transparent opacity={opacity} />
    </mesh>
  );
}

function RingShape({ position, rotationOffset = [0, 0, 0], colorRef }) {
  const meshRef = useRef();
  const matRef = useRef();
  useFrame((state, dt) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = rotationOffset[0] + Math.sin(state.clock.elapsedTime * 0.25) * 0.8;
    meshRef.current.rotation.y += dt * 0.15;
    if (matRef.current) matRef.current.emissive.lerp(colorRef.current, dt * 1.0);
  });
  return (
    <mesh ref={meshRef} position={position} rotation={[0, rotationOffset[1], rotationOffset[2]]}>
      <torusGeometry args={[6, 0.08, 12, 80]} />
      <meshStandardMaterial
        ref={matRef}
        color="#000000"
        emissive="#ffffff"
        emissiveIntensity={0.15}
        transparent
        opacity={0.25}
      />
    </mesh>
  );
}

function GridFloor({ colorRef }) {
  const matRef = useRef();
  useFrame((_, dt) => {
    if (matRef.current) {
      matRef.current.color.lerp(colorRef.current, dt * 1.2);
    }
  });
  return (
    <mesh position={[0, -4, -15]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[100, 100, 40, 40]} />
      <meshBasicMaterial ref={matRef} wireframe transparent opacity={0.06} />
    </mesh>
  );
}

function Scene({ activeIndex }) {
  const { gl, camera, scene } = useThree();

  const bgColorRef = useRef(new THREE.Color(THEMES[0].bg));
  const primaryColorRef = useRef(new THREE.Color(THEMES[0].primary));
  const secondaryColorRef = useRef(new THREE.Color(THEMES[0].secondary));

  const light1Ref = useRef();
  const light2Ref = useRef();
  const light3Ref = useRef();

  const targetBg = useMemo(() => new THREE.Color(THEMES[activeIndex].bg), [activeIndex]);
  const targetPrimary = useMemo(() => new THREE.Color(THEMES[activeIndex].primary), [activeIndex]);
  const targetSecondary = useMemo(() => new THREE.Color(THEMES[activeIndex].secondary), [activeIndex]);

  const fogRef = useRef(new THREE.FogExp2(THEMES[0].bg, 0.018));

  useFrame((state, dt) => {
    const speed = dt * 1.8;
    bgColorRef.current.lerp(targetBg, speed);
    primaryColorRef.current.lerp(targetPrimary, speed);
    secondaryColorRef.current.lerp(targetSecondary, speed);

    gl.setClearColor(bgColorRef.current, 1);

    if (fogRef.current) {
      fogRef.current.color.copy(bgColorRef.current);
      scene.fog = fogRef.current;
    }

    if (light1Ref.current) light1Ref.current.color.copy(primaryColorRef.current);
    if (light2Ref.current) light2Ref.current.color.copy(secondaryColorRef.current);
    if (light3Ref.current) light3Ref.current.color.copy(primaryColorRef.current);

    const targetX = Math.sin(state.clock.elapsedTime * 0.15) * 1.8 + state.pointer.x * 3.5;
    const targetY = Math.cos(state.clock.elapsedTime * 0.12) * 0.9 + state.pointer.y * 2.5;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, dt * 2.0);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, dt * 2.0);
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.06} />
      <pointLight ref={light1Ref} position={[6, 8, -4]} intensity={12} distance={50} decay={2} />
      <pointLight ref={light2Ref} position={[-8, -4, -12]} intensity={8} distance={40} decay={2} />
      <pointLight ref={light3Ref} position={[0, 0, 2]} intensity={2} distance={20} decay={2} />

      <Stars
        radius={100}
        depth={80}
        count={3500}
        factor={5}
        saturation={0.3}
        fade
        speed={1.5}
      />
      
      <Sparkles count={250} scale={35} size={3} speed={1.2} opacity={0.6} color="#ffffff" position={[0, 0, -10]} />

      <GridFloor colorRef={primaryColorRef} />

      {FLOAT_SHAPES.map((s, i) => (
        <FloatingShape
          key={i}
          position={s.pos}
          scale={s.scale}
          speed={s.speed}
          type={s.type}
          primaryColorRef={primaryColorRef}
        />
      ))}

      <GlowOrb position={[4, 3, -6]} scale={6} colorRef={primaryColorRef} opacity={0.05} />
      <GlowOrb position={[-5, -3, -10]} scale={9} colorRef={secondaryColorRef} opacity={0.04} />
      <GlowOrb position={[0, 0, -18]} scale={14} colorRef={primaryColorRef} opacity={0.02} />
      <GlowOrb position={[8, -4, -14]} scale={8} colorRef={secondaryColorRef} opacity={0.03} />
      <GlowOrb position={[-8, 5, -20]} scale={12} colorRef={primaryColorRef} opacity={0.02} />

      <RingShape position={[0, 0, -15]} colorRef={primaryColorRef} />
      <RingShape position={[0, 0, -22]} rotationOffset={[Math.PI / 4, 0, Math.PI / 6]} colorRef={secondaryColorRef} />

      <EffectComposer disableNormalPass>
        <Bloom
          intensity={1.4}
          luminanceThreshold={0.25}
          luminanceSmoothing={0.85}
          mipmapBlur
          radius={0.7}
        />
        <Noise opacity={0.045} blendFunction={BlendFunction.OVERLAY} />
        <ChromaticAberration offset={[0.0015, 0.0015]} blendFunction={BlendFunction.NORMAL} radialModulation={true} modulationOffset={0.6} />
        <Vignette eskil={false} offset={0.15} darkness={0.9} blendFunction={BlendFunction.NORMAL} />
      </EffectComposer>
    </>
  );
}

export function ThreeBackground({ activeIndex }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 60 }}
      style={{ position: "fixed", inset: 0, zIndex: 0 }}
      gl={{ antialias: true, alpha: false }}
    >
      <Scene activeIndex={activeIndex} />
    </Canvas>
  );
}

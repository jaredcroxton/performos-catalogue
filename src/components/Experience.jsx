import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Shape, ShapeGeometry } from "three";
import { texture as tslTexture, color as tslColor } from "three/tsl";

const CARD_W = 2;
const CARD_H = 2.7;

function makeRoundedRect(w, h, r) {
  const s = new Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

const CARD_SHAPE = makeRoundedRect(CARD_W, CARD_H, 0.13);

const SLOTS = [
  { x: 0,   z: 0,    ry: 0,    s: 1.00 },
  { x: 2.2, z: -1.0, ry: 0.5,  s: 0.70 },
  { x: 3.8, z: -2.2, ry: 0.75, s: 0.50 },
  { x: 5.2, z: -3.0, ry: 0.9,  s: 0.00 },
];

function lerp(a, b, t) { return a + (b - a) * t; }

function getCircularOffset(index, position, N) {
  let offset = index - position;
  while (offset > N / 2) offset -= N;
  while (offset < -N / 2) offset += N;
  return offset;
}

function getLayout(offset) {
  const abs = Math.abs(offset);
  const sgn = Math.sign(offset) || 1;
  if (abs >= 3.5) return { x: 0, z: 0, ry: 0, s: 0, visible: false };
  const lo = Math.min(Math.floor(abs), 3);
  const hi = Math.min(lo + 1, 3);
  const frac = abs - lo;
  const a = SLOTS[lo];
  const b = SLOTS[hi];
  return {
    x: sgn * lerp(a.x, b.x, frac),
    z: lerp(a.z, b.z, frac),
    ry: sgn * lerp(a.ry, b.ry, frac),
    s: lerp(a.s, b.s, frac),
    visible: true,
  };
}

function CarouselCard({ index, canvasTexture, positionRef, count }) {
  const ref = useRef();
  const geo = useMemo(() => new ShapeGeometry(CARD_SHAPE, 3), []);

  const colorNode = useMemo(() => {
    if (canvasTexture) return tslTexture(canvasTexture);
    return tslColor("#e8e4da");
  }, [canvasTexture]);

  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const offset = getCircularOffset(index, positionRef.current, count);
    const lay = getLayout(offset);
    m.visible = lay.visible;
    if (lay.visible) {
      m.position.set(lay.x, 0, lay.z);
      m.rotation.y = lay.ry;
      m.scale.setScalar(lay.s);
    }
  });

  return (
    <mesh ref={ref} geometry={geo}>
      <meshStandardNodeMaterial colorNode={colorNode} />
    </mesh>
  );
}

export const Experience = ({ products, textures, positionRef, velocityRef, isDragging, onActiveChange }) => {
  const N = products.length;
  const activeIndexRef = useRef(0);

  useFrame((_, dt) => {
    if (!isDragging.current) {
      velocityRef.current *= Math.pow(0.94, dt * 60);
      positionRef.current += velocityRef.current * dt;

      if (Math.abs(velocityRef.current) < 0.05) {
        const snap = Math.round(positionRef.current);
        positionRef.current = lerp(positionRef.current, snap, dt * 8);
        if (Math.abs(positionRef.current - snap) < 0.001) {
          positionRef.current = snap;
          velocityRef.current = 0;
        }
      }
    }

    const active = ((Math.round(positionRef.current) % N) + N) % N;
    if (active !== activeIndexRef.current) {
      activeIndexRef.current = active;
      onActiveChange(active);
    }
  });

  return (
    <>
      <ambientLight intensity={2.2} />
      <directionalLight position={[3, 5, 5]} intensity={0.5} />
      {products.map((product, i) => (
        <CarouselCard
          key={i}
          index={i}
          canvasTexture={textures ? textures[i] : null}
          positionRef={positionRef}
          count={N}
        />
      ))}
    </>
  );
};

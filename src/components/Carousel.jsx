import { useRef, useEffect, useCallback, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";

const getCardSize = () => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (vw < 600) return {
    width: Math.min(vw - 44, 360),
    height: Math.min(Math.floor(vh * 0.64), 520),
  };
  if (vw < 900) return { width: 360, height: 470 };
  return { width: 440, height: 580 };
};

// Drag sensitivity: how many pixels of swipe = 1 card. Scales with card width.
// On mobile (280px card) → ~154px per card, very responsive.
const getPixelsPerCard = (cardWidth) => cardWidth * 0.55;

function getCircularOffset(index, position, N) {
  let offset = index - position;
  while (offset > N / 2) offset -= N;
  while (offset < -N / 2) offset += N;
  return offset;
}

function getCardStyle(offset, cardWidth) {
  const abs = Math.abs(offset);
  const sgn = Math.sign(offset) || 0;

  if (abs > 2.6) {
    return { opacity: 0, pointerEvents: "none", zIndex: 0 };
  }

  // Tighter spread on mobile so side cards peek in visibly
  const spread = cardWidth < 360 ? 0.66 : 0.82;
  const x = sgn * (abs * cardWidth * spread);
  const scale = Math.max(0.18, 1 - abs * 0.46);
  const rotY = -sgn * Math.min(abs * 54, 74);
  const opacity = Math.max(0, 1 - abs * 0.44);
  const brightness = Math.max(0.16, 1 - abs * 0.46);
  const zIndex = Math.round(20 - abs * 7);

  return {
    transform: `translateX(${x}px) scale(${scale}) rotateY(${rotY}deg)`,
    opacity,
    zIndex,
    filter: `brightness(${brightness})`,
  };
}

function ProductCard({ product, isActive, onDemoRequest, cardWidth }) {
  const isDark = product.isDark;
  const textColor = isDark ? "#ffffff" : "#0a0a0a";
  const textMuted = isDark ? "rgba(255,255,255,0.7)" : "rgba(10,10,10,0.65)";
  const textFaint = isDark ? "rgba(255,255,255,0.45)" : "rgba(10,10,10,0.4)";
  const borderColor = isDark ? "rgba(255,255,255,0.18)" : "rgba(10,10,10,0.15)";
  const dividerColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(10,10,10,0.12)";

  // Responsive sizing based on card width
  const sm = cardWidth < 360;
  const nameSz1 = sm ? 36 : 56;
  const nameSz2 = sm ? 30 : 48;
  const taglineSz = sm ? 13 : 16;
  const descSz = sm ? 11.5 : 14;
  const statusSz = sm ? 9.5 : 11.5;
  const urlSz = sm ? 9 : 10.5;
  const pad = sm ? "20px 20px 18px" : "30px 32px 28px";
  const headerGap = sm ? 18 : 28;
  const nameGap = sm ? 12 : 22;
  const divGap = sm ? "12px 0 10px" : "20px 0 18px";
  const watermarkSz = sm ? 88 : 148;

  // Mouse tilt — desktop only
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

  const handlePointerMove = (e) => {
    if (!isActive || sm) return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handlePointerLeave = () => { x.set(0); y.set(0); };

  const textVariants = {
    inactive: { y: 15, opacity: 0 },
    active: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        width: "100%", height: "100%",
        borderRadius: 24, overflow: "hidden",
        background: product.cardBg,
        backdropFilter: "blur(40px) saturate(1.5)",
        WebkitBackdropFilter: "blur(40px) saturate(1.5)",
        border: `1px solid ${borderColor}`,
        boxShadow: `inset 0 1px 1px rgba(255,255,255,0.15), 0 0 60px ${product.glowColor}25, 0 24px 80px rgba(0,0,0,0.6)`,
        display: "flex", flexDirection: "column",
        padding: pad, position: "relative",
        rotateX: sm ? 0 : rotateX,
        rotateY: sm ? 0 : rotateY,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Top sheen */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 24,
        background: "linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 20%, transparent 60%)",
        pointerEvents: "none",
      }} />

      {/* Number watermark */}
      <div style={{
        position: "absolute", bottom: 16, right: sm ? 16 : 28,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: watermarkSz, fontWeight: 700, lineHeight: 1,
        color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)",
        pointerEvents: "none", userSelect: "none", letterSpacing: "-5px",
        transform: "translateZ(-20px)",
      }}>
        {product.number.split(" / ")[0]}
      </div>

      {/* Decorative glow rings */}
      <div style={{
        position: "absolute", right: -55, top: "22%",
        width: sm ? 160 : 230, height: sm ? 160 : 230, borderRadius: "50%",
        border: `1px solid ${product.glowColor}40`,
        boxShadow: `0 0 120px ${product.glowColor}30`,
        pointerEvents: "none",
        animation: "pulse-ring 4s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", right: -20, top: "18%",
        width: sm ? 90 : 130, height: sm ? 90 : 130, borderRadius: "50%",
        border: `1px solid ${product.glowColor}30`,
        pointerEvents: "none",
        animation: "pulse-ring-reverse 3s ease-in-out infinite",
      }} />

      {/* Header: icon + category */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: headerGap, zIndex: 1 }}>
        <svg width={sm ? 24 : 32} height={sm ? 24 : 32} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="15" fill={isDark ? "rgba(255,255,255,0.12)" : "rgba(10,10,10,0.88)"} />
          <circle cx="16" cy="16" r="9" fill={product.glowColor} />
          <circle cx="16" cy="16" r="4" fill={isDark ? "rgba(10,10,10,0.8)" : "rgba(255,255,255,0.8)"} />
        </svg>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
          letterSpacing: "1.6px", textTransform: "uppercase", color: textFaint,
        }}>
          {product.number}
        </span>
      </div>

      {/* Product name */}
      <motion.div
        initial="inactive"
        animate={isActive ? "active" : "inactive"}
        variants={{ active: { transition: { staggerChildren: 0.08 } }, inactive: {} }}
        style={{ flex: 1, display: "flex", flexDirection: "column", zIndex: 1 }}
      >
        <div style={{ marginBottom: nameGap, flex: "0 0 auto" }}>
          {product.name.split(" ").map((word, i) => (
            <motion.div key={i} variants={textVariants} style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: i === 0 ? nameSz1 : nameSz2,
              lineHeight: 1.0, letterSpacing: "-1.5px",
              color: i === 0 ? textColor : isDark ? "rgba(255,255,255,0.8)" : "rgba(10,10,10,0.75)",
              display: "block",
            }}>
              {word}
            </motion.div>
          ))}
        </div>

        {/* Tagline */}
        <motion.p variants={textVariants} style={{
          margin: `0 0 ${sm ? 10 : 14}px`,
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: taglineSz, fontWeight: 600, lineHeight: 1.45, color: textColor,
        }}>
          {product.tagline}
        </motion.p>

        {/* Description */}
        <motion.p variants={textVariants} style={{
          margin: 0,
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: descSz, lineHeight: 1.7, color: textMuted, flex: "1 1 auto",
        }}>
          {product.description}
        </motion.p>
      </motion.div>

      {/* Divider */}
      <div style={{ height: 1, background: dividerColor, margin: divGap, zIndex: 1 }} />

      {/* Footer */}
      <div style={{ display: "flex", flexDirection: "column", gap: sm ? 6 : 8, zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            {product.status === "Active" && (
              <span className="status-dot" style={{
                width: sm ? 6 : 8, height: sm ? 6 : 8, borderRadius: "50%",
                background: product.glowColor, boxShadow: `0 0 10px ${product.glowColor}`,
                display: "inline-block", flexShrink: 0,
              }} />
            )}
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: statusSz,
              letterSpacing: "1.6px", textTransform: "uppercase", color: textMuted, fontWeight: 600,
            }}>
              {product.status}
            </span>
          </div>
          {/* Try it Live — in footer so it never crowds the title */}
          {product.name === "Pocket Customer" && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onDemoRequest(product); }}
              style={{
                padding: sm ? "4px 10px" : "5px 12px",
                background: "#d4ff3b", color: "#0a0a0a",
                border: "none", borderRadius: 4, cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700, fontSize: sm ? 9 : 11,
                letterSpacing: "0.5px", flexShrink: 0,
              }}
            >
              Try it Live
            </button>
          )}
        </div>
        <a
          href={`https://${product.url}`}
          target="_blank" rel="noopener noreferrer"
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: urlSz,
            letterSpacing: "0.5px", color: textFaint, textDecoration: "none",
          }}
          className="custom-link"
        >
          {product.url}
        </a>
      </div>
    </motion.div>
  );
}

// Simple WebAudio tick sound
function useUIAudio() {
  const ctxRef = useRef(null);
  
  useEffect(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    ctxRef.current = new AudioContext();
    return () => ctxRef.current?.close();
  }, []);

  const playTick = useCallback(() => {
    if (!ctxRef.current) return;
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }, []);
  
  return { playTick };
}

export function Carousel({ products, onActiveChange, onDemoRequest }) {
  const N = products.length;
  const positionRef = useRef(0);
  const velocityRef = useRef(0);
  const isDragging = useRef(false);
  // responsive card size state
  const [cardSize, setCardSize] = useState(getCardSize());
  const cardSizeRef = useRef(getCardSize());
  useEffect(() => {
    const handleResize = () => {
      const s = getCardSize();
      setCardSize(s);
      cardSizeRef.current = s;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const cardRefs = useRef([]);
  const activeIndexRef = useRef(0);
  const rafRef = useRef();

  const { playTick } = useUIAudio();
  const [activeIdx, setActiveIdx] = useState(0);

  const updateCards = useCallback(() => {
    const pos = positionRef.current;
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const offset = getCircularOffset(i, pos, N);
      const s = getCardStyle(offset, cardSizeRef.current.width);
      card.style.transform = s.transform || "";
      card.style.opacity = String(s.opacity ?? 1);
      card.style.zIndex = String(s.zIndex ?? 0);
      card.style.filter = s.filter || "";
      card.style.pointerEvents = s.pointerEvents || "auto";
    });
  }, [N]);

  useEffect(() => {
    let prev = performance.now();
    function animate(now) {
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      if (!isDragging.current) {
        velocityRef.current *= Math.pow(0.85, dt * 60);
        positionRef.current += velocityRef.current * dt;
        if (Math.abs(velocityRef.current) < 0.04) {
          const snap = Math.round(positionRef.current);
          positionRef.current += (snap - positionRef.current) * Math.min(dt * 9, 1);
          if (Math.abs(positionRef.current - snap) < 0.001) {
            positionRef.current = snap;
            velocityRef.current = 0;
          }
        }
      }
      updateCards();
      const newActive = ((Math.round(positionRef.current) % N) + N) % N;
      if (newActive !== activeIndexRef.current) {
        activeIndexRef.current = newActive;
        setActiveIdx(newActive);
        onActiveChange(newActive);
        playTick();
      }
      rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [N, updateCards, onActiveChange, playTick]);

  const onPointerDown = useCallback((e) => {
    isDragging.current = true;
    lastX.current = e.clientX;
    lastTime.current = performance.now();
    velocityRef.current = 0;

    function onMove(e) {
      const now = performance.now();
      const dt = Math.max((now - lastTime.current) / 1000, 0.001);
      const dx = e.clientX - lastX.current;
      const dPos = -(dx / getPixelsPerCard(cardSizeRef.current.width));
      positionRef.current += dPos;
      velocityRef.current = Math.min(Math.max(dPos / dt, -3.5), 3.5);
      lastX.current = e.clientX;
      lastTime.current = now;
    }

    function onUp() {
      isDragging.current = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, []);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center cursor-drag-area"
      style={{ perspective: "1600px", perspectiveOrigin: "50% 50%", touchAction: "none" }}
      onPointerDown={onPointerDown}
    >
      <div style={{ position: "relative", width: cardSize.width, height: cardSize.height }}>
        {products.map((product, i) => (
          <div
            key={i}
            ref={(el) => { cardRefs.current[i] = el; }}
            className="card-wrapper absolute inset-0"
            style={{ transformStyle: "preserve-3d" }}
          >
            <ProductCard product={product} isActive={i === activeIdx} onDemoRequest={onDemoRequest} cardWidth={cardSize.width} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Duplicate Carousel implementation removed

import { useState, useEffect, useRef } from "react";
import { ThreeBackground } from "./components/ThreeBackground";
import { Carousel } from "./components/Carousel";

const PRODUCTS = [
  {
    number: "01 / 04 · Analytics",
    name: "Performlytics",
    tagline: "Ask anything about your revenue.",
    description:
      "An AI operator for business intelligence. Reads across your stack, reasons over your data, answers in plain language.",
    status: "Active",
    url: "performos.com.au/performlytics",
    cardBg: "linear-gradient(145deg, rgba(8,14,10,0.92) 0%, rgba(5,18,8,0.88) 100%)",
    isDark: true,
    glowColor: "#d4ff3b",
  },
  {
    number: "02 / 04 · Voice AI",
    name: "Pocket Customer",
    tagline: "Don't practise on customers.",
    description:
      "A voice-first sales coach on every call. Listens live, flags drift, delivers coaching nudges in real time.",
    status: "Active",
    url: "performos.com.au/pocket-customer",
    cardBg: "linear-gradient(145deg, rgba(40,16,24,0.94) 0%, rgba(20,8,12,0.90) 100%)",
    isDark: true,
    glowColor: "#e89cb8",
  },
  {
    number: "03 / 04 · People Ops",
    name: "PulseCheck360",
    tagline: "See it before they say it.",
    description:
      "Weekly 1:1s your team actually looks forward to. Surfaces performance roadblocks and energy dips before they impact the business.",
    status: "Active",
    url: "performos.com.au/pulsecheck",
    cardBg: "linear-gradient(145deg, rgba(26,35,64,0.94) 0%, rgba(13,21,48,0.90) 100%)",
    isDark: true,
    glowColor: "#4a7fcc",
  },
  {
    number: "04 / 04 · Learning",
    name: "LearnOS",
    tagline: "Learning built around your actual work.",
    description:
      "A learning management system built around your company's real content, not generic modules.",
    status: "Active",
    url: "performos.com.au/learnos",
    cardBg: "linear-gradient(145deg, rgba(40,32,16,0.94) 0%, rgba(20,16,8,0.90) 100%)",
    isDark: true,
    glowColor: "#e8cc7a",
  },
];

export default function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = PRODUCTS[activeIndex];

  const [demoProduct, setDemoProduct] = useState(null);

  const handleDemoRequest = (product) => {
    setDemoProduct(product);
  };

  const closeDemo = () => {
    setDemoProduct(null);
  };

  const cursorRef = useRef(null);

  useEffect(() => {
    const handleMove = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
    };
    
    const handleMouseOver = (e) => {
      if (e.target.closest("a") || e.target.closest("button") || e.target.closest(".custom-link")) {
        cursorRef.current?.classList.add("hovering-link");
      } else {
        cursorRef.current?.classList.remove("hovering-link");
      }
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none">
      <div ref={cursorRef} className="custom-cursor" />

      {/* 3D Background — fixed, behind everything */}
      <ThreeBackground activeIndex={activeIndex} />

      {/* Nav */}
      <nav
        className="absolute top-0 left-0 right-0 flex items-center justify-between"
        style={{
          height: 64,
          zIndex: 10,
          padding: "0 20px",
          background: "linear-gradient(to bottom, rgba(5,9,20,0.9) 0%, rgba(5,9,20,0) 100%)",
        }}
      >
        <span
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 22,
            letterSpacing: "-0.3px",
            color: "rgba(255,255,255,0.95)",
            textShadow: "0 2px 12px rgba(0,0,0,0.8)",
            flexShrink: 0,
          }}
        >
          Perform<em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.6)" }}>OS</em>
        </span>
        <span className="nav-catalogue"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "1.8px",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.7)",
            textShadow: "0 2px 12px rgba(0,0,0,0.8)",
          }}
        >
          The Catalogue · Vol. 01 · 2026
        </span>
        <button
          onClick={() => window.location.reload()}
          style={{
            flexShrink: 0,
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(212,255,59,0.5)",
            borderRadius: 4,
            padding: "3px 8px",
            cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.5px",
          }}
        >
          ↺
        </button>
      </nav>

      {/* Carousel */}
      <div className="absolute inset-0" style={{ zIndex: 5, paddingTop: 64, paddingBottom: 0 }}>
        <Carousel products={PRODUCTS} onActiveChange={setActiveIndex} onDemoRequest={handleDemoRequest} />
      </div>

      {/* Demo Modal */}
      {demoProduct && (
        <div className="modal-overlay" onClick={closeDemo}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeDemo}>✕</button>
            <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", marginBottom: "12px", color: "#fff" }}>
              Live Demo – {demoProduct.name}
            </h2>
            <p style={{ fontFamily: "'Inter', system-ui, sans-serif", marginBottom: "20px", color: "#fff" }}>
              Experience the AI‑powered feature in real‑time. (Placeholder – integrate webcam or video feed here.)
            </p>
            <div style={{ width: "100%", height: "300px", background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              Demo Area
            </div>
          </div>
        </div>
      )}

      {/* Edge Vignette overlay to fade out the sides */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          zIndex: 6, 
          background: "linear-gradient(90deg, #050a14 0%, rgba(5,10,20,0) 18%, rgba(5,10,20,0) 82%, #050a14 100%)" 
        }} 
      />

      {/* Footer wordmark and pagination */}
      <div
        className="absolute left-10 bottom-8 right-10 flex items-center justify-between"
        style={{ zIndex: 10, pointerEvents: "none" }}
      >
        <span
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 22,
            fontWeight: 400,
            color: "rgba(242,239,232,0.15)",
            letterSpacing: "-0.3px",
          }}
        >
          Powering High{" "}
          <em style={{ fontStyle: "italic", color: "rgba(242,239,232,0.08)" }}>Performance</em>
        </span>

        {/* Pagination Dots */}
        <div className="flex gap-3" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          {PRODUCTS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: activeIndex === i ? "rgba(242,239,232,0.6)" : "rgba(242,239,232,0.15)",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

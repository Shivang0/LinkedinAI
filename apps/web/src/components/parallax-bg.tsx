"use client";

import { useEffect, useState } from "react";

export function ParallaxBg() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1c2c] via-[#262b44] to-[#3a4466]" />

      {/* Pixel clouds - far layer */}
      <div
        className="absolute inset-0"
        style={{ transform: `translateX(${scrollY * 0.02}px)` }}
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={`cloud-far-${i}`}
            className="absolute bg-[#f4f4f4] opacity-20"
            style={{
              left: `${(i * 180) % 100}%`,
              top: `${10 + ((i * 7) % 20)}%`,
              width: "80px",
              height: "24px",
              clipPath:
                "polygon(10% 100%, 90% 100%, 100% 60%, 85% 20%, 60% 0%, 40% 0%, 15% 20%, 0% 60%)",
            }}
          />
        ))}
      </div>

      {/* Pixel clouds - mid layer */}
      <div
        className="absolute inset-0"
        style={{ transform: `translateX(${scrollY * 0.05}px)` }}
      >
        {[...Array(4)].map((_, i) => (
          <div
            key={`cloud-mid-${i}`}
            className="absolute bg-[#f4f4f4] opacity-30"
            style={{
              left: `${(i * 250 + 50) % 100}%`,
              top: `${15 + ((i * 12) % 25)}%`,
              width: "100px",
              height: "32px",
              clipPath:
                "polygon(10% 100%, 90% 100%, 100% 60%, 85% 20%, 60% 0%, 40% 0%, 15% 20%, 0% 60%)",
            }}
          />
        ))}
      </div>

      {/* Pixel mountains - far */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[30vh]"
        style={{ transform: `translateY(${scrollY * 0.1}px)` }}
      >
        <svg
          className="w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 40"
        >
          <polygon points="0,40 15,15 30,40" fill="#262b44" />
          <polygon points="20,40 40,8 60,40" fill="#262b44" />
          <polygon points="50,40 70,12 90,40" fill="#262b44" />
          <polygon points="80,40 100,18 120,40" fill="#262b44" />
        </svg>
      </div>

      {/* Pixel mountains - near */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[25vh]"
        style={{ transform: `translateY(${scrollY * 0.15}px)` }}
      >
        <svg
          className="w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 30"
        >
          <polygon points="-10,30 10,5 30,30" fill="#3a4466" />
          <polygon points="25,30 50,2 75,30" fill="#3a4466" />
          <polygon points="65,30 85,8 105,30" fill="#3a4466" />
        </svg>
      </div>

      {/* Ground with grass pattern */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16"
        style={{ transform: `translateY(${scrollY * 0.2}px)` }}
      >
        <div className="w-full h-full ground-pattern" />
      </div>

      {/* Floating pixel coins */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <div
            key={`coin-${i}`}
            className="absolute w-4 h-4 bg-[#feae34] border-2 border-[#e43b44]"
            style={{
              left: `${(i * 137 + 50) % 90}%`,
              top: `${(i * 73 + 20) % 70}%`,
              transform: `translateY(${Math.sin(scrollY * 0.01 + i) * 10}px)`,
              opacity: 0.4,
            }}
          />
        ))}
      </div>

      {/* Pixel stars */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-[#f4f4f4]"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 31) % 40}%`,
              opacity: 0.3 + (i % 3) * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

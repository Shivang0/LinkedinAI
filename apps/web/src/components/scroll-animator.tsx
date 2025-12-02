"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ScrollAnimatorProps {
  children: ReactNode;
  animation?: "up" | "left" | "right" | "scale" | "bounce";
  delay?: number;
  className?: string;
}

export function ScrollAnimator({
  children,
  animation = "up",
  delay = 0,
  className = "",
}: ScrollAnimatorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add("visible");
            }, delay);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  const animationClass = {
    up: "scroll-animate",
    left: "scroll-animate scroll-animate-left",
    right: "scroll-animate scroll-animate-right",
    scale: "scroll-animate scroll-animate-scale",
    bounce: "scroll-animate scroll-animate-bounce",
  }[animation];

  return (
    <div ref={ref} className={`${animationClass} ${className}`}>
      {children}
    </div>
  );
}

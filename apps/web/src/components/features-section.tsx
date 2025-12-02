"use client";

import { PenLine, Calendar, BarChart3, Zap, Clock, Users } from "lucide-react";
import { ScrollAnimator } from "./scroll-animator";

const features = [
  {
    icon: PenLine,
    title: "AI WRITER",
    description: "Generate engaging posts tailored to your voice.",
    color: "#e43b44",
  },
  {
    icon: Calendar,
    title: "SCHEDULER",
    description: "Post at optimal times for max engagement.",
    color: "#0099db",
  },
  {
    icon: BarChart3,
    title: "ANALYTICS",
    description: "Track performance and see what works.",
    color: "#63c74d",
  },
  {
    icon: Zap,
    title: "QUICK POST",
    description: "One-click publishing to LinkedIn.",
    color: "#feae34",
  },
  {
    icon: Clock,
    title: "CALENDAR",
    description: "Plan content weeks in advance.",
    color: "#b55088",
  },
  {
    icon: Users,
    title: "INSIGHTS",
    description: "Know your audience and grow.",
    color: "#0099db",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 relative bg-[#262b44]">
      {/* Brick pattern background */}
      <div className="absolute inset-0 brick-bg opacity-30" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <ScrollAnimator animation="up">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <p className="font-retro text-2xl text-[#feae34] mb-4">
              SELECT YOUR POWER-UPS
            </p>
            <h2 className="font-pixel text-lg md:text-xl text-[#f4f4f4] leading-relaxed text-shadow-pixel">
              FEATURES
            </h2>
            <div className="pixel-divider w-48 mx-auto mt-6" />
          </div>
        </ScrollAnimator>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <ScrollAnimator key={feature.title} animation="up" delay={index * 100}>
              <div
                className="bg-[#1a1c2c] border-4 border-[#f4f4f4] hover:border-[#feae34] transition-all duration-200 hover:translate-x-[3px] hover:translate-y-[3px] group h-full p-6"
                style={{ boxShadow: "6px 6px 0 #0a0a0f" }}
              >
                {/* Icon box */}
                <div
                  className="w-14 h-14 border-4 border-[#f4f4f4] flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: feature.color,
                    boxShadow: "3px 3px 0 #1a1c2c",
                  }}
                >
                  <feature.icon className="w-7 h-7 text-[#f4f4f4]" />
                </div>

                <h3 className="font-pixel text-xs text-[#f4f4f4] mb-3 text-shadow-pixel">
                  {feature.title}
                </h3>

                <p className="font-retro text-xl text-[#94a3b8] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </ScrollAnimator>
          ))}
        </div>
      </div>
    </section>
  );
}

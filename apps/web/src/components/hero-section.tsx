"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Star } from "lucide-react";
import { ScrollAnimator } from "./scroll-animator";

export function HeroSection() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <ScrollAnimator animation="scale">
            <div
              className="inline-flex items-center gap-3 px-5 py-2 border-4 border-[#feae34] bg-[#262b44] mb-8"
              style={{ boxShadow: "4px 4px 0 #1a1c2c" }}
            >
              <Star className="w-4 h-4 text-[#feae34]" />
              <span className="font-retro text-xl text-[#feae34]">
                POWER UP YOUR LINKEDIN
              </span>
              <Star className="w-4 h-4 text-[#feae34]" />
            </div>
          </ScrollAnimator>

          {/* Main title */}
          <ScrollAnimator animation="up" delay={100}>
            <h1 className="font-pixel text-xl md:text-3xl lg:text-4xl text-[#f4f4f4] leading-relaxed mb-6 text-shadow-pixel">
              Write Better
              <br />
              <span className="text-[#63c74d]">LinkedIn Posts</span>
            </h1>
          </ScrollAnimator>

          <ScrollAnimator animation="up" delay={200}>
            <p className="font-retro text-2xl md:text-3xl text-[#94a3b8] mb-10 leading-relaxed max-w-2xl mx-auto">
              Let AI craft engaging posts that grow your network. Schedule
              content, track performance, and level up your personal brand.
            </p>
          </ScrollAnimator>

          {/* CTA Buttons */}
          <ScrollAnimator animation="up" delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/login"
                className="gap-3 font-retro text-xl bg-[#e43b44] hover:bg-[#c42f37] text-[#f4f4f4] border-4 border-[#f4f4f4] px-8 py-4 transition-all hover:translate-x-[2px] hover:translate-y-[2px] flex items-center justify-center"
                style={{ boxShadow: "4px 4px 0 #1a1c2c" }}
              >
                <Calendar className="w-5 h-5" />
                START GAME
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                className="font-retro text-xl bg-[#262b44] text-[#f4f4f4] border-4 border-[#f4f4f4] px-8 py-4 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#3a4466]"
                style={{ boxShadow: "4px 4px 0 #1a1c2c" }}
              >
                WATCH DEMO
              </button>
            </div>
          </ScrollAnimator>

          <ScrollAnimator animation="up" delay={400}>
            <p className="font-retro text-lg text-[#94a3b8]">
              $39/MONTH - CANCEL ANYTIME
            </p>
          </ScrollAnimator>
        </div>

        {/* Dashboard Preview - Game Screen Style */}
        <ScrollAnimator animation="scale" delay={500}>
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="game-screen p-4">
              <div className="border-4 border-[#3a4466] bg-[#1a1c2c] overflow-hidden">
                {/* Window header - like game title bar */}
                <div className="bg-[#262b44] border-b-4 border-[#3a4466] px-4 py-2 flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-[#e43b44]" />
                    <div className="w-3 h-3 bg-[#feae34]" />
                    <div className="w-3 h-3 bg-[#63c74d]" />
                  </div>
                  <span className="font-pixel text-[8px] text-[#94a3b8]">
                    LinAI v1.0
                  </span>
                  <div className="font-retro text-sm text-[#feae34]">
                    SCORE: 9999
                  </div>
                </div>

                {/* Screen content */}
                <div className="aspect-video bg-gradient-to-b from-[#1a1c2c] to-[#262b44] p-6">
                  <div className="grid grid-cols-3 gap-4 h-full">
                    {/* Sidebar */}
                    <div className="border-4 border-[#3a4466] bg-[#262b44] p-3">
                      <div className="space-y-2">
                        {["DASHBOARD", "CREATE", "SCHEDULE", "STATS"].map(
                          (item, i) => (
                            <div
                              key={item}
                              className={`p-2 font-retro text-sm border-2 ${
                                i === 1
                                  ? "bg-[#e43b44] text-[#f4f4f4] border-[#f4f4f4]"
                                  : "text-[#94a3b8] border-[#3a4466]"
                              }`}
                            >
                              {item}
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Main content */}
                    <div className="col-span-2 border-4 border-[#3a4466] bg-[#262b44] p-4">
                      <div className="h-full flex flex-col gap-3">
                        <div className="h-8 bg-[#3a4466] border-2 border-[#f4f4f4]" />
                        <div className="flex-1 bg-[#1a1c2c] border-2 border-[#3a4466] p-3">
                          <div className="space-y-2">
                            <div className="h-3 bg-[#3a4466] w-3/4" />
                            <div className="h-3 bg-[#3a4466] w-full" />
                            <div className="h-3 bg-[#3a4466] w-5/6" />
                          </div>
                        </div>
                        <div
                          className="h-10 bg-[#63c74d] border-4 border-[#f4f4f4] flex items-center justify-center"
                          style={{ boxShadow: "3px 3px 0 #1a1c2c" }}
                        >
                          <span className="font-retro text-[#1a1c2c] font-bold">
                            GENERATE POST
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollAnimator>
      </div>
    </section>
  );
}

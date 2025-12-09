"use client";

import Link from "next/link";
import { Check, Star, Crown, Sparkles } from "lucide-react";
import { ScrollAnimator } from "./scroll-animator";

const features = [
  "Unlimited AI posts",
  "Smart scheduling",
  "Analytics dashboard",
  "Content calendar",
  "Audience insights",
  "Template library",
  "Priority support",
  "API access",
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <ScrollAnimator animation="up">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <p className="font-retro text-2xl text-[#feae34] mb-4">
              INSERT COIN
            </p>
            <h2 className="font-pixel text-lg md:text-xl text-[#f4f4f4] leading-relaxed text-shadow-pixel">
              PRICING
            </h2>
            <div className="pixel-divider w-48 mx-auto mt-6" />
          </div>
        </ScrollAnimator>

        {/* Pricing cards */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Monthly Plan */}
          <ScrollAnimator animation="left" delay={200}>
            <div
              className="bg-[#262b44] border-4 border-[#f4f4f4] relative overflow-hidden h-full"
              style={{ boxShadow: "8px 8px 0 #1a1c2c" }}
            >
              {/* Header */}
              <div className="text-center pb-2 pt-8 px-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-[#feae34]" />
                  <h3 className="font-pixel text-sm text-[#f4f4f4] text-shadow-pixel">
                    MONTHLY
                  </h3>
                </div>
                <p className="font-retro text-xl text-[#94a3b8]">Pay as you go</p>
              </div>

              {/* Content */}
              <div className="text-center pb-6 px-6">
                {/* Price display */}
                <div
                  className="bg-[#1a1c2c] border-4 border-[#f4f4f4] p-6 mb-8 mx-4"
                  style={{ boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)" }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-8 h-8 bg-[#feae34] border-2 border-[#f4f4f4] flex items-center justify-center coin-spin">
                      <span className="font-pixel text-[8px] text-[#1a1c2c]">
                        $
                      </span>
                    </div>
                    <span className="font-pixel text-3xl md:text-4xl text-[#f4f4f4]">
                      19
                    </span>
                  </div>
                  <span className="font-retro text-2xl text-[#94a3b8]">
                    /month
                  </span>
                </div>

                {/* Features list */}
                <ul className="text-left space-y-3 px-4">
                  {features.slice(0, 5).map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-[#f4f4f4] bg-[#3a4466] flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-[#63c74d]" />
                      </div>
                      <span className="font-retro text-lg text-[#f4f4f4]">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer */}
              <div className="flex flex-col gap-4 px-8 pb-8">
                <Link
                  href="/login"
                  className="w-full font-retro text-xl bg-[#3a4466] hover:bg-[#4a5476] text-[#f4f4f4] border-4 border-[#f4f4f4] py-4 transition-all hover:translate-x-[2px] hover:translate-y-[2px] text-center"
                  style={{ boxShadow: "4px 4px 0 #1a1c2c" }}
                >
                  GET STARTED
                </Link>
              </div>
            </div>
          </ScrollAnimator>

          {/* Annual Plan */}
          <ScrollAnimator animation="right" delay={300}>
            <div
              className="bg-[#262b44] border-4 border-[#0099db] relative overflow-hidden h-full"
              style={{ boxShadow: "8px 8px 0 #1a1c2c" }}
            >
              {/* Best value badge */}
              <div
                className="absolute -top-1 -right-1 bg-[#e43b44] border-4 border-[#f4f4f4] px-4 py-2"
                style={{ boxShadow: "2px 2px 0 #1a1c2c" }}
              >
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#feae34]" />
                  <span className="font-pixel text-[8px] text-[#f4f4f4]">
                    SAVE 17%
                  </span>
                </div>
              </div>

              {/* Header */}
              <div className="text-center pb-2 pt-8 px-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-[#feae34]" />
                  <h3 className="font-pixel text-sm text-[#0099db] text-shadow-pixel">
                    ANNUAL
                  </h3>
                </div>
                <p className="font-retro text-xl text-[#94a3b8]">Best value</p>
              </div>

              {/* Content */}
              <div className="text-center pb-6 px-6">
                {/* Price display */}
                <div
                  className="bg-[#1a1c2c] border-4 border-[#0099db] p-6 mb-8 mx-4"
                  style={{ boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)" }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-8 h-8 bg-[#feae34] border-2 border-[#f4f4f4] flex items-center justify-center coin-spin">
                      <span className="font-pixel text-[8px] text-[#1a1c2c]">
                        $
                      </span>
                    </div>
                    <span className="font-pixel text-3xl md:text-4xl text-[#63c74d]">
                      190
                    </span>
                  </div>
                  <span className="font-retro text-2xl text-[#94a3b8]">
                    /year
                  </span>
                  <p className="font-retro text-lg text-[#63c74d] mt-2">
                    Just $15.83/month
                  </p>
                </div>

                {/* Features list */}
                <ul className="text-left space-y-3 px-4">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-[#f4f4f4] bg-[#63c74d] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-[#1a1c2c]" />
                    </div>
                    <span className="font-retro text-lg text-[#63c74d]">
                      Everything in Monthly
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-[#f4f4f4] bg-[#63c74d] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-[#1a1c2c]" />
                    </div>
                    <span className="font-retro text-lg text-[#63c74d]">
                      Save $38 per year
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-[#f4f4f4] bg-[#63c74d] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-[#1a1c2c]" />
                    </div>
                    <span className="font-retro text-lg text-[#f4f4f4]">
                      Priority support
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-[#f4f4f4] bg-[#63c74d] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-[#1a1c2c]" />
                    </div>
                    <span className="font-retro text-lg text-[#f4f4f4]">
                      Early access to features
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-[#f4f4f4] bg-[#63c74d] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-[#1a1c2c]" />
                    </div>
                    <span className="font-retro text-lg text-[#f4f4f4]">
                      Dedicated account manager
                    </span>
                  </li>
                </ul>
              </div>

              {/* Footer */}
              <div className="flex flex-col gap-4 px-8 pb-8">
                <Link
                  href="/login"
                  className="w-full font-retro text-xl bg-[#63c74d] hover:bg-[#4da63a] text-[#1a1c2c] border-4 border-[#f4f4f4] py-4 transition-all hover:translate-x-[2px] hover:translate-y-[2px] text-center"
                  style={{ boxShadow: "4px 4px 0 #1a1c2c" }}
                >
                  GET STARTED
                </Link>
              </div>
            </div>
          </ScrollAnimator>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { Menu, X, Gamepad2 } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#1a1c2c]/95 backdrop-blur border-b-4 border-[#f4f4f4]">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div
              className="w-10 h-10 bg-[#e43b44] border-4 border-[#f4f4f4] flex items-center justify-center"
              style={{ boxShadow: "3px 3px 0 #1a1c2c" }}
            >
              <Gamepad2 className="w-5 h-5 text-[#f4f4f4]" />
            </div>
            <span className="font-pixel text-xs text-[#f4f4f4] text-shadow-pixel">
              LinAI
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {["Features", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="font-retro text-xl text-[#94a3b8] hover:text-[#feae34] transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Sign in button */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="gap-2 font-retro text-lg bg-[#0099db] hover:bg-[#0077a8] text-white border-4 border-[#f4f4f4] px-5 py-2 transition-all hover:translate-x-[2px] hover:translate-y-[2px] flex items-center"
              style={{ boxShadow: "4px 4px 0 #1a1c2c" }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              Sign In with LinkedIn
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-[#f4f4f4] border-4 border-[#f4f4f4] p-2 bg-[#262b44]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t-4 border-[#f4f4f4]">
            <nav className="flex flex-col gap-4">
              {["Features", "Pricing"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="font-retro text-2xl text-[#94a3b8] hover:text-[#feae34]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <Link
                href="/login"
                className="gap-2 font-retro text-lg bg-[#0099db] text-white border-4 border-[#f4f4f4] w-full py-3 flex items-center justify-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                Sign In with LinkedIn
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

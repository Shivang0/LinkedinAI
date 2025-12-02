import Link from "next/link";
import { Gamepad2, Github, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-12 border-t-4 border-[#f4f4f4] bg-[#1a1c2c]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div
              className="w-10 h-10 bg-[#e43b44] border-4 border-[#f4f4f4] flex items-center justify-center"
              style={{ boxShadow: "3px 3px 0 #0a0a0f" }}
            >
              <Gamepad2 className="w-5 h-5 text-[#f4f4f4]" />
            </div>
            <span className="font-pixel text-xs text-[#f4f4f4] text-shadow-pixel">
              LinAI
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex flex-wrap justify-center gap-6">
            {["Features", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="font-retro text-xl text-[#94a3b8] hover:text-[#feae34] transition-colors"
              >
                {item}
              </a>
            ))}
            <Link
              href="/privacy"
              className="font-retro text-xl text-[#94a3b8] hover:text-[#feae34] transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="font-retro text-xl text-[#94a3b8] hover:text-[#feae34] transition-colors"
            >
              Terms
            </Link>
          </nav>

          {/* Social links */}
          <div className="flex gap-4">
            {[Github, Twitter].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-10 h-10 border-4 border-[#f4f4f4] bg-[#262b44] flex items-center justify-center hover:bg-[#3a4466] transition-colors"
                style={{ boxShadow: "3px 3px 0 #0a0a0f" }}
              >
                <Icon className="w-5 h-5 text-[#f4f4f4]" />
              </a>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-center">
            <p className="font-retro text-lg text-[#94a3b8]">
              © {new Date().getFullYear()} LinAI
            </p>
            <p className="font-retro text-sm text-[#3a4466] mt-2">
              PRESS START TO CONTINUE
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

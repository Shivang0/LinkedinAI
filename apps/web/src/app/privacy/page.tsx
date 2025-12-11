import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy - LinAI',
  description: 'Privacy Policy for LinAI - AI-powered LinkedIn content creation',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#1a1c2c] py-12 px-4 sm:px-6 lg:px-8">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#f4f4f4]"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 31) % 100}%`,
              opacity: 0.3 + (i % 3) * 0.2,
            }}
          />
        ))}
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-retro text-lg text-[#94a3b8] hover:text-[#feae34] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 bg-[#0099db] border-4 border-[#f4f4f4] flex items-center justify-center"
            style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
          >
            <Shield className="w-6 h-6 text-[#f4f4f4]" />
          </div>
          <h1 className="font-pixel text-sm md:text-base text-[#f4f4f4] text-shadow-pixel">
            PRIVACY POLICY
          </h1>
        </div>

        {/* Content */}
        <div
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-6 md:p-8"
          style={{ boxShadow: '8px 8px 0 #0a0a0f' }}
        >
          <p className="font-retro text-base text-[#94a3b8] mb-6">
            Last Updated: 10/12/2025
          </p>

          <p className="font-retro text-lg text-[#f4f4f4] mb-8">
            This Privacy Policy explains how LinAI (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) collects, uses, and protects your information when you access our platform using your LinkedIn account.
          </p>

          <Section title="1. LinkedIn OAuth Login">
            <p>LinAI uses secure LinkedIn OAuth for login. We do not store your LinkedIn password.</p>
          </Section>

          <Section title="2. Information We Collect">
            <ul className="list-disc list-inside space-y-2">
              <li>Information received via LinkedIn OAuth</li>
              <li>User-provided content</li>
              <li>Usage analytics data</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Data">
            <ul className="list-disc list-inside space-y-2">
              <li>AI content generation</li>
              <li>Scheduling</li>
              <li>Insights</li>
              <li>Platform improvements</li>
            </ul>
          </Section>

          <Section title="4. Data Security">
            <p>We use secure servers, encryption, and standard security practices.</p>
          </Section>

          <Section title="5. Data Sharing">
            <p>Only with hosting partners, AI processing services, or legal authorities if required.</p>
          </Section>

          <Section title="6. Your Rights">
            <p>You may request data access, update, or deletion.</p>
          </Section>

          <div className="mt-8 pt-6 border-t-2 border-[#3a4466]">
            <p className="font-retro text-lg text-[#94a3b8]">
              Contact:{' '}
              <a href="mailto:hey@digitalvigyapan.co.in" className="text-[#feae34] hover:text-[#f4f4f4] transition-colors">
                hey@digitalvigyapan.co.in
              </a>
            </p>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link href="/terms" className="font-retro text-lg text-[#94a3b8] hover:text-[#feae34] transition-colors">
            Terms & Conditions
          </Link>
          <span className="text-[#3a4466]">|</span>
          <Link href="/refund" className="font-retro text-lg text-[#94a3b8] hover:text-[#feae34] transition-colors">
            Refund Policy
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="font-retro text-xl text-[#feae34] mb-3">{title}</h2>
      <div className="font-retro text-lg text-[#f4f4f4] leading-relaxed">
        {children}
      </div>
    </div>
  );
}

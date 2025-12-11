import Link from 'next/link';
import { ArrowLeft, CreditCard } from 'lucide-react';

export const metadata = {
  title: 'Refund & Cancellation Policy - LinAI',
  description: 'Refund and Cancellation Policy for LinAI - AI-powered LinkedIn content creation',
};

export default function RefundPage() {
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
            className="w-12 h-12 bg-[#e43b44] border-4 border-[#f4f4f4] flex items-center justify-center"
            style={{ boxShadow: '4px 4px 0 #0a0a0f' }}
          >
            <CreditCard className="w-6 h-6 text-[#f4f4f4]" />
          </div>
          <h1 className="font-pixel text-sm md:text-base text-[#f4f4f4] text-shadow-pixel">
            REFUND & CANCELLATION
          </h1>
        </div>

        {/* Content */}
        <div
          className="bg-[#262b44] border-4 border-[#f4f4f4] p-6 md:p-8"
          style={{ boxShadow: '8px 8px 0 #0a0a0f' }}
        >
          <p className="font-retro text-base text-[#94a3b8] mb-8">
            Last Updated: 10/12/2025
          </p>

          <Section title="1. Authentication">
            <p>Removing LinkedIn OAuth access does not cancel subscription billing.</p>
          </Section>

          <Section title="2. Cancellation Policy">
            <p>Cancel anytime through dashboard; service remains active until billing cycle ends.</p>
          </Section>

          <Section title="3. Refund Policy">
            <p className="mb-3">Refunds approved only for:</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Duplicate charges</li>
              <li>Verified technical issues</li>
              <li>Failure to deliver core features</li>
            </ul>
            <p className="mb-3 text-[#e43b44]">Not eligible:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Change of mind</li>
              <li>Inactivity</li>
              <li>LinkedIn restrictions</li>
            </ul>
          </Section>

          <Section title="4. Auto-Renewals">
            <p>Subscriptions renew automatically unless cancelled before renewal date.</p>
          </Section>

          <Section title="5. Trials">
            <p>Users must cancel before trial ends to avoid charges.</p>
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
          <Link href="/privacy" className="font-retro text-lg text-[#94a3b8] hover:text-[#feae34] transition-colors">
            Privacy Policy
          </Link>
          <span className="text-[#3a4466]">|</span>
          <Link href="/terms" className="font-retro text-lg text-[#94a3b8] hover:text-[#feae34] transition-colors">
            Terms & Conditions
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

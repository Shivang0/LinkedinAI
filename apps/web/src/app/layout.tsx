import type { Metadata } from 'next';
import { Press_Start_2P, VT323 } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const pressStart2P = Press_Start_2P({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-press-start',
});

const vt323 = VT323({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-vt323',
});

export const metadata: Metadata = {
  title: 'LinAI - Smart LinkedIn Post Scheduler',
  description: 'AI-powered LinkedIn post scheduler that helps you create engaging content and grow your professional network.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${pressStart2P.variable} ${vt323.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

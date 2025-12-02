import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-linkedin-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Li</span>
              </div>
              <span className="font-semibold text-gray-800">LinkedIn AI</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-800">
                Sign In
              </Link>
              <Link
                href="/login"
                className="btn-primary btn-md"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              AI-Powered LinkedIn Posts
              <br />
              <span className="text-linkedin-blue">That Sound Human</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Create engaging LinkedIn content in seconds. No corporate speak.
              No AI cliches. Just authentic posts that get engagement.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/login" className="btn-primary btn-lg">
                Start Creating - $19/month
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Cancel anytime. Full access to all features.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Everything you need
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                title="AI Content Generation"
                description="Generate posts based on your topic, tone, and style. Our AI writes like a human, not a robot."
                icon="sparkles"
              />
              <FeatureCard
                title="Smart Scheduling"
                description="Schedule posts for optimal times. Calendar views help you plan your content strategy."
                icon="calendar"
              />
              <FeatureCard
                title="Recurring Templates"
                description="Create templates for weekly tips, monthly updates, and more. Set it and forget it."
                icon="repeat"
              />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16" id="pricing">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Simple Pricing
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Monthly Plan */}
              <div className="card border border-gray-200">
                <h3 className="text-xl font-semibold mb-2">Monthly</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$19</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-3 mb-6 text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckIcon /> Unlimited AI-generated posts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon /> Advanced scheduling
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon /> All calendar views
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon /> Recurring templates
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon /> AI learning
                  </li>
                </ul>
                <Link href="/login" className="btn-secondary btn-md w-full">
                  Get Started
                </Link>
              </div>

              {/* Annual Plan */}
              <div className="card border-2 border-linkedin-blue relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-linkedin-blue text-white px-3 py-1 rounded-full text-sm font-medium">
                  Save 17%
                </div>
                <h3 className="text-xl font-semibold mb-2">Annual</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$190</span>
                  <span className="text-gray-500">/year</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Just $15.83/month
                  </p>
                </div>
                <ul className="space-y-3 mb-6 text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckIcon /> Everything in Monthly
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon /> Save $38 per year
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon /> Priority support
                  </li>
                </ul>
                <Link href="/login" className="btn-primary btn-md w-full">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-linkedin-blue">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to level up your LinkedIn game?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of professionals who save hours every week.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-12 px-8 bg-white text-linkedin-blue font-semibold rounded-md hover:bg-gray-100 transition-colors"
            >
              Get Started Now
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-linkedin-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Li</span>
              </div>
              <span className="font-semibold text-white">LinkedIn AI</span>
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-white">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} LinkedIn AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="card text-center">
      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-linkedin-blue text-2xl">
          {icon === 'sparkles' && '✨'}
          {icon === 'calendar' && '📅'}
          {icon === 'repeat' && '🔄'}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-success"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

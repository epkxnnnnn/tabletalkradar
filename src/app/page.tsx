'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-dark-100 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-50 via-dark-100 to-slate-950"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-primary opacity-5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple opacity-10 rounded-full blur-3xl"></div>
      
      {/* Header */}
      <header className="relative z-10 glass-card border-b border-glass-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Image src="/tabletalk-radar-logo.png" alt="TableTalk Radar" width={200} height={60} className="h-16 w-auto filter brightness-110" />
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-dark-700 hover:text-dark-900 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="brand-gradient text-white px-6 py-2 rounded-lg text-sm font-medium shadow-brand hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-dark-900 mb-8 leading-tight">
            <span className="text-glow-white">Dominate Your Local Market</span>
            <span className="block text-dark-700 text-4xl md:text-5xl font-normal mt-4">
              Without the Guesswork
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-dark-600 mb-6 max-w-4xl mx-auto leading-relaxed">
            Track competitors. Automate reviews. Boost visibility. Run smarter campaigns.
          </p>
          <div className="w-24 h-0.5 bg-gradient-to-r from-brand-primary to-brand-light mx-auto mb-8"></div>
          <p className="text-lg md:text-xl text-dark-700 mb-12 max-w-5xl mx-auto leading-relaxed">
            TableTalk Radar gives you the unfair advantage:<br/>
            <span className="font-semibold">real-time insights + done-for-you local SEO, email, and SMS campaigns</span> — all in one dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/auth/signup"
              className="brand-gradient text-white px-10 py-4 rounded-xl text-lg font-semibold shadow-brand hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 animate-glow"
            >
              Start Free Trial
            </Link>
            <Link
              href="/auth/login"
              className="btn-glass text-dark-800 hover:text-dark-900 px-10 py-4 rounded-xl text-lg font-semibold"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="glass-card p-8 rounded-2xl group hover:card-shadow-glow transition-all duration-500">
            <div className="w-16 h-16 bg-gradient-to-r from-brand-primary to-brand-light rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <div className="w-8 h-8 bg-white rounded-lg"></div>
            </div>
            <h3 className="text-2xl font-bold text-dark-900 mb-4 text-center">Spy on Competitors</h3>
            <p className="text-dark-600 text-center leading-relaxed">
              See exactly what your competitors are doing right (and wrong). Get their strategies, pricing, and marketing secrets.
            </p>
          </div>
          <div className="glass-card p-8 rounded-2xl group hover:card-shadow-glow transition-all duration-500">
            <div className="w-16 h-16 bg-gradient-to-r from-success to-brand-accent rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <div className="w-8 h-8 bg-white rounded-lg"></div>
            </div>
            <h3 className="text-2xl font-bold text-dark-900 mb-4 text-center">Win Local SEO</h3>
            <p className="text-dark-600 text-center leading-relaxed">
              Dominate Google Maps and local search results. We handle the technical stuff so you rank higher than your competition.
            </p>
          </div>
          <div className="glass-card p-8 rounded-2xl group hover:card-shadow-glow transition-all duration-500">
            <div className="w-16 h-16 bg-gradient-to-r from-info to-purple rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <div className="w-8 h-8 bg-white rounded-lg"></div>
            </div>
            <h3 className="text-2xl font-bold text-dark-900 mb-4 text-center">Automate Reviews</h3>
            <p className="text-dark-600 text-center leading-relaxed">
              Get more 5-star reviews on autopilot. Our system asks happy customers for reviews and handles the heavy lifting.
            </p>
          </div>
          <div className="glass-card p-8 rounded-2xl group hover:card-shadow-glow transition-all duration-500">
            <div className="w-16 h-16 bg-gradient-to-r from-warning to-brand-light rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <div className="w-8 h-8 bg-white rounded-lg"></div>
            </div>
            <h3 className="text-2xl font-bold text-dark-900 mb-4 text-center">Run Email + SMS</h3>
            <p className="text-dark-600 text-center leading-relaxed">
              Pre-built campaigns that actually convert. Target past customers, win back lost ones, and turn leads into sales.
            </p>
          </div>
        </div>

        {/* Business Types */}
        <div className="mt-24">
          <h2 className="text-4xl font-bold text-dark-900 text-center mb-12 text-glow-white">
            Built for Local Growth
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              'Restaurants & Cafes',
              'Dental & Medical', 
              'Auto Services',
              'Beauty & Wellness',
              'Home Services',
              'Legal & Finance',
              'Fitness & Gyms',
              'Retail Stores'
            ].map((category) => (
              <div key={category} className="glass-card p-6 rounded-xl text-center hover:-translate-y-2 transition-all duration-300">
                <p className="text-dark-700 font-medium">{category}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mt-24">
          <h2 className="text-4xl font-bold text-dark-900 text-center mb-12 text-glow-white">
            Pick Your Growth Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-2xl hover:-translate-y-2 transition-all duration-500">
              <h3 className="text-2xl font-bold text-dark-900 mb-4">Starter</h3>
              <div className="text-4xl font-bold bg-gradient-to-r from-brand-primary to-brand-light bg-clip-text text-transparent mb-6">
                $29<span className="text-xl text-dark-500">/month</span>
              </div>
              <ul className="space-y-3 text-dark-600 mb-8">
                <li className="flex items-center"><span className="text-success mr-2">✓</span> 1 location tracking</li>
                <li className="flex items-center"><span className="text-success mr-2">✓</span> Competitor analysis</li>
                <li className="flex items-center"><span className="text-success mr-2">✓</span> Basic review automation</li>
                <li className="flex items-center"><span className="text-success mr-2">✓</span> Email campaigns</li>
              </ul>
              <Link
                href="/auth/signup"
                className="w-full btn-glass text-dark-800 hover:text-dark-900 px-6 py-3 rounded-xl block text-center font-semibold"
              >
                Start Free Trial
              </Link>
            </div>
            <div className="glass-card p-8 rounded-2xl border-2 border-brand-primary hover:-translate-y-2 transition-all duration-500 animate-glow">
              <div className="text-center mb-4">
                <span className="bg-brand-gradient text-white px-4 py-1 rounded-full text-sm font-semibold">MOST POPULAR</span>
              </div>
              <h3 className="text-2xl font-bold text-dark-900 mb-4">Pro</h3>
              <div className="text-4xl font-bold bg-gradient-to-r from-brand-primary to-brand-light bg-clip-text text-transparent mb-6">
                $99<span className="text-xl text-dark-500">/month</span>
              </div>
              <ul className="space-y-3 text-dark-600 mb-8">
                <li className="flex items-center"><span className="text-success mr-2">✓</span> Up to 5 locations</li>
                <li className="flex items-center"><span className="text-success mr-2">✓</span> Full competitor intel</li>
                <li className="flex items-center"><span className="text-success mr-2">✓</span> Advanced review system</li>
                <li className="flex items-center"><span className="text-success mr-2">✓</span> Email + SMS campaigns</li>
                <li className="flex items-center"><span className="text-success mr-2">✓</span> Local SEO optimization</li>
              </ul>
              <Link
                href="/auth/signup"
                className="w-full brand-gradient text-white px-6 py-3 rounded-xl block text-center font-semibold shadow-brand hover:shadow-xl transition-all duration-300"
              >
                Start Free Trial
              </Link>
            </div>
            <div className="glass-card p-8 rounded-2xl hover:-translate-y-2 transition-all duration-500">
              <h3 className="text-2xl font-bold text-dark-900 mb-4">Enterprise</h3>
              <div className="text-4xl font-bold bg-gradient-to-r from-purple to-info bg-clip-text text-transparent mb-6">Custom</div>
              <ul className="space-y-3 text-dark-600 mb-8">
                <li className="flex items-center"><span className="text-success mr-2">✓</span> Unlimited locations</li>
                <li className="flex items-center"><span className="text-success mr-2">✓</span> White-label solution</li>
                <li className="flex items-center"><span className="text-success mr-2">✓</span> Custom integrations</li>
                <li className="flex items-center"><span className="text-success mr-2">✓</span> Dedicated success manager</li>
                <li className="flex items-center"><span className="text-success mr-2">✓</span> API access</li>
              </ul>
              <Link
                href="/auth/signup"
                className="w-full btn-glass text-dark-800 hover:text-dark-900 px-6 py-3 rounded-xl block text-center font-semibold"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Line Section */}
        <div className="mt-32 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold text-dark-900 mb-8 text-glow-white">
              The Bottom Line
            </h2>
            <p className="text-xl md:text-2xl text-dark-600 mb-8 leading-relaxed">
              You're losing customers to competitors who are more visible online.
            </p>
            <p className="text-lg md:text-xl text-dark-700 mb-12 leading-relaxed">
              Every day you wait is another day they capture your market share.<br/>
              <span className="font-semibold">Stop playing catch-up.</span> Start dominating your local market today.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/auth/signup"
                className="brand-gradient text-white px-12 py-5 rounded-xl text-xl font-bold shadow-brand hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 animate-glow"
              >
                Start Free Trial Now
              </Link>
              <p className="text-dark-600 text-sm">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 glass-card border-t border-glass-border mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-dark-500">
            <p className="text-lg">&copy; 2024 TableTalk Radar. All rights reserved.</p>
            <p className="mt-2 text-dark-400">Built for local businesses worldwide</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
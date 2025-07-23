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
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image src="/logo.png" alt="TableTalk Radar" width={150} height={40} className="h-10 w-auto filter brightness-110" />
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
            <span className="text-glow-white">5-AI Local Business</span>
            <span className="block brand-gradient bg-clip-text text-transparent text-glow animate-glow">
              Intelligence That Never Sleeps
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-dark-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Comprehensive business intelligence platform powered by multiple AI providers. 
            Monitor, analyze, and optimize your local business presence with real-time insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/auth/signup"
              className="brand-gradient text-white px-10 py-4 rounded-xl text-lg font-semibold shadow-brand hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 animate-glow"
            >
              🚀 Start Free Trial
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
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-2xl group hover:card-shadow-glow transition-all duration-500">
            <div className="text-4xl mb-6 text-center">
              <span className="bg-gradient-to-r from-brand-light to-brand-accent bg-clip-text text-transparent">🔍</span>
            </div>
            <h3 className="text-2xl font-bold text-dark-900 mb-4 text-center">Multi-AI Analysis</h3>
            <p className="text-dark-600 text-center leading-relaxed">
              Leverage 5 different AI providers for comprehensive business intelligence and market analysis.
            </p>
          </div>
          <div className="glass-card p-8 rounded-2xl group hover:card-shadow-glow transition-all duration-500">
            <div className="text-4xl mb-6 text-center">
              <span className="bg-gradient-to-r from-info to-purple bg-clip-text text-transparent">📊</span>
            </div>
            <h3 className="text-2xl font-bold text-dark-900 mb-4 text-center">Real-time Monitoring</h3>
            <p className="text-dark-600 text-center leading-relaxed">
              Continuous monitoring of your business presence across all major platforms and search engines.
            </p>
          </div>
          <div className="glass-card p-8 rounded-2xl group hover:card-shadow-glow transition-all duration-500">
            <div className="text-4xl mb-6 text-center">
              <span className="bg-gradient-to-r from-success to-warning bg-clip-text text-transparent">🎯</span>
            </div>
            <h3 className="text-2xl font-bold text-dark-900 mb-4 text-center">Actionable Insights</h3>
            <p className="text-dark-600 text-center leading-relaxed">
              Get specific, actionable recommendations to improve your business performance and visibility.
            </p>
          </div>
        </div>

        {/* Business Types */}
        <div className="mt-24">
          <h2 className="text-4xl font-bold text-dark-900 text-center mb-12 text-glow-white">
            Perfect for All Local Businesses
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              'Professional Services',
              'Healthcare & Wellness', 
              'Technology',
              'Retail & E-commerce',
              'Financial Services',
              'Manufacturing',
              'Education',
              'Food & Hospitality'
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
            Simple, Transparent Pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-2xl hover:-translate-y-2 transition-all duration-500">
              <h3 className="text-2xl font-bold text-dark-900 mb-4">Starter</h3>
              <div className="text-4xl font-bold bg-gradient-to-r from-brand-primary to-brand-light bg-clip-text text-transparent mb-6">
                $29<span className="text-xl text-dark-500">/month</span>
              </div>
              <ul className="space-y-3 text-dark-600 mb-8">
                <li className="flex items-center"><span className="text-success mr-2">✓</span> 5 audits per month</li>
                <li className="flex items-center"><span className="text-success mr-2">✓</span> Basic AI insights</li>
                <li className="flex items-center"><span className="text-success mr-2">✓</span> Email support</li>
              </ul>
              <Link
                href="/auth/signup"
                className="w-full btn-glass text-dark-800 hover:text-dark-900 px-6 py-3 rounded-xl block text-center font-semibold"
              >
                Get Started
              </Link>
            </div>
            <div className="glass-card p-8 rounded-2xl border-2 border-brand-primary hover:-translate-y-2 transition-all duration-500 animate-glow">
              <div className="text-center mb-4">
                <span className="bg-brand-gradient text-white px-4 py-1 rounded-full text-sm font-semibold">POPULAR</span>
              </div>
              <h3 className="text-2xl font-bold text-dark-900 mb-4">Professional</h3>
              <div className="text-4xl font-bold bg-gradient-to-r from-brand-primary to-brand-light bg-clip-text text-transparent mb-6">
                $99<span className="text-xl text-dark-500">/month</span>
              </div>
              <ul className="space-y-3 text-dark-600 mb-8">
                <li className="flex items-center"><span className="text-success mr-2">✓</span> Unlimited audits</li>
                <li className="flex items-center"><span className="text-success mr-2">✓</span> All AI providers</li>
                <li className="flex items-center"><span className="text-success mr-2">✓</span> Client management</li>
                <li className="flex items-center"><span className="text-success mr-2">✓</span> Priority support</li>
              </ul>
              <Link
                href="/auth/signup"
                className="w-full brand-gradient text-white px-6 py-3 rounded-xl block text-center font-semibold shadow-brand hover:shadow-xl transition-all duration-300"
              >
                Get Started
              </Link>
            </div>
            <div className="glass-card p-8 rounded-2xl hover:-translate-y-2 transition-all duration-500">
              <h3 className="text-2xl font-bold text-dark-900 mb-4">Enterprise</h3>
              <div className="text-4xl font-bold bg-gradient-to-r from-purple to-info bg-clip-text text-transparent mb-6">Custom</div>
              <ul className="space-y-3 text-dark-600 mb-8">
                <li className="flex items-center"><span className="text-success mr-2">✓</span> Custom integrations</li>
                <li className="flex items-center"><span className="text-success mr-2">✓</span> White-label options</li>
                <li className="flex items-center"><span className="text-success mr-2">✓</span> Dedicated support</li>
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
      </main>

      {/* Footer */}
      <footer className="relative z-10 glass-card border-t border-glass-border mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-dark-500">
            <p className="text-lg">&copy; 2024 TableTalk Radar. All rights reserved.</p>
            <p className="mt-2 text-dark-400">Built with ❤️ for local businesses worldwide</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
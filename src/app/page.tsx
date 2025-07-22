'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image src="/logo.png" alt="TableTalk Radar" width={150} height={40} className="h-10 w-auto" />
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            5-AI Local Business Intelligence
            <span className="block text-red-400">That Never Sleeps</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Comprehensive business intelligence platform powered by multiple AI providers. 
            Monitor, analyze, and optimize your local business presence with real-time insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg text-lg font-medium"
            >
              Start Free Trial
            </Link>
            <Link
              href="/auth/login"
              className="border border-slate-600 text-slate-300 hover:text-white px-8 py-3 rounded-lg text-lg font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-800 p-6 rounded-lg">
            <div className="text-red-400 text-2xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">Multi-AI Analysis</h3>
            <p className="text-slate-300">
              Leverage 5 different AI providers for comprehensive business intelligence and market analysis.
            </p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg">
            <div className="text-red-400 text-2xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-2">Real-time Monitoring</h3>
            <p className="text-slate-300">
              Continuous monitoring of your business presence across all major platforms and search engines.
            </p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg">
            <div className="text-red-400 text-2xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-white mb-2">Actionable Insights</h3>
            <p className="text-slate-300">
              Get specific, actionable recommendations to improve your business performance and visibility.
            </p>
          </div>
        </div>

        {/* Business Types */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Perfect for All Local Businesses
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div key={category} className="bg-slate-800 p-4 rounded-lg text-center">
                <p className="text-slate-300">{category}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Simple, Transparent Pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-2">Starter</h3>
              <div className="text-3xl font-bold text-red-400 mb-4">$29<span className="text-lg text-slate-400">/month</span></div>
              <ul className="space-y-2 text-slate-300">
                <li>• 5 audits per month</li>
                <li>• Basic AI insights</li>
                <li>• Email support</li>
              </ul>
              <Link
                href="/auth/signup"
                className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md block text-center"
              >
                Get Started
              </Link>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg border-2 border-red-500">
              <h3 className="text-xl font-semibold text-white mb-2">Professional</h3>
              <div className="text-3xl font-bold text-red-400 mb-4">$99<span className="text-lg text-slate-400">/month</span></div>
              <ul className="space-y-2 text-slate-300">
                <li>• Unlimited audits</li>
                <li>• All AI providers</li>
                <li>• Client management</li>
                <li>• Priority support</li>
              </ul>
              <Link
                href="/auth/signup"
                className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md block text-center"
              >
                Get Started
              </Link>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-2">Enterprise</h3>
              <div className="text-3xl font-bold text-red-400 mb-4">Custom</div>
              <ul className="space-y-2 text-slate-300">
                <li>• Custom integrations</li>
                <li>• White-label options</li>
                <li>• Dedicated support</li>
                <li>• API access</li>
              </ul>
              <Link
                href="/auth/signup"
                className="mt-6 w-full bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md block text-center"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-400">
            <p>&copy; 2024 TableTalk Radar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
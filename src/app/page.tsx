import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Users, MapPin, Star } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 dark-theme-gradient"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              TableTalk Radar
              <span className="block text-red-400">Dashboard System</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Modern dark theme dashboard with dark red accents for superadmin and client management
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="dark-red-accent hover:opacity-90">
                  Super Admin Dashboard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/client/dashboard">
                <Button size="lg" variant="outline">
                  Client Dashboard
                  <Users className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Key Features</h2>
          <p className="text-gray-400">Everything you need to manage your business intelligence</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="dark-glass card-hover p-6 rounded-lg">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Multi-Client Support</h3>
            <p className="text-gray-400">Manage multiple clients with individual dashboards and permissions</p>
          </div>

          <div className="dark-glass card-hover p-6 rounded-lg">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Location Management</h3>
            <p className="text-gray-400">Handle multiple locations per client with location-specific analytics</p>
          </div>

          <div className="dark-glass card-hover p-6 rounded-lg">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Review Management</h3>
            <p className="text-gray-400">Monitor and respond to reviews across all platforms</p>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import * as React from 'react'
import { useState } from 'react'
import { Menu, X, Home, BarChart3, Settings, Users, MapPin, MessageSquare, Calendar, Bell } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: 'superadmin' | 'client'
  clientName?: string
  locations?: Array<{ id: string; name: string }>
  selectedLocation?: string
  onLocationChange?: (locationId: string) => void
}

export function DashboardLayout({ 
  children, 
  userRole, 
  clientName, 
  locations = [], 
  selectedLocation, 
  onLocationChange 
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const superadminNav = [
    { name: 'Overview', href: '/dashboard', icon: Home },
    { name: 'Clients', href: '/dashboard/clients', icon: Users },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Locations', href: '/dashboard/locations', icon: MapPin },
    { name: 'Reviews', href: '/dashboard/reviews', icon: MessageSquare },
    { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  const clientNav = [
    { name: 'Overview', href: '/client/dashboard', icon: Home },
    { name: 'Locations', href: '/client/locations', icon: MapPin },
    { name: 'Reviews', href: '/client/reviews', icon: MessageSquare },
    { name: 'Analytics', href: '/client/analytics', icon: BarChart3 },
    { name: 'Calendar', href: '/client/calendar', icon: Calendar },
    { name: 'Settings', href: '/client/settings', icon: Settings },
  ]

  const navigation = userRole === 'superadmin' ? superadminNav : clientNav

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          <h1 className="text-xl font-bold gradient-text">TableTalk Radar</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md lg:hidden hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-red-600/20 text-red-400 border border-red-600/30'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {userRole === 'client' && locations.length > 0 && (
          <div className="p-4 border-t border-gray-800">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Locations</h3>
            <select
              value={selectedLocation}
              onChange={(e) => onLocationChange?.(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md lg:hidden hover:bg-gray-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-md hover:bg-gray-800 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">
                    {userRole === 'superadmin' ? 'SA' : clientName?.charAt(0) || 'C'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">
                    {userRole === 'superadmin' ? 'Super Admin' : clientName}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">{userRole}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

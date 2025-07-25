'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  MapPin, 
  MessageSquare, 
  TrendingUp, 
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string
  locations: number
  reviews: number
  lastActivity: string
  status: 'active' | 'inactive'
}

interface QuickStats {
  totalClients: number
  totalLocations: number
  totalReviews: number
  activeToday: number
}

export default function SuperAdminDashboard() {
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<QuickStats>({
    totalClients: 0,
    totalLocations: 0,
    totalReviews: 0,
    activeToday: 0
  })

  useEffect(() => {
    // Mock data - replace with actual API calls
    setClients([
      {
        id: '1',
        name: 'Burger Palace',
        email: 'admin@burgerpalace.com',
        locations: 3,
        reviews: 127,
        lastActivity: '2 hours ago',
        status: 'active'
      },
      {
        id: '2',
        name: 'Pizza Express',
        email: 'manager@pizzaexpress.com',
        locations: 2,
        reviews: 89,
        lastActivity: '5 hours ago',
        status: 'active'
      },
      {
        id: '3',
        name: 'Coffee Corner',
        email: 'info@coffeecorner.com',
        locations: 1,
        reviews: 45,
        lastActivity: '1 day ago',
        status: 'inactive'
      }
    ])

    setStats({
      totalClients: 24,
      totalLocations: 47,
      totalReviews: 1847,
      activeToday: 18
    })
  }, [])

  return (
    <DashboardLayout userRole="superadmin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Super Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage all clients and locations</p>
          </div>
          <Button className="dark-red-accent hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Add New Client
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="dark-glass card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Clients</CardTitle>
              <Users className="w-4 h-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalClients}</div>
              <p className="text-xs text-gray-400 mt-1">+2 from last week</p>
            </CardContent>
          </Card>

          <Card className="dark-glass card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Locations</CardTitle>
              <MapPin className="w-4 h-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalLocations}</div>
              <p className="text-xs text-gray-400 mt-1">Across all clients</p>
            </CardContent>
          </Card>

          <Card className="dark-glass card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Reviews</CardTitle>
              <MessageSquare className="w-4 h-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalReviews}</div>
              <p className="text-xs text-gray-400 mt-1">+127 this month</p>
            </CardContent>
          </Card>

          <Card className="dark-glass card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active Today</CardTitle>
              <TrendingUp className="w-4 h-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.activeToday}</div>
              <p className="text-xs text-gray-400 mt-1">Clients active</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Clients */}
        <Card className="dark-glass">
          <CardHeader>
            <CardTitle className="text-white">Recent Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 text-sm font-medium text-gray-400">Client</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-400">Locations</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-400">Reviews</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-400">Last Activity</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="py-4">
                        <div>
                          <p className="font-medium text-white">{client.name}</p>
                          <p className="text-sm text-gray-400">{client.email}</p>
                        </div>
                      </td>
                      <td className="py-4 text-gray-300">{client.locations}</td>
                      <td className="py-4 text-gray-300">{client.reviews}</td>
                      <td className="py-4">
                        <Badge 
                          variant={client.status === 'active' ? 'default' : 'secondary'}
                          className={client.status === 'active' ? 'bg-red-600/20 text-red-400' : 'bg-gray-700 text-gray-300'}
                        >
                          {client.status}
                        </Badge>
                      </td>
                      <td className="py-4 text-gray-300">{client.lastActivity}</td>
                      <td className="py-4">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" className="hover:bg-gray-800">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="hover:bg-gray-800">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="hover:bg-gray-800">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="dark-glass card-hover">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Posts
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Reply to Reviews
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Invite New Client
              </Button>
            </CardContent>
          </Card>

          <Card className="dark-glass card-hover">
            <CardHeader>
              <CardTitle className="text-white">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">API Status</span>
                  <Badge className="bg-green-600/20 text-green-400">Operational</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sync Status</span>
                  <Badge className="bg-green-600/20 text-green-400">Active</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Backup</span>
                  <span className="text-gray-300">2 hours ago</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark-glass card-hover">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-white">New review for Burger Palace</p>
                    <p className="text-xs text-gray-400">5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-white">Pizza Express location added</p>
                    <p className="text-xs text-gray-400">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-white">System backup completed</p>
                    <p className="text-xs text-gray-400">2 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

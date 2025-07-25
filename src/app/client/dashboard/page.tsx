'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  MessageSquare, 
  Star, 
  TrendingUp, 
  Calendar,
  Eye,
  Reply
} from 'lucide-react'

interface Location {
  id: string
  name: string
  address: string
  rating: number
  reviewCount: number
  lastSync: string
}

interface Review {
  id: string
  locationName: string
  reviewer: string
  rating: number
  comment: string
  date: string
  status: 'pending' | 'responded'
}

interface Analytics {
  totalViews: number
  totalCalls: number
  totalDirections: number
  averageRating: number
}

export default function ClientDashboard() {
  const [locations, setLocations] = useState<Location[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [analytics, setAnalytics] = useState<Analytics>({
    totalViews: 0,
    totalCalls: 0,
    totalDirections: 0,
    averageRating: 0
  })
  const [selectedLocation, setSelectedLocation] = useState('all')

  useEffect(() => {
    // Mock data - replace with actual API calls
    setLocations([
      {
        id: '1',
        name: 'Downtown Branch',
        address: '123 Main St, Downtown',
        rating: 4.5,
        reviewCount: 89,
        lastSync: '2 hours ago'
      },
      {
        id: '2',
        name: 'Mall Location',
        address: '456 Shopping Center',
        rating: 4.2,
        reviewCount: 67,
        lastSync: '1 hour ago'
      }
    ])

    setReviews([
      {
        id: '1',
        locationName: 'Downtown Branch',
        reviewer: 'John D.',
        rating: 5,
        comment: 'Great service and amazing food! Will definitely come back.',
        date: '2 hours ago',
        status: 'pending'
      },
      {
        id: '2',
        locationName: 'Mall Location',
        reviewer: 'Sarah M.',
        rating: 4,
        comment: 'Good experience overall, staff was very friendly.',
        date: '5 hours ago',
        status: 'responded'
      }
    ])

    setAnalytics({
      totalViews: 2847,
      totalCalls: 342,
      totalDirections: 156,
      averageRating: 4.3
    })
  }, [])

  const clientLocations = [
    { id: 'all', name: 'All Locations' },
    ...locations.map(loc => ({ id: loc.id, name: loc.name }))
  ]

  return (
    <DashboardLayout 
      userRole="client" 
      clientName="Burger Palace"
      locations={clientLocations}
      selectedLocation={selectedLocation}
      onLocationChange={setSelectedLocation}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Client Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage your business locations and reviews</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="dark-glass card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Views</CardTitle>
              <Eye className="w-4 h-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{analytics.totalViews.toLocaleString()}</div>
              <p className="text-xs text-gray-400 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="dark-glass card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Phone Calls</CardTitle>
              <MessageSquare className="w-4 h-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{analytics.totalCalls}</div>
              <p className="text-xs text-gray-400 mt-1">From Google</p>
            </CardContent>
          </Card>

          <Card className="dark-glass card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Directions</CardTitle>
              <MapPin className="w-4 h-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{analytics.totalDirections}</div>
              <p className="text-xs text-gray-400 mt-1">Requested</p>
            </CardContent>
          </Card>

          <Card className="dark-glass card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Avg Rating</CardTitle>
              <Star className="w-4 h-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{analytics.averageRating}</div>
              <p className="text-xs text-gray-400 mt-1">Across all locations</p>
            </CardContent>
          </Card>
        </div>

        {/* Locations Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="dark-glass">
            <CardHeader>
              <CardTitle className="text-white">Your Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {locations.map((location) => (
                  <div key={location.id} className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-white">{location.name}</h3>
                        <p className="text-sm text-gray-400">{location.address}</p>
                      </div>
                      <Badge className="bg-red-600/20 text-red-400">
                        {location.rating} ★
                      </Badge>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-sm text-gray-300">{location.reviewCount} reviews</span>
                      <span className="text-xs text-gray-400">Synced {location.lastSync}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card className="dark-glass">
            <CardHeader>
              <CardTitle className="text-white">Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-white">{review.reviewer}</p>
                        <p className="text-sm text-gray-400">{review.locationName}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-yellow-600/20 text-yellow-400">
                          {review.rating} ★
                        </Badge>
                        <Badge 
                          variant={review.status === 'pending' ? 'secondary' : 'default'}
                          className={review.status === 'pending' ? 'bg-orange-600/20 text-orange-400' : 'bg-green-600/20 text-green-400'}
                        >
                          {review.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">{review.comment}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">{review.date}</span>
                      {review.status === 'pending' && (
                        <Button size="sm" className="dark-red-accent">
                          <Reply className="w-3 h-3 mr-1" />
                          Reply
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart Placeholder */}
        <Card className="dark-glass">
          <CardHeader>
            <CardTitle className="text-white">Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-800/50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-red-400 mx-auto mb-2" />
                <p className="text-gray-400">Performance chart will be displayed here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Globe, MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getClientDashboardUrl } from '@/lib/utils/client-urls'

interface ClientCardProps {
  client: {
    id: string
    slug: string
    business_name: string
    industry?: string
    location?: string
    website?: string
    status?: string
    client_tier?: string
    performance_change?: number
    last_audit_date?: string
  }
  isAgencySuperAdmin?: boolean
}

export function ClientCard({ client, isAgencySuperAdmin }: ClientCardProps) {
  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'enterprise': return 'bg-purple-500'
      case 'premium': return 'bg-yellow-500'
      case 'standard': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'onboarding': return 'bg-yellow-500'
      case 'paused': return 'bg-orange-500'
      case 'churned': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getPerformanceIcon = (change?: number) => {
    if (!change) return <Minus className="h-4 w-4 text-gray-400" />
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {client.business_name}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {client.industry || 'Uncategorized'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {client.client_tier && (
              <Badge className={`${getTierColor(client.client_tier)} text-white`}>
                {client.client_tier}
              </Badge>
            )}
            {client.status && (
              <Badge className={`${getStatusColor(client.status)} text-white`}>
                {client.status}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {client.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{client.location}</span>
              </div>
            )}
            {client.website && (
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{client.website}</span>
              </div>
            )}
          </div>

          {client.performance_change !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              {getPerformanceIcon(client.performance_change)}
              <span className={client.performance_change > 0 ? 'text-green-600' : client.performance_change < 0 ? 'text-red-600' : 'text-gray-600'}>
                {client.performance_change > 0 ? '+' : ''}{client.performance_change}% this month
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground">
              {client.last_audit_date ? (
                <>Last audit: {new Date(client.last_audit_date).toLocaleDateString()}</>
              ) : (
                'No audits yet'
              )}
            </div>
            <Link href={getClientDashboardUrl(client.slug)}>
              <Button size="sm" variant="outline" className="group">
                {isAgencySuperAdmin ? 'Manage' : 'View Dashboard'}
                <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
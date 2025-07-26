'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building2, 
  MapPin, 
  Phone, 
  Globe, 
  Star, 
  TrendingUp, 
  Clock, 
  Users, 
  Target,
  Search,
  Facebook,
  Instagram,
  Twitter,
  Calendar,
  Edit
} from 'lucide-react'
import { ComprehensiveClientProfile } from '@/types/client-profile'

interface ClientProfileViewProps {
  clientId: string
  isEditable?: boolean
}

export function ClientProfileView({ clientId, isEditable = false }: ClientProfileViewProps) {
  const [profile, setProfile] = useState<ComprehensiveClientProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadClientProfile()
  }, [clientId])

  const loadClientProfile = async () => {
    try {
      setLoading(true)

      // Load client data
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (clientError) throw clientError

      // Load locations
      const { data: locations } = await supabase
        .from('client_locations')
        .select('*')
        .eq('client_id', clientId)
        .order('is_primary_location', { ascending: false })

      // Load services
      const { data: services } = await supabase
        .from('business_services')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('display_order')

      // Load menu items
      const { data: menu } = await supabase
        .from('business_menu')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_available', true)
        .order('display_order')

      // Load SEO keywords
      const { data: seoKeywords } = await supabase
        .from('seo_keywords')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_tracking', true)
        .order('current_rank')

      // Load recent social posts
      const { data: socialPosts } = await supabase
        .from('social_media_posts')
        .select('*')
        .eq('client_id', clientId)
        .in('status', ['published', 'scheduled'])
        .order('created_at', { ascending: false })
        .limit(10)

      // Compute metrics
      const totalKeywords = seoKeywords?.length || 0
      const averageRanking = seoKeywords?.length 
        ? seoKeywords.reduce((acc, kw) => acc + (kw.current_rank || 100), 0) / seoKeywords.length
        : 0
      const totalServices = services?.length || 0
      const socialEngagement = socialPosts?.reduce((acc, post) => 
        acc + (post.likes_count || 0) + (post.comments_count || 0) + (post.shares_count || 0), 0) || 0
      const primaryLocation = locations?.[0]
      const googleRating = primaryLocation?.google_rating || 0
      const reviewCount = primaryLocation?.google_review_count || 0

      setProfile({
        client,
        locations: locations || [],
        services: services || [],
        menu: menu || [],
        seo_keywords: seoKeywords || [],
        social_posts: socialPosts || [],
        total_keywords: totalKeywords,
        average_ranking: averageRanking,
        total_services: totalServices,
        social_engagement: socialEngagement,
        google_rating: googleRating,
        review_count: reviewCount
      })

    } catch (error) {
      console.error('Error loading client profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Client profile not found</p>
      </div>
    )
  }

  const { client, locations } = profile
  const primaryLocation = locations[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            {client.logo_url && (
              <img 
                src={client.logo_url} 
                alt={`${client.business_name} logo`}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">{client.business_name}</h1>
              {client.tagline && (
                <p className="text-lg text-muted-foreground">{client.tagline}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {primaryLocation?.address && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{primaryLocation.address}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.website && (
              <div className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                <a href={client.website} target="_blank" rel="noopener noreferrer" 
                   className="text-primary hover:underline">
                  {client.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">{client.industry}</Badge>
            <Badge variant="outline">{client.business_type}</Badge>
            <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
              {client.status}
            </Badge>
          </div>
        </div>

        {isEditable && (
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{profile.google_rating.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Google Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{profile.review_count}</p>
                <p className="text-sm text-muted-foreground">Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{profile.total_keywords}</p>
                <p className="text-sm text-muted-foreground">Tracking Keywords</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round(profile.average_ranking)}</p>
                <p className="text-sm text-muted-foreground">Avg. Ranking</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.business_description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{client.business_description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {client.founded_year && (
                    <div>
                      <span className="font-medium">Founded:</span> {client.founded_year}
                    </div>
                  )}
                  {client.employee_count && (
                    <div>
                      <span className="font-medium">Employees:</span> {client.employee_count}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Client Tier:</span> {client.client_tier}
                  </div>
                  <div>
                    <span className="font-medium">Industry:</span> {client.industry}
                  </div>
                </div>

                {client.primary_services && client.primary_services.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Primary Services</h4>
                    <div className="flex flex-wrap gap-2">
                      {client.primary_services.map((service, index) => (
                        <Badge key={index} variant="secondary">{service}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social Media Links */}
            <Card>
              <CardHeader>
                <CardTitle>Social Media</CardTitle>
              </CardHeader>
              <CardContent>
                {client.social_media_links && Object.keys(client.social_media_links).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(client.social_media_links).map(([platform, url]) => (
                      <div key={platform} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {platform === 'facebook' && <Facebook className="h-4 w-4 text-blue-600" />}
                          {platform === 'instagram' && <Instagram className="h-4 w-4 text-pink-600" />}
                          {platform === 'twitter' && <Twitter className="h-4 w-4 text-blue-400" />}
                          <span className="capitalize font-medium">{platform}</span>
                        </div>
                        <a 
                          href={url as string} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View Profile
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No social media links configured</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <div className="grid gap-4">
            {profile.locations.map((location) => (
              <Card key={location.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {location.business_name}
                      {location.is_primary_location && (
                        <Badge variant="default">Primary</Badge>
                      )}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Address</h4>
                      <p className="text-sm text-muted-foreground">
                        {location.address}, {location.city}, {location.state} {location.zip_code}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Performance</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Google Rating:</span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            {location.google_rating?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Reviews:</span>
                          <span>{location.google_review_count || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SEO Score:</span>
                          <span>{location.local_seo_score || 0}/100</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {location.business_hours && (
                    <div>
                      <h4 className="font-medium mb-2">Business Hours</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(location.business_hours).map(([day, hours]: [string, any]) => (
                          <div key={day} className="flex justify-between">
                            <span className="capitalize">{day}:</span>
                            <span>
                              {hours?.closed ? 'Closed' : `${hours?.open || 'N/A'} - ${hours?.close || 'N/A'}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          {profile.services.length > 0 ? (
            <div className="grid gap-4">
              {profile.services.map((service) => (
                <Card key={service.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{service.name}</h3>
                          {service.is_featured && (
                            <Badge variant="default">Featured</Badge>
                          )}
                        </div>
                        {service.description && (
                          <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          {service.category && (
                            <Badge variant="outline">{service.category}</Badge>
                          )}
                          {service.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {service.duration_minutes} min
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {service.price_display && (
                          <p className="font-semibold">{service.price_display}</p>
                        )}
                        {service.booking_url && (
                          <Button size="sm" variant="outline" className="mt-2">
                            Book Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No services configured yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          {profile.seo_keywords.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>SEO Keywords</CardTitle>
                <CardDescription>
                  Tracking {profile.total_keywords} keywords with average ranking of {Math.round(profile.average_ranking)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {profile.seo_keywords.slice(0, 10).map((keyword) => (
                    <div key={keyword.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{keyword.keyword}</span>
                        <Badge variant="outline">{keyword.competition_level}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          (keyword.current_rank || 100) <= 10 ? 'text-green-600' :
                          (keyword.current_rank || 100) <= 30 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          #{keyword.current_rank || '100+'}
                        </span>
                        {keyword.rank_change && (
                          <span className={`text-xs ${
                            keyword.rank_change < 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {keyword.rank_change > 0 ? '+' : ''}{keyword.rank_change}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No SEO keywords being tracked yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          {profile.social_posts.length > 0 ? (
            <div className="space-y-4">
              {profile.social_posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="capitalize">
                            {post.platform}
                          </Badge>
                          <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                            {post.status}
                          </Badge>
                          {post.scheduled_for && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(post.scheduled_for).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm mb-2">{post.content}</p>
                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {post.hashtags.map((tag, index) => (
                              <span key={index} className="text-xs text-blue-600">#{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div className="space-y-1">
                          {post.likes_count > 0 && <div>👍 {post.likes_count}</div>}
                          {post.comments_count > 0 && <div>💬 {post.comments_count}</div>}
                          {post.shares_count > 0 && <div>🔄 {post.shares_count}</div>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No social media posts yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          {profile.menu.length > 0 ? (
            <div className="space-y-6">
              {/* Group menu items by category */}
              {Object.entries(
                profile.menu.reduce((acc, item) => {
                  if (!acc[item.category]) acc[item.category] = []
                  acc[item.category].push(item)
                  return acc
                }, {} as Record<string, typeof profile.menu>)
              ).map(([category, items]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle>{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-start justify-between pb-4 border-b last:border-b-0">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{item.name}</h4>
                              {item.is_featured && (
                                <Badge variant="default">Featured</Badge>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                            )}
                            {item.dietary_tags && item.dietary_tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.dietary_tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            {item.price && (
                              <p className="font-semibold">${item.price.toFixed(2)}</p>
                            )}
                            {item.spice_level && item.spice_level > 0 && (
                              <p className="text-xs text-red-500">
                                {'🌶️'.repeat(item.spice_level)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No menu items configured yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
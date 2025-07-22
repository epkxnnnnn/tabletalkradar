import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { aiAnalysis } from '@/lib/ai-clients'
import { communications } from '@/lib/communications'
import { BusinessData } from '@/lib/business-types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { businessName, website, address, phone, category, email, industry, business_type, target_market, business_size, location_type } = body
    
    // Create BusinessData object
    const businessData: BusinessData = {
      industry: industry || 'other',
      business_type: business_type || category || 'other',
      target_market: target_market || 'local',
      size: business_size || 'small',
      location_type: location_type || 'local'
    }

    // Validate required fields
    if (!businessName || !website) {
      return NextResponse.json({ 
        error: 'Business name and website are required' 
      }, { status: 400 })
    }

    // Generate audit ID
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Start audit process
    const auditStartTime = new Date().toISOString()
    
    // Simulate audit process (in real implementation, this would call the AI APIs)
    const auditResults = {
      auditId,
      timestamp: auditStartTime,
      businessInfo: { 
        businessName, 
        website, 
        address, 
        phone, 
        category, 
        email,
        industry,
        business_type,
        target_market,
        business_size,
        location_type
      },
      overallScore: 85,
      googleMyBusiness: {
        score: 90,
        verified: true,
        reviews: { count: 127, average: 4.2 },
        photos: 23,
        posts: 5,
        hours: true,
        issues: ['Missing business photos', 'Inconsistent posting schedule']
      },
      seo: {
        score: 78,
        title: 'Good title structure',
        metaDesc: 'Needs improvement',
        headings: 'Proper H1-H6 hierarchy',
        loading: 2.3,
        mobile: true,
        ssl: true,
        issues: ['Slow loading speed', 'Missing schema markup'],
        recommendations: ['Optimize images', 'Add structured data']
      },
      socialMedia: {
        score: 65,
        platforms: ['Facebook', 'Instagram'],
        followers: 1200,
        engagement: 3.2,
        issues: ['Inconsistent posting', 'Poor response time']
      },
      citations: {
        score: 82,
        total: 45,
        consistent: 38,
        issues: ['Inconsistent NAP across platforms']
      },
      website: {
        score: 88,
        mobile: true,
        speed: 'Good',
        design: 'Professional',
        issues: ['Missing contact form', 'No online services integration']
      },
      recommendations: {
        immediate: [
          'Optimize your Google My Business profile',
          'Improve website loading speed',
          'Create consistent social media posting schedule',
          'Respond to all customer reviews promptly'
        ],
        shortTerm: [
          'Implement customer review management system',
          'Add schema markup to website',
          'Create content calendar for social media',
          'Optimize for local search keywords'
        ],
        longTerm: [
          'Develop customer loyalty program',
          'Implement advanced analytics tracking',
          'Create video content strategy',
          'Build email marketing list'
        ],
        aiInsights: [
          'Market analysis shows growth potential in your area',
          'Competitor gap analysis completed',
          'Customer sentiment trending positive',
          'Local SEO opportunities identified'
        ]
      },
      competitors: [
        {
          name: 'Competitor A',
          website: 'competitora.com',
          score: 92,
          strengths: [
            'Strong social media presence',
            'Excellent customer reviews',
            'Fast website loading speed',
            'Comprehensive online services'
          ],
          weaknesses: [
            'Limited delivery options',
            'No loyalty program',
            'Poor mobile app experience'
          ],
          opportunities: [
            'Expand delivery partnerships',
            'Launch mobile app',
            'Implement loyalty rewards'
          ],
          marketShare: 25,
          reviewCount: 450,
          averageRating: 4.6,
          socialMediaPresence: {
            platforms: ['Facebook', 'Instagram', 'TikTok'],
            followers: 8500,
            engagement: 4.8
          },
          seoMetrics: {
            domainAuthority: 45,
            backlinks: 1250,
            organicTraffic: 15000
          }
        },
        {
          name: 'Competitor B',
          website: 'competitorb.com',
          score: 88,
          strengths: [
            'High domain authority',
            'Strong backlink profile',
            'Excellent SEO performance',
            'Professional website design'
          ],
          weaknesses: [
            'Limited social media engagement',
            'Poor customer service ratings',
            'Outdated business photos'
          ],
          opportunities: [
            'Improve social media strategy',
            'Enhance customer service',
            'Update visual content'
          ],
          marketShare: 20,
          reviewCount: 320,
          averageRating: 4.3,
          socialMediaPresence: {
            platforms: ['Facebook', 'Instagram'],
            followers: 4200,
            engagement: 2.1
          },
          seoMetrics: {
            domainAuthority: 52,
            backlinks: 2100,
            organicTraffic: 22000
          }
        },
        {
          name: 'Competitor C',
          website: 'competitorc.com',
          score: 76,
          strengths: [
            'Unique service offerings',
            'Good local SEO',
            'Consistent branding',
            'Fast delivery service'
          ],
          weaknesses: [
            'Low social media presence',
            'Poor website performance',
            'Limited online ordering',
            'Inconsistent customer reviews'
          ],
          opportunities: [
            'Improve website speed',
            'Enhance online ordering',
            'Build social media presence'
          ],
          marketShare: 15,
          reviewCount: 180,
          averageRating: 4.1,
          socialMediaPresence: {
            platforms: ['Facebook'],
            followers: 1200,
            engagement: 1.8
          },
          seoMetrics: {
            domainAuthority: 38,
            backlinks: 850,
            organicTraffic: 9500
          }
        },
        {
          name: 'Competitor D',
          website: 'competitord.com',
          score: 82,
          strengths: [
            'Strong customer loyalty',
            'Excellent service ratings',
            'Good mobile experience',
            'Consistent quality'
          ],
          weaknesses: [
            'Limited online presence',
            'Poor SEO performance',
            'No social media strategy',
            'Outdated website design'
          ],
          opportunities: [
            'Improve website design',
            'Develop social media strategy',
            'Enhance SEO performance'
          ],
          marketShare: 18,
          reviewCount: 280,
          averageRating: 4.5,
          socialMediaPresence: {
            platforms: ['Facebook'],
            followers: 800,
            engagement: 1.2
          },
          seoMetrics: {
            domainAuthority: 35,
            backlinks: 650,
            organicTraffic: 7800
          }
        }
      ],
      aiInsights: {
        perplexity: `Market research shows strong growth potential for ${businessData.business_type} businesses in your ${businessData.target_market} market`,
        kimi: `Technical SEO analysis reveals optimization opportunities for ${businessData.industry} industry`,
        claude: `${businessData.business_type} industry insights suggest optimization opportunities for your business model`,
        openai: 'Customer sentiment analysis shows positive trends in your market segment',
        gemini: `Google ecosystem optimization recommendations ready for ${businessData.business_type} businesses`
      }
    }

    // Save to database
    try {
      const { error } = await supabaseAdmin
        .from('audits')
        .insert({
          id: auditId,
          business_name: businessName,
          website,
          category,
          industry: businessData.industry,
          business_type: businessData.business_type,
          target_market: businessData.target_market,
          overall_score: auditResults.overallScore,
          audit_data: auditResults,
          status: 'completed'
        })

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json({ 
          error: 'Failed to save audit results' 
        }, { status: 500 })
      }
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      // Continue without saving to database
    }

    // Send notifications
    if (email) {
      try {
        await communications.sendAuditComplete(email, phone, businessName, auditResults.overallScore, `http://localhost:3000/audit/${auditId}`)
      } catch (emailError) {
        console.error('Email error:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      auditId,
      results: auditResults
    })

  } catch (error) {
    console.error('Audit error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
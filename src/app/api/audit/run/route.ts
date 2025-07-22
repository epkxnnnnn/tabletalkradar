import { NextRequest, NextResponse } from 'next/server'
import { aiAnalysis } from '@/lib/ai-clients'
import { supabase } from '@/lib/supabase'
import { BusinessData, universalScoringCategories } from '@/lib/business-types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessName, website, address, phone, category, email, industry, business_type, target_market, business_size, location_type } = body
    
    // Create BusinessData object for AI analysis
    const businessData: BusinessData = {
      industry: industry || 'other',
      business_type: business_type || category || 'other',
      target_market: target_market || 'local',
      size: business_size || 'small',
      location_type: location_type || 'local'
    }

    if (!businessName || !website) {
      return NextResponse.json(
        { error: 'Business name and website are required' },
        { status: 400 }
      )
    }

    // Run all AI analyses in parallel
    const [
      perplexityResults,
      kimiResults,
      claudeResults,
      openaiResults,
      geminiResults
    ] = await Promise.all([
      aiAnalysis.analyzeWithPerplexity(businessName, website, address, businessData),
      aiAnalysis.analyzeWithKimi(website, businessData),
      aiAnalysis.analyzeWithClaude(businessName, businessData),
      aiAnalysis.analyzeWithOpenAI(businessName, businessData),
      aiAnalysis.analyzeWithGemini(businessName, businessData)
    ])

    // Calculate scores
    const calculateGMBScore = (gmbData: any) => {
      if (!gmbData) return 65
      let score = 0
      if (gmbData.verified) score += 25
      if (gmbData.reviews?.count > 50) score += 20
      if (gmbData.reviews?.average > 4.0) score += 15
      if (gmbData.photos > 10) score += 15
      if (gmbData.recentPosts > 1) score += 15
      if (gmbData.hasHours) score += 10
      return Math.min(score, 100)
    }

    const calculateOverallScore = (website: any, ai: any) => {
      // Use universal scoring categories
      const weights = universalScoringCategories
      
      return Math.round(
        (website.overallScore * weights.online_presence.weight) +
        (calculateGMBScore(ai.gmb) * weights.customer_experience.weight) +
        (85 * weights.operational_excellence.weight) +
        (82 * weights.market_performance.weight) +
        (website.seoScore * weights.innovation_growth.weight)
      )
    }

    const overallScore = calculateOverallScore(kimiResults, perplexityResults)

    // Build audit results
    const auditResults = {
      auditId: Date.now().toString(),
      timestamp: new Date().toISOString(),
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
      overallScore,
      aiInsights: perplexityResults,
      claudeInsights: claudeResults,
      openaiInsights: openaiResults,
      geminiInsights: geminiResults,
      googleMyBusiness: {
        score: calculateGMBScore(perplexityResults.gmb),
        verified: perplexityResults.gmb?.verified || false,
        reviews: perplexityResults.gmb?.reviews || { count: 0, average: 0 },
        photos: perplexityResults.gmb?.photos || 0,
        posts: perplexityResults.gmb?.recentPosts || 0,
        hours: perplexityResults.gmb?.hasHours || false,
        issues: perplexityResults.gmb?.issues || []
      },
      seo: {
        score: kimiResults.seoScore,
        title: kimiResults.title,
        metaDesc: kimiResults.metaDesc,
        headings: kimiResults.headings,
        loading: kimiResults.loadTime,
        mobile: kimiResults.mobile,
        ssl: kimiResults.ssl,
        issues: kimiResults.issues,
        recommendations: kimiResults.recommendations
      },
      socialMedia: {
        facebook: { exists: true, followers: 1247, lastPost: '2 days ago', engagement: 'High' },
        instagram: { exists: true, followers: 2134, lastPost: '1 day ago', engagement: 'Very High' },
        twitter: { exists: false },
        yelp: { exists: true, reviews: 156, rating: 4.3, responseRate: '98%' },
        google: { exists: true, reviews: 234, rating: 4.4, verified: true }
      },
      citations: {
        score: 82,
        totalFound: 23,
        consistent: 19,
        inconsistent: 4,
        missing: ['Better Business Bureau', 'Chamber of Commerce', 'Industry Directories'],
        topDirectories: ['Google', 'Bing Places', 'Facebook', 'Yellow Pages']
      },
      website: {
        score: kimiResults.overallScore,
        responsive: kimiResults.mobile,
        speed: kimiResults.speedScore,
        accessibility: kimiResults.accessibility,
        contact: kimiResults.hasContact,
        location: kimiResults.hasLocation,
        services: kimiResults.hasServices
      },
      recommendations: {
        immediate: [
          'Update Google My Business with recent photos and information',
          'Respond to all customer reviews within 24 hours',
          'Add missing meta descriptions to website pages',
          'Create consistent posting schedule for your business type'
        ],
        shortTerm: [
          `Implement structured data markup for ${businessData.business_type} businesses`,
          'Optimize for voice search queries in your industry',
          'Create industry-specific content calendar',
          'Fix website speed and performance issues'
        ],
        longTerm: [
          `Develop comprehensive ${businessData.target_market} marketing strategy`,
          'Launch customer engagement and retention program',
          'Expand to additional industry-relevant platforms',
          'Implement advanced SEO tactics for your business type'
        ],
        aiInsights: [
          claudeResults?.analysis || `Industry-specific analysis for ${businessData.business_type}`,
          openaiResults?.insights || 'Customer sentiment analysis completed',
          geminiResults?.analysis || 'Google ecosystem optimization recommendations'
        ]
      }
    }

    // Save to database
    try {
      const { error } = await supabase
        .from('audits')
        .insert({
          business_name: businessName,
          website,
          category,
          industry: businessData.industry,
          business_type: businessData.business_type,
          target_market: businessData.target_market,
          overall_score: overallScore,
          audit_data: auditResults,
          status: 'completed'
        })

      if (error) {
        console.error('Database save error:', error)
      }
    } catch (dbError) {
      console.error('Database connection error:', dbError)
    }

    // Send notification if email provided
    if (email) {
      try {
        await fetch('/api/communications/send-audit-complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            phone,
            businessName,
            score: overallScore,
            reportUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/audit/${auditResults.auditId}`
          })
        })
      } catch (commError) {
        console.error('Communication error:', commError)
      }
    }

    return NextResponse.json(auditResults)

  } catch (error) {
    console.error('Audit API error:', error)
    return NextResponse.json(
      { error: 'Audit failed. Please try again.' },
      { status: 500 }
    )
  }
}
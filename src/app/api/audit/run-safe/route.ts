import { NextRequest, NextResponse } from 'next/server'
import { aiAnalysis } from '@/lib/ai-clients'
import { createSupabaseAdmin } from '@/lib/supabase-client'

// Helper function to calculate GMB score
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

export async function POST(request: NextRequest) {
  console.log('Audit API called at:', new Date().toISOString())
  
  try {
    const body = await request.json()
    const { businessName, website, address, phone, category, email } = body

    console.log('Audit request for:', businessName)

    if (!businessName || !website) {
      return NextResponse.json(
        { error: 'Business name and website are required' },
        { status: 400 }
      )
    }

    const errors: string[] = []

    // Try to run AI analyses with error handling
    const aiPromises = [
      aiAnalysis.analyzeWithPerplexity(businessName, website, address, category)
        .catch(err => {
          console.error('Perplexity error:', err)
          errors.push('Perplexity analysis failed')
          return null
        }),
      aiAnalysis.analyzeWithKimi(website, category)
        .catch(err => {
          console.error('Kimi error:', err)
          errors.push('Kimi analysis failed')
          return null
        }),
      aiAnalysis.analyzeWithClaude(businessName, category)
        .catch(err => {
          console.error('Claude error:', err)
          errors.push('Claude analysis failed')
          return null
        }),
      aiAnalysis.analyzeWithOpenAI(businessName)
        .catch(err => {
          console.error('OpenAI error:', err)
          errors.push('OpenAI analysis failed')
          return null
        }),
      aiAnalysis.analyzeWithGemini(businessName)
        .catch(err => {
          console.error('Gemini error:', err)
          errors.push('Gemini analysis failed')
          return null
        })
    ]

    const [
      perplexityResults,
      kimiResults,
      claudeResults,
      openaiResults,
      geminiResults
    ] = await Promise.all(aiPromises)

    // Build results object
    let gmbScore = 65
    let gmbData = {
      score: 65,
      verified: false,
      reviews: { count: 0, average: 0 },
      photos: 0,
      posts: 0,
      hours: false,
      issues: ['Analysis pending'] as string[]
    }

    if (perplexityResults?.gmb) {
      gmbScore = calculateGMBScore(perplexityResults.gmb)
      gmbData = {
        score: gmbScore,
        verified: perplexityResults.gmb.verified || false,
        reviews: perplexityResults.gmb.reviews || { count: 0, average: 0 },
        photos: perplexityResults.gmb.photos || 0,
        posts: perplexityResults.gmb.recentPosts || 0,
        hours: perplexityResults.gmb.hasHours || false,
        issues: perplexityResults.gmb.issues || []
      }
    }

    let seoData = {
      score: 50,
      title: { exists: false },
      metaDesc: { exists: false },
      headings: { h1: 0, h2: 0, h3: 0 },
      loading: 0,
      mobile: false,
      ssl: false,
      issues: ['Analysis pending'] as string[],
      recommendations: [] as string[]
    }

    let websiteData = {
      score: 50,
      responsive: false,
      speed: 0,
      accessibility: 0,
      contact: false,
      location: false,
      services: false
    }

    if (kimiResults) {
      seoData = {
        score: kimiResults.seoScore || 50,
        title: kimiResults.title || { exists: false },
        metaDesc: kimiResults.metaDesc || { exists: false },
        headings: kimiResults.headings || { h1: 0, h2: 0, h3: 0 },
        loading: kimiResults.loadTime || 0,
        mobile: kimiResults.mobile || false,
        ssl: kimiResults.ssl || false,
        issues: kimiResults.issues || [],
        recommendations: kimiResults.recommendations || []
      }
      websiteData = {
        score: kimiResults.overallScore || 50,
        responsive: kimiResults.mobile || false,
        speed: kimiResults.speedScore || 0,
        accessibility: kimiResults.accessibility || 0,
        contact: kimiResults.hasContact || false,
        location: kimiResults.hasLocation || false,
        services: kimiResults.hasServices || false
      }
    }

    // Calculate overall score
    const calculateOverallScore = () => {
      const weights = {
        website: 0.3,
        gmb: 0.25,
        social: 0.2,
        citations: 0.15,
        seo: 0.1
      }

      const socialScore = 70 // Default for now
      const citationScore = 70 // Default for now

      return Math.round(
        (websiteData.score * weights.website) +
        (gmbScore * weights.gmb) +
        (socialScore * weights.social) +
        (citationScore * weights.citations) +
        (seoData.score * weights.seo)
      )
    }

    const overallScore = calculateOverallScore()

    // Build final audit results
    const auditResults = {
      auditId: Date.now().toString(),
      timestamp: new Date().toISOString(),
      businessInfo: { businessName, website, address, phone, category, email },
      overallScore,
      errors,
      aiInsights: perplexityResults,
      claudeInsights: claudeResults,
      openaiInsights: openaiResults,
      geminiInsights: geminiResults,
      googleMyBusiness: gmbData,
      seo: seoData,
      socialMedia: {
        facebook: { exists: false },
        instagram: { exists: false },
        twitter: { exists: false },
        yelp: { exists: false },
        google: { exists: false }
      },
      citations: {
        score: 70,
        totalFound: 0,
        consistent: 0,
        inconsistent: 0,
        missing: [] as string[],
        topDirectories: [] as string[]
      },
      website: websiteData,
      recommendations: {
        immediate: [
          'Update Google My Business with recent photos',
          'Respond to all reviews within 24 hours',
          'Add missing meta descriptions to website pages',
          'Create weekly Google My Business posts'
        ],
        shortTerm: [
          'Implement structured data markup for menu items',
          'Optimize for voice search queries',
          'Create social media content calendar',
          'Fix website speed issues'
        ],
        longTerm: [
          'Develop comprehensive content marketing strategy',
          'Launch customer loyalty program',
          'Expand to additional review platforms',
          'Implement advanced local SEO tactics'
        ],
        aiInsights: [
          claudeResults?.analysis || 'Restaurant-specific analysis pending',
          openaiResults?.insights || 'Customer sentiment analysis pending',
          geminiResults?.analysis || 'Google ecosystem optimization pending'
        ]
      }
    }

    // Try to save to database
    try {
      const supabaseAdmin = createSupabaseAdmin()
      if (supabaseAdmin) {
        const { error } = await supabaseAdmin
          .from('audits')
          .insert({
            business_name: businessName,
            website,
            category,
            overall_score: overallScore,
            audit_data: auditResults,
            status: 'completed'
          })

        if (error) {
          console.error('Database save error:', error)
          errors.push('Failed to save to database')
        }
      } else {
        console.error('Supabase client not initialized')
        errors.push('Database connection not available')
      }
    } catch (dbError: any) {
      console.error('Database error:', dbError)
      errors.push('Database error: ' + dbError.message)
    }

    // Return results even if some parts failed
    return NextResponse.json({
      ...auditResults,
      debugInfo: {
        totalErrors: errors.length,
        partialSuccess: errors.length > 0 && errors.length < 5,
        message: errors.length === 0 
          ? 'All analyses completed successfully' 
          : `Completed with ${errors.length} errors`
      }
    })

  } catch (error: any) {
    console.error('Audit API error:', error)
    return NextResponse.json(
      { 
        error: 'Audit failed',
        message: error.message,
        debugInfo: {
          timestamp: new Date().toISOString(),
          errorType: error.name,
          stack: error.stack
        }
      },
      { status: 500 }
    )
  }
}
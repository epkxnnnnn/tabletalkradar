import { NextRequest, NextResponse } from 'next/server'
import { aiAnalysis } from '@/lib/ai-clients'
import { createSupabaseAdmin } from '@/lib/supabase-client'

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

    // Initialize results with defaults
    let auditResults = {
      auditId: Date.now().toString(),
      timestamp: new Date().toISOString(),
      businessInfo: { businessName, website, address, phone, category, email },
      overallScore: 0,
      errors: [] as string[],
      aiInsights: null,
      claudeInsights: null,
      openaiInsights: null,
      geminiInsights: null,
      googleMyBusiness: {
        score: 0,
        verified: false,
        reviews: { count: 0, average: 0 },
        photos: 0,
        posts: 0,
        hours: false,
        issues: ['Analysis pending']
      },
      seo: {
        score: 0,
        title: { exists: false },
        metaDesc: { exists: false },
        headings: { h1: 0, h2: 0, h3: 0 },
        loading: 0,
        mobile: false,
        ssl: false,
        issues: ['Analysis pending'],
        recommendations: []
      },
      socialMedia: {
        facebook: { exists: false },
        instagram: { exists: false },
        twitter: { exists: false },
        yelp: { exists: false },
        google: { exists: false }
      },
      citations: {
        score: 0,
        totalFound: 0,
        consistent: 0,
        inconsistent: 0,
        missing: [],
        topDirectories: []
      },
      website: {
        score: 0,
        responsive: false,
        speed: 0,
        accessibility: 0,
        contact: false,
        location: false,
        services: false
      },
      recommendations: {
        immediate: ['Complete analysis to get recommendations'],
        shortTerm: [],
        longTerm: [],
        aiInsights: []
      }
    }

    // Try to run AI analyses with error handling
    const aiPromises = [
      aiAnalysis.analyzeWithPerplexity(businessName, website, address, category)
        .catch(err => {
          console.error('Perplexity error:', err)
          auditResults.errors.push('Perplexity analysis failed')
          return null
        }),
      aiAnalysis.analyzeWithKimi(website, category)
        .catch(err => {
          console.error('Kimi error:', err)
          auditResults.errors.push('Kimi analysis failed')
          return null
        }),
      aiAnalysis.analyzeWithClaude(businessName, category)
        .catch(err => {
          console.error('Claude error:', err)
          auditResults.errors.push('Claude analysis failed')
          return null
        }),
      aiAnalysis.analyzeWithOpenAI(businessName)
        .catch(err => {
          console.error('OpenAI error:', err)
          auditResults.errors.push('OpenAI analysis failed')
          return null
        }),
      aiAnalysis.analyzeWithGemini(businessName)
        .catch(err => {
          console.error('Gemini error:', err)
          auditResults.errors.push('Gemini analysis failed')
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

    // Process results that succeeded
    if (perplexityResults) {
      auditResults.aiInsights = perplexityResults
      if (perplexityResults.gmb) {
        auditResults.googleMyBusiness = {
          score: calculateGMBScore(perplexityResults.gmb),
          verified: perplexityResults.gmb.verified || false,
          reviews: perplexityResults.gmb.reviews || { count: 0, average: 0 },
          photos: perplexityResults.gmb.photos || 0,
          posts: perplexityResults.gmb.recentPosts || 0,
          hours: perplexityResults.gmb.hasHours || false,
          issues: perplexityResults.gmb.issues || []
        }
      }
    }

    if (kimiResults) {
      auditResults.seo = {
        score: kimiResults.seoScore || 0,
        title: kimiResults.title || { exists: false },
        metaDesc: kimiResults.metaDesc || { exists: false },
        headings: kimiResults.headings || { h1: 0, h2: 0, h3: 0 },
        loading: kimiResults.loadTime || 0,
        mobile: kimiResults.mobile || false,
        ssl: kimiResults.ssl || false,
        issues: kimiResults.issues || [],
        recommendations: kimiResults.recommendations || []
      }
      auditResults.website = {
        score: kimiResults.overallScore || 0,
        responsive: kimiResults.mobile || false,
        speed: kimiResults.speedScore || 0,
        accessibility: kimiResults.accessibility || 0,
        contact: kimiResults.hasContact || false,
        location: kimiResults.hasLocation || false,
        services: kimiResults.hasServices || false
      }
    }

    if (claudeResults) {
      auditResults.claudeInsights = claudeResults
    }

    if (openaiResults) {
      auditResults.openaiInsights = openaiResults
    }

    if (geminiResults) {
      auditResults.geminiInsights = geminiResults
    }

    // Calculate overall score
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

    const calculateOverallScore = () => {
      const weights = {
        website: 0.3,
        gmb: 0.25,
        social: 0.2,
        citations: 0.15,
        seo: 0.1
      }

      const websiteScore = auditResults.website.score || 50
      const gmbScore = auditResults.googleMyBusiness.score || 50
      const socialScore = 70 // Default for now
      const citationScore = 70 // Default for now
      const seoScore = auditResults.seo.score || 50

      return Math.round(
        (websiteScore * weights.website) +
        (gmbScore * weights.gmb) +
        (socialScore * weights.social) +
        (citationScore * weights.citations) +
        (seoScore * weights.seo)
      )
    }

    auditResults.overallScore = calculateOverallScore()

    // Generate recommendations
    auditResults.recommendations = {
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
            overall_score: auditResults.overallScore,
            audit_data: auditResults,
            status: 'completed'
          })

        if (error) {
          console.error('Database save error:', error)
          auditResults.errors.push('Failed to save to database')
        }
      } else {
        console.error('Supabase client not initialized')
        auditResults.errors.push('Database connection not available')
      }
    } catch (dbError: any) {
      console.error('Database error:', dbError)
      auditResults.errors.push('Database error: ' + dbError.message)
    }

    // Return results even if some parts failed
    return NextResponse.json({
      ...auditResults,
      debugInfo: {
        totalErrors: auditResults.errors.length,
        partialSuccess: auditResults.errors.length > 0 && auditResults.errors.length < 5,
        message: auditResults.errors.length === 0 
          ? 'All analyses completed successfully' 
          : `Completed with ${auditResults.errors.length} errors`
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
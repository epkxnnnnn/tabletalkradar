import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!

export async function POST(request: NextRequest) {
  try {
    const { 
      client_id,
      business_name,
      industry,
      platforms,
      post_type = 'text',
      category = 'promotional',
      tone = 'professional',
      custom_prompt,
      content_length = 'medium'
    } = await request.json()

    if (!business_name || !industry) {
      return NextResponse.json({ error: 'Business name and industry are required' }, { status: 400 })
    }

    // Generate AI content based on business details
    const { caption, hashtags } = await generateSocialContent({
      business_name,
      industry,
      platforms: platforms || ['facebook', 'instagram'],
      post_type,
      category,
      tone,
      custom_prompt,
      content_length
    })

    return NextResponse.json({
      success: true,
      content: caption,
      hashtags: hashtags,
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating social content:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}

interface ContentParams {
  business_name: string
  industry: string
  platforms: string[]
  post_type: string
  category: string
  tone: string
  custom_prompt?: string
  content_length: string
}

async function generateSocialContent(params: ContentParams): Promise<{ caption: string, hashtags: string[] }> {
  const { business_name, industry, platforms, post_type, category, tone, custom_prompt, content_length } = params

  try {
    // Determine character limits based on platforms
    const hasTwitter = platforms.includes('twitter')
    const maxLength = hasTwitter ? 220 : content_length === 'short' ? 100 : content_length === 'long' ? 300 : 150

    // Create platform-specific guidance
    const platformGuidance = platforms.map(platform => {
      switch (platform) {
        case 'facebook': return 'Facebook (engaging, community-focused)'
        case 'instagram': return 'Instagram (visual, lifestyle-focused with emojis)'
        case 'twitter': return 'Twitter (concise, trending, conversational)'
        case 'linkedin': return 'LinkedIn (professional, business-focused)'
        case 'tiktok': return 'TikTok (fun, trendy, youth-oriented)'
        default: return platform
      }
    }).join(', ')

    const systemPrompt = `You are a professional social media content creator specializing in ${industry} businesses. Create engaging social media content that:

1. CAPTION REQUIREMENTS:
   - Write for: ${platformGuidance}
   - Business: ${business_name} (${industry})
   - Post type: ${post_type}
   - Category: ${category}
   - Tone: ${tone}
   - Length: Maximum ${maxLength} characters
   - Include relevant emojis if appropriate for platform
   - Make it engaging and action-oriented
   - Focus on customer value and benefits

2. HASHTAG REQUIREMENTS:
   - Generate 8-12 relevant hashtags
   - Mix of popular and niche hashtags
   - Include industry-specific tags
   - Include location/business type tags
   - No spaces in hashtags
   - Start each with #

3. INDUSTRY-SPECIFIC FOCUS:
   ${getIndustryGuidance(industry)}

4. CATEGORY-SPECIFIC APPROACH:
   ${getCategoryGuidance(category)}

Return your response as JSON with "caption" and "hashtags" (array) fields only.`

    const userPrompt = custom_prompt || `Create a ${category} social media post for ${business_name}, a ${industry} business. The post will be shared on ${platforms.join(', ')}. Make it ${tone} and engaging.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 400,
        temperature: 0.8,
        response_format: { type: "json_object" }
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    const result = JSON.parse(data.choices[0]?.message?.content || '{}')

    // Validate and clean up the response
    const caption = result.caption || ''
    const hashtags = Array.isArray(result.hashtags) 
      ? result.hashtags.filter((tag: string) => tag.startsWith('#')).slice(0, 12)
      : []

    return { caption, hashtags }

  } catch (error) {
    console.error('Error generating AI content:', error)
    
    // Fallback content generation
    return generateFallbackContent(params)
  }
}

function getIndustryGuidance(industry: string): string {
  const guidance: { [key: string]: string } = {
    'food': 'Focus on taste, freshness, dining experience, and food photography. Mention ingredients, specials, and ambiance.',
    'restaurant': 'Highlight menu items, chef expertise, dining atmosphere, and customer service. Use food emojis.',
    'health': 'Emphasize wellness, expertise, patient care, and health benefits. Keep tone professional yet caring.',
    'fitness': 'Focus on motivation, results, community, and healthy lifestyle. Use energetic language.',
    'retail': 'Highlight products, deals, quality, and customer satisfaction. Include call-to-action.',
    'service': 'Emphasize expertise, customer service, reliability, and results. Build trust.',
    'beauty': 'Focus on transformation, self-care, expertise, and confidence. Use beauty-related emojis.',
    'professional': 'Maintain professional tone, highlight expertise, and business value proposition.',
    'default': 'Focus on your unique value proposition, customer benefits, and what sets you apart.'
  }

  const key = Object.keys(guidance).find(k => industry.toLowerCase().includes(k))
  return guidance[key] || guidance['default']
}

function getCategoryGuidance(category: string): string {
  const guidance: { [key: string]: string } = {
    'promotional': 'Highlight offers, deals, or special services. Include clear call-to-action.',
    'educational': 'Share tips, insights, or valuable information. Position as expert.',
    'entertainment': 'Be fun, engaging, and shareable. Use humor or interesting facts.',
    'behind_scenes': 'Show the human side, process, or team. Build connection and trust.',
    'customer_spotlight': 'Celebrate customers, testimonials, or success stories.',
    'event': 'Build excitement, provide details, and encourage attendance.',
    'announcement': 'Share news clearly and generate interest or congratulations.',
    'seasonal': 'Connect to current season, holidays, or timely events.',
    'trending': 'Tap into current trends, hashtags, or popular topics.',
    'default': 'Create engaging content that provides value to your audience.'
  }

  return guidance[category] || guidance['default']
}

// Fallback content generator
function generateFallbackContent(params: ContentParams): { caption: string, hashtags: string[] } {
  const { business_name, industry, category } = params

  const fallbackCaptions: { [key: string]: string } = {
    'promotional': `🌟 Special offer at ${business_name}! Experience the difference with our premium ${industry} services. Contact us today!`,
    'educational': `💡 Did you know? At ${business_name}, we believe in sharing knowledge. Here's a quick tip from our ${industry} experts!`,
    'behind_scenes': `👀 Behind the scenes at ${business_name}! Our dedicated team works hard to bring you the best ${industry} experience.`,
    'default': `✨ At ${business_name}, we're passionate about providing exceptional ${industry} services. Come visit us today!`
  }

  const fallbackHashtags = [
    `#${business_name.replace(/\s+/g, '')}`,
    `#${industry.replace(/\s+/g, '')}`,
    '#local',
    '#quality',
    '#service',
    '#professional',
    '#business',
    '#community'
  ]

  const caption = fallbackCaptions[category] || fallbackCaptions['default']
  
  return { caption, hashtags: fallbackHashtags }
}
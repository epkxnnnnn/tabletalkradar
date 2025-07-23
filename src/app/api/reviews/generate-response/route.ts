import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!

export async function POST(request: NextRequest) {
  try {
    const { 
      review_id,
      business_name,
      industry,
      rating,
      review_text,
      reviewer_name,
      platform 
    } = await request.json()

    if (!review_id || !business_name || !rating || !review_text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate AI response based on rating and content
    const aiResponse = await generateTailoredResponse({
      business_name,
      industry,
      rating,
      review_text,
      reviewer_name,
      platform
    })

    return NextResponse.json({
      success: true,
      response: aiResponse
    })

  } catch (error) {
    console.error('Error generating AI response:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}

interface ResponseParams {
  business_name: string
  industry: string
  rating: number
  review_text: string
  reviewer_name: string
  platform: string
}

async function generateTailoredResponse(params: ResponseParams): Promise<string> {
  const { business_name, industry, rating, review_text, reviewer_name, platform } = params

  try {
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
            content: `You are a professional customer service representative for ${business_name}, a ${industry} business. Generate empathetic, professional responses to customer reviews that:

1. Address the reviewer by name (${reviewer_name})
2. Match the tone to the star rating:
   - 5 stars: Enthusiastic gratitude with specific thanks
   - 4 stars: Warm appreciation with encouragement to return
   - 3 stars: Professional acknowledgment with improvement commitment
   - 2 stars: Sincere apology with specific action steps
   - 1 star: Formal apology with immediate resolution offer

3. Reference specific points mentioned in their review
4. Keep responses concise (2-4 sentences)
5. End with appropriate business signature
6. Sound authentic and personalized, not generic
7. Use warm, human language that builds relationships

For ${industry} businesses, focus on relevant aspects like food quality, service, atmosphere, value, etc.

The response should feel like it comes from a caring business owner who genuinely values customer feedback and wants to build lasting relationships.`
          },
          {
            role: 'user',
            content: `Generate a professional response to this ${rating}-star review on ${platform}:

Reviewer: ${reviewer_name}
Review: "${review_text}"

Business: ${business_name} (${industry})
Platform: ${platform}

Make the response feel personal and address specific points from their review.`
          }
        ],
        max_tokens: 250,
        temperature: 0.8
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content || ''

    return aiResponse.trim()

  } catch (error) {
    console.error('Error generating AI response:', error)
    
    // Fallback to rule-based response if OpenAI fails
    return generateFallbackResponse(params)
  }
}

// Fallback response generator
function generateFallbackResponse(params: ResponseParams): string {
  const { business_name, rating, reviewer_name } = params

  if (rating >= 4) {
    return `Hi ${reviewer_name}! Thank you so much for your wonderful review of ${business_name}. We're thrilled you had such a great experience and look forward to serving you again soon!

Best regards,
The ${business_name} Team`
  } else if (rating === 3) {
    return `Hello ${reviewer_name}, thank you for your feedback about ${business_name}. We appreciate your honest review and are always working to improve our service. We hope to provide you with an even better experience next time!

Best regards,
${business_name}`
  } else {
    return `Dear ${reviewer_name}, we sincerely apologize that your experience at ${business_name} did not meet your expectations. Your feedback is valuable and we would love the opportunity to make this right. Please contact us directly so we can address your concerns.

Sincerely,
${business_name} Management`
  }
}

/* 
Enhanced AI Response Generation Options:

1. Integrate with Claude API for more sophisticated responses:
```javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Generate a professional response to this ${rating}-star review for ${business_name} (${industry}): "${review_text}". The response should be empathetic, professional, and appropriate for the rating level.`
    }]
  })
})
```

2. Use OpenAI GPT for response generation:
```javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are a customer service representative for ${business_name}, a ${industry} business. Generate professional, empathetic responses to customer reviews.`
      },
      {
        role: 'user',
        content: `Generate a response to this ${rating}-star review: "${review_text}"`
      }
    ],
    max_tokens: 200
  })
})
```

3. Add sentiment analysis and keyword extraction for more targeted responses
4. Include business-specific templates and tone settings
5. Add response length and tone customization options
*/
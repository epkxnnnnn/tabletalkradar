// TableTalk Radar - AI Review Response Generation API (v1)
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  withValidation, 
  withMethods,
  successResponse,
  ValidationError
} from '@/lib/api-handler'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!

// Request validation schemas
const GenerateResponseSchema = z.object({
  review_id: z.string().min(1, 'Review ID is required'),
  business_name: z.string().min(1, 'Business name is required'),
  industry: z.string().min(1, 'Industry is required'),
  rating: z.number().int().min(1).max(5),
  review_text: z.string().min(1, 'Review text is required'),
  reviewer_name: z.string().min(1, 'Reviewer name is required'),
  platform: z.string().min(1, 'Platform is required')
})

interface ResponseParams {
  business_name: string
  industry: string
  rating: number
  review_text: string
  reviewer_name: string
  platform: string
}

// Generate AI response using OpenAI
async function generateTailoredResponse(params: ResponseParams): Promise<string> {
  const { business_name, industry, rating, review_text, reviewer_name, platform } = params

  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

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

// POST /api/v1/reviews/reviews/generate-response - Generate AI response for review
export const POST = withMethods(['POST'])(
  withValidation(GenerateResponseSchema)(
    async (req: NextRequest, data: z.infer<typeof GenerateResponseSchema>) => {
    const { 
      review_id,
      business_name,
      industry,
      rating,
      review_text,
      reviewer_name,
      platform 
    } = data

    // Generate AI response based on rating and content
    const aiResponse = await generateTailoredResponse({
      business_name,
      industry,
      rating,
      review_text,
      reviewer_name,
      platform
    })

    return successResponse(
      { 
        review_id,
        response: aiResponse,
        generated_at: new Date().toISOString()
      },
      'AI response generated successfully'
    )
    }
  )
)
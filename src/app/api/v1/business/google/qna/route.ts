// TableTalk Radar - Google My Business Q&A API (v1)
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  withValidation, 
  withMethods,
  successResponse,
  NotFoundError
} from '@/lib/api-handler'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Request validation schemas
const GetQnaSchema = z.object({
  location_id: z.string().min(1, 'Location ID is required')
})

const PostAnswerSchema = z.object({
  location_id: z.string().min(1, 'Location ID is required'),
  question_id: z.string().min(1, 'Question ID is required'),
  answer_text: z.string().min(1, 'Answer text is required')
})

// Helper to get location with client credentials
async function getLocationWithCredentials(locationId: string) {
  const { data: location, error: locationError } = await supabase
    .from('client_locations')
    .select(`
      *,
      clients!inner(
        business_name,
        agency_id,
        google_refresh_token,
        google_client_id,
        google_client_secret
      )
    `)
    .eq('id', locationId)
    .single()

  if (locationError || !location?.google_place_id) {
    throw new NotFoundError('Location or missing Google Place ID')
  }

  const client = location.clients[0]
  if (!client.google_refresh_token) {
    throw new Error('Google Business Profile API requires OAuth 2.0 setup')
  }

  return { location, client }
}

// GET /api/v1/business/google/qna - Fetch Q&A for a location
export const GET = withMethods(['GET'])(
  withValidation(GetQnaSchema)(
    async (req: NextRequest, query: z.infer<typeof GetQnaSchema>) => {
    const { location_id } = query
    const { location, client } = await getLocationWithCredentials(location_id)

    // Fetch Q&A via Supabase Edge Function
    const { data: qnaData, error: qnaError } = await supabase.functions.invoke('gmb-qna', {
      body: {
        refresh_token: client.google_refresh_token,
        account_id: location.google_account_id,
        client_id: client.google_client_id,
        client_secret: client.google_client_secret,
        location_id: location.google_place_id
      }
    })

    if (qnaError) {
      throw new Error(`Failed to fetch Q&A from Google: ${qnaError.message || 'Unknown error'}`)
    }

    const questions = qnaData?.questions || []

    // Store/update Q&A in database for tracking
    for (const question of questions) {
      await supabase
        .from('google_business_qna')
        .upsert({
          location_id: location_id,
          google_question_id: question.name,
          question_text: question.text,
          author: question.author,
          total_answer_count: question.totalAnswerCount || 0,
          question_data: question,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'google_question_id'
        })
    }

    const unansweredQuestions = questions.filter((q: any) => !q.answers || q.answers.length === 0).length

    return successResponse(
      {
        location_name: client.business_name,
        questions: questions,
        total_questions: questions.length,
        unanswered_questions: unansweredQuestions
      },
      `Retrieved ${questions.length} Q&A items for ${client.business_name}`
    )
    }
  )
)

// POST /api/v1/business/google/qna - Create an answer to a question
export const POST = withMethods(['POST'])(
  withValidation(PostAnswerSchema)(
    async (req: NextRequest, data: z.infer<typeof PostAnswerSchema>) => {
    const { location_id, question_id, answer_text } = data
    const { location, client } = await getLocationWithCredentials(location_id)

    // Post answer via Supabase Edge Function
    const { data: edgeData, error } = await supabase.functions.invoke('gmb-schedule', {
      body: {
        refresh_token: client.google_refresh_token,
        account_id: location.google_account_id,
        client_id: client.google_client_id,
        client_secret: client.google_client_secret,
        location_id: location.google_place_id,
        update_type: 'qna',
        update_data: {
          text: answer_text,
          questionId: question_id
        }
      }
    })

    if (error) {
      throw new Error(`Failed to post answer to Google: ${error.message || 'Unknown error'}`)
    }

    // Log the answer activity
    await supabase
      .from('qna_activities')
      .insert({
        location_id: location_id,
        client_id: location.client_id,
        agency_id: client.agency_id,
        google_question_id: question_id,
        activity_type: 'answer_posted',
        activity_data: {
          answer_text: answer_text,
          google_response: edgeData.result
        },
        created_at: new Date().toISOString()
      })

    return successResponse(
      {
        answer: edgeData.result,
        question_id: question_id
      },
      'Answer posted successfully to Google My Business'
    )
    }
  )
)

// PUT /api/v1/business/google/qna - Update existing answer (Limited support)
export const PUT = withMethods(['PUT'])(
  async (req: NextRequest) => {
    throw new Error('Answer updates not supported via Google My Business API. Google Q&A API does not support updating existing answers. Please delete and create a new answer if needed.')
  }
)

// DELETE /api/v1/business/google/qna - Delete an answer (Limited support)
export const DELETE = withMethods(['DELETE'])(
  async (req: NextRequest) => {
    throw new Error('Answer deletion not supported via Google My Business API. Google Q&A API does not reliably support deleting answers. Contact Google My Business support for answer removal.')
  }
)
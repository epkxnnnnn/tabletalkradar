import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GOOGLE_ACCESS_TOKEN = process.env.GOOGLE_BUSINESS_ACCESS_TOKEN

// GET endpoint to fetch Q&A for a location
export async function GET(request: NextRequest) {
  try {
    if (!GOOGLE_ACCESS_TOKEN) {
      return NextResponse.json({ 
        error: 'Google Business Profile API requires OAuth 2.0 setup',
        setup_required: true 
      }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')

    if (!locationId) {
      return NextResponse.json({ error: 'Location ID required' }, { status: 400 })
    }

    // Get location details
    const { data: location, error: locationError } = await supabase
      .from('client_locations')
      .select('google_place_id, business_name')
      .eq('id', locationId)
      .single()

    if (locationError || !location?.google_place_id) {
      return NextResponse.json({ 
        error: 'Location not found or missing Google Place ID' 
      }, { status: 404 })
    }

    // Fetch questions from Google My Business Q&A API
    const response = await fetch(
      `https://mybusinessqanda.googleapis.com/v1/locations/${location.google_place_id}/questions`,
      {
        headers: {
          'Authorization': `Bearer ${GOOGLE_ACCESS_TOKEN}`
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ 
        error: 'Failed to fetch Q&A from Google',
        details: error.error?.message || 'Unknown error'
      }, { status: response.status })
    }

    const data = await response.json()
    const questions = data.questions || []

    // For each question, fetch its answers
    const questionsWithAnswers = await Promise.all(
      questions.map(async (question: any) => {
        try {
          const answersResponse = await fetch(
            `https://mybusinessqanda.googleapis.com/v1/locations/${location.google_place_id}/questions/${question.name.split('/').pop()}/answers`,
            {
              headers: {
                'Authorization': `Bearer ${GOOGLE_ACCESS_TOKEN}`
              }
            }
          )

          if (answersResponse.ok) {
            const answersData = await answersResponse.json()
            question.answers = answersData.answers || []
          } else {
            question.answers = []
          }
        } catch (error) {
          console.error('Error fetching answers for question:', error)
          question.answers = []
        }

        return question
      })
    )

    // Store/update Q&A in database for tracking
    for (const question of questionsWithAnswers) {
      await supabase
        .from('google_business_qna')
        .upsert({
          location_id: locationId,
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

    return NextResponse.json({
      success: true,
      location_name: location.business_name,
      questions: questionsWithAnswers,
      total_questions: questionsWithAnswers.length,
      unanswered_questions: questionsWithAnswers.filter(q => !q.answers || q.answers.length === 0).length
    })

  } catch (error) {
    console.error('Error fetching Q&A:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Q&A' },
      { status: 500 }
    )
  }
}

// POST endpoint to create an answer to a question
export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_ACCESS_TOKEN) {
      return NextResponse.json({ 
        error: 'Google Business Profile API requires OAuth 2.0 setup',
        setup_required: true 
      }, { status: 400 })
    }

    const { location_id, question_id, answer_text } = await request.json()

    if (!location_id || !question_id || !answer_text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get location details
    const { data: location, error: locationError } = await supabase
      .from('client_locations')
      .select(`
        google_place_id,
        business_name,
        client_id,
        clients!inner(agency_id)
      `)
      .eq('id', location_id)
      .single()

    if (locationError || !location?.google_place_id) {
      return NextResponse.json({ 
        error: 'Location not found or missing Google Place ID' 
      }, { status: 404 })
    }

    // Post answer via Google My Business Q&A API
    const response = await fetch(
      `https://mybusinessqanda.googleapis.com/v1/locations/${location.google_place_id}/questions/${question_id}/answers`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GOOGLE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: answer_text
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ 
        error: 'Failed to post answer to Google',
        details: error.error?.message || 'Unknown error'
      }, { status: response.status })
    }

    const data = await response.json()

    // Log the answer activity
    await supabase
      .from('qna_activities')
      .insert({
        location_id: location_id,
        client_id: location.client_id,
        agency_id: location.clients.agency_id,
        google_question_id: question_id,
        activity_type: 'answer_posted',
        activity_data: {
          answer_text: answer_text,
          google_response: data
        },
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      answer: data,
      message: 'Answer posted successfully to Google My Business'
    })

  } catch (error) {
    console.error('Error posting Q&A answer:', error)
    return NextResponse.json(
      { error: 'Failed to post answer' },
      { status: 500 }
    )
  }
}

// PUT endpoint to update an existing answer
export async function PUT(request: NextRequest) {
  try {
    if (!GOOGLE_ACCESS_TOKEN) {
      return NextResponse.json({ 
        error: 'Google Business Profile API requires OAuth 2.0 setup',
        setup_required: true 
      }, { status: 400 })
    }

    const { location_id, question_id, answer_id, answer_text } = await request.json()

    if (!location_id || !question_id || !answer_id || !answer_text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get location details
    const { data: location, error: locationError } = await supabase
      .from('client_locations')
      .select('google_place_id, business_name')
      .eq('id', location_id)
      .single()

    if (locationError || !location?.google_place_id) {
      return NextResponse.json({ 
        error: 'Location not found or missing Google Place ID' 
      }, { status: 404 })
    }

    // Update answer via Google My Business Q&A API
    const response = await fetch(
      `https://mybusinessqanda.googleapis.com/v1/locations/${location.google_place_id}/questions/${question_id}/answers/${answer_id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${GOOGLE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: answer_text
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ 
        error: 'Failed to update answer on Google',
        details: error.error?.message || 'Unknown error'
      }, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      answer: data,
      message: 'Answer updated successfully on Google My Business'
    })

  } catch (error) {
    console.error('Error updating Q&A answer:', error)
    return NextResponse.json(
      { error: 'Failed to update answer' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to delete an answer
export async function DELETE(request: NextRequest) {
  try {
    if (!GOOGLE_ACCESS_TOKEN) {
      return NextResponse.json({ 
        error: 'Google Business Profile API requires OAuth 2.0 setup',
        setup_required: true 
      }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')
    const questionId = searchParams.get('question_id')
    const answerId = searchParams.get('answer_id')

    if (!locationId || !questionId || !answerId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Get location details
    const { data: location, error: locationError } = await supabase
      .from('client_locations')
      .select('google_place_id')
      .eq('id', locationId)
      .single()

    if (locationError || !location?.google_place_id) {
      return NextResponse.json({ 
        error: 'Location not found or missing Google Place ID' 
      }, { status: 404 })
    }

    // Delete answer via Google My Business Q&A API
    const response = await fetch(
      `https://mybusinessqanda.googleapis.com/v1/locations/${location.google_place_id}/questions/${questionId}/answers/${answerId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${GOOGLE_ACCESS_TOKEN}`
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ 
        error: 'Failed to delete answer from Google',
        details: error.error?.message || 'Unknown error'
      }, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      message: 'Answer deleted successfully from Google My Business'
    })

  } catch (error) {
    console.error('Error deleting Q&A answer:', error)
    return NextResponse.json(
      { error: 'Failed to delete answer' },
      { status: 500 }
    )
  }
}
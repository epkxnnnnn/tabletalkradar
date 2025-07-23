import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET endpoint to fetch Q&A for a location
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')

    if (!locationId) {
      return NextResponse.json({ error: 'Location ID required' }, { status: 400 })
    }

    // Get location and client details
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
      return NextResponse.json({ 
        error: 'Location not found or missing Google Place ID' 
      }, { status: 404 })
    }

    const client = location.clients[0]
    if (!client.google_refresh_token) {
      return NextResponse.json({ 
        error: 'Google Business Profile API requires OAuth 2.0 setup',
        setup_required: true 
      }, { status: 400 })
    }

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
      return NextResponse.json({ 
        error: 'Failed to fetch Q&A from Google',
        details: qnaError.message || 'Unknown error'
      }, { status: 400 })
    }

    const questions = qnaData?.questions || []

    // Store/update Q&A in database for tracking
    for (const question of questions) {
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
      location_name: client.business_name,
      questions: questions,
      total_questions: questions.length,
      unanswered_questions: questions.filter((q: any) => !q.answers || q.answers.length === 0).length
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
    const { location_id, question_id, answer_text } = await request.json()

    if (!location_id || !question_id || !answer_text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get location and client details
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
      .eq('id', location_id)
      .single()

    if (locationError || !location?.google_place_id) {
      return NextResponse.json({ 
        error: 'Location not found or missing Google Place ID' 
      }, { status: 404 })
    }

    const client = location.clients[0]
    if (!client.google_refresh_token) {
      return NextResponse.json({ 
        error: 'Google Business Profile API requires OAuth 2.0 setup',
        setup_required: true 
      }, { status: 400 })
    }

    // Post answer via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('gmb-schedule', {
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
      return NextResponse.json({ 
        error: 'Failed to post answer to Google',
        details: error.message || 'Unknown error'
      }, { status: 400 })
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
          google_response: data.result
        },
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      answer: data.result,
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

// PUT endpoint to update an existing answer (Limited support - Google Q&A API restrictions)
export async function PUT(request: NextRequest) {
  try {
    return NextResponse.json({ 
      error: 'Answer updates not supported via Google My Business API',
      message: 'Google Q&A API does not support updating existing answers. Please delete and create a new answer if needed.'
    }, { status: 400 })
  } catch (error) {
    console.error('Error updating Q&A answer:', error)
    return NextResponse.json(
      { error: 'Failed to update answer' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to delete an answer (Limited support - Google Q&A API restrictions)
export async function DELETE(request: NextRequest) {
  try {
    return NextResponse.json({ 
      error: 'Answer deletion not supported via Google My Business API',
      message: 'Google Q&A API does not reliably support deleting answers. Contact Google My Business support for answer removal.'
    }, { status: 400 })
  } catch (error) {
    console.error('Error deleting Q&A answer:', error)
    return NextResponse.json(
      { error: 'Failed to delete answer' },
      { status: 500 }
    )
  }
}
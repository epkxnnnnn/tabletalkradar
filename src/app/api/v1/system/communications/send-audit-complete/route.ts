import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import twilio from 'twilio'

let resendInstance: Resend | null = null
let twilioInstance: any = null

function getResend() {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required')
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

function getTwilio() {
  if (!twilioInstance) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials are required')
    }
    twilioInstance = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )
  }
  return twilioInstance
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone, businessName, score, reportUrl } = body

    if (!email || !businessName || !score) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Send email notification
    const emailTemplate = {
      from: process.env.RESEND_FROM_EMAIL!,
      to: [email],
      subject: `📊 TableTalk Radar: ${businessName} Audit Complete (Score: ${score}/100)`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700;">TableTalk Radar</h1>
            <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">AI-Powered Business Intelligence</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #2d3748; margin-top: 0;">Audit Complete for ${businessName}</h2>
            <div style="font-size: 24px; font-weight: bold; color: ${score >= 80 ? '#38a169' : score >= 60 ? '#f59e0b' : '#ef4444'}; margin: 15px 0;">
              Overall Score: ${score}/100
            </div>
          </div>
          
          <div style="margin: 30px 0;">
            <h3 style="color: #2d3748;">Your 5-AI Analysis is Ready</h3>
            <ul style="color: #4a5568; line-height: 1.6;">
              <li>🔍 <strong>Perplexity:</strong> Market research & competitor analysis</li>
              <li>🛠️ <strong>Kimi:</strong> Technical SEO & website performance</li>
              <li>💡 <strong>Claude:</strong> Industry-specific expertise</li>
              <li>💬 <strong>OpenAI:</strong> Customer sentiment analysis</li>
              <li>🌐 <strong>Gemini:</strong> Google ecosystem optimization</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${reportUrl}" style="background: #8B0000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              View Full Report
            </a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center; color: #718096; font-size: 14px;">
            <p>This report was generated by TableTalk Radar's 5-AI analysis engine.</p>
            <p>© ${new Date().getFullYear()} TableTalk Radar. All rights reserved.</p>
          </div>
        </div>
      `
    }

    let emailResult
    let smsResult = null

    try {
      const { data, error } = await getResend().emails.send(emailTemplate)
      if (error) {
        throw new Error(`Email sending failed: ${error.message}`)
      }
      emailResult = { success: true, data }
    } catch (emailError) {
      console.error('Email sending error:', emailError)
      emailResult = { success: false, error: emailError }
    }

    // Send SMS only for low scores requiring immediate attention
    if (phone && score < 70) {
      try {
        const result = await getTwilio().messages.create({
          body: `📊 ${businessName} audit complete. Score: ${score}/100. Check email for full report.`,
          from: process.env.TWILIO_PHONE_NUMBER!,
          to: phone
        })
        smsResult = { success: true, data: result }
      } catch (smsError) {
        console.error('SMS sending error:', smsError)
        smsResult = { success: false, error: smsError }
      }
    }

    return NextResponse.json({ 
      email: emailResult, 
      sms: smsResult 
    })

  } catch (error) {
    console.error('Communications API error:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Lazy initialize Resend
let resendInstance: Resend | null = null
function getResend() {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required')
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

export async function POST(request: NextRequest) {
  try {
    const { email, role, agencyName, inviterName, invitationToken, message } = await request.json()

    if (!email || !role || !agencyName || !invitationToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const resend = getResend()

    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const invitationLink = `${baseUrl}/auth/signup?invitation=${invitationToken}&agency=${encodeURIComponent(agencyName)}`

    // Role display names
    const roleNames: { [key: string]: string } = {
      'owner': 'Owner',
      'admin': 'Administrator',
      'manager': 'Manager',
      'client_manager': 'Client Manager',
      'analyst': 'Analyst'
    }

    const roleName = roleNames[role] || role

    // Create HTML email template
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Team Invitation - ${agencyName}</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
            .header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
            .content { padding: 40px 30px; }
            .welcome { font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 20px; }
            .message { color: #4b5563; margin-bottom: 30px; font-size: 16px; }
            .role-info { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .role-title { font-weight: 600; color: #1f2937; margin-bottom: 8px; }
            .role-desc { color: #6b7280; font-size: 14px; }
            .cta { text-align: center; margin: 30px 0; }
            .btn { display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s; }
            .btn:hover { background: #b91c1c; }
            .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer p { margin: 0; color: #6b7280; font-size: 14px; }
            .features { margin: 20px 0; }
            .feature { display: flex; align-items: center; margin: 12px 0; }
            .feature-icon { color: #10b981; margin-right: 12px; font-weight: bold; }
            .feature-text { color: #4b5563; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 You're Invited!</h1>
                <p>Join ${agencyName} as a ${roleName}</p>
            </div>
            
            <div class="content">
                <div class="welcome">
                    Welcome to the team!
                </div>
                
                <div class="message">
                    ${inviterName ? `<strong>${inviterName}</strong> has invited you to join` : 'You\'ve been invited to join'} 
                    <strong>${agencyName}</strong> as a <strong>${roleName}</strong>.
                </div>

                ${message ? `
                <div class="role-info">
                    <div class="role-title">Personal Message:</div>
                    <div class="role-desc">"${message}"</div>
                </div>
                ` : ''}
                
                <div class="role-info">
                    <div class="role-title">Your Role: ${roleName}</div>
                    <div class="role-desc">
                        ${role === 'owner' ? 'Full control over agency settings, billing, and all team members' :
                          role === 'admin' ? 'Manage team, clients, and agency operations' :
                          role === 'manager' ? 'Oversee client portfolios and team performance' :
                          role === 'client_manager' ? 'Direct client relationship management and account oversight' :
                          'Execute audits and generate reports for assigned clients'}
                    </div>
                </div>

                <div class="features">
                    <div class="feature">
                        <span class="feature-icon">✓</span>
                        <span class="feature-text">AI-powered business intelligence and insights</span>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">✓</span>
                        <span class="feature-text">Multi-client portfolio management</span>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">✓</span>
                        <span class="feature-text">Automated reporting and analytics</span>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">✓</span>
                        <span class="feature-text">Team collaboration tools</span>
                    </div>
                </div>
                
                <div class="cta">
                    <a href="${invitationLink}" class="btn">Accept Invitation</a>
                </div>
                
                <div class="message" style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                    This invitation will expire in 7 days. If you can't click the button above, 
                    copy and paste this link into your browser:<br>
                    <a href="${invitationLink}" style="color: #dc2626; word-break: break-all;">${invitationLink}</a>
                </div>
            </div>
            
            <div class="footer">
                <p>
                    Sent by TableTalk Radar Agency Management System<br>
                    If you didn't expect this invitation, you can safely ignore this email.
                </p>
            </div>
        </div>
    </body>
    </html>
    `

    // Plain text version
    const textContent = `
You're Invited to Join ${agencyName}!

${inviterName ? `${inviterName} has invited you to join` : 'You\'ve been invited to join'} ${agencyName} as a ${roleName}.

${message ? `Personal Message: "${message}"` : ''}

Your Role: ${roleName}
${role === 'owner' ? 'Full control over agency settings, billing, and all team members' :
  role === 'admin' ? 'Manage team, clients, and agency operations' :
  role === 'manager' ? 'Oversee client portfolios and team performance' :
  role === 'client_manager' ? 'Direct client relationship management and account oversight' :
  'Execute audits and generate reports for assigned clients'}

What you'll get access to:
✓ AI-powered business intelligence and insights
✓ Multi-client portfolio management  
✓ Automated reporting and analytics
✓ Team collaboration tools

Accept your invitation: ${invitationLink}

This invitation will expire in 7 days.

---
Sent by TableTalk Radar Agency Management System
If you didn't expect this invitation, you can safely ignore this email.
    `

    // Send the email
    const emailResult = await resend.emails.send({
      from: 'TableTalk Radar <noreply@tabletalkradar.com>',
      to: [email],
      subject: `You're invited to join ${agencyName} as ${roleName}`,
      html: htmlContent,
      text: textContent.trim()
    })

    if (emailResult.error) {
      console.error('Failed to send invitation email:', emailResult.error)
      return NextResponse.json(
        { error: 'Failed to send invitation email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      messageId: emailResult.data?.id 
    })

  } catch (error) {
    console.error('Error sending invitation email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
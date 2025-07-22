import { Resend } from 'resend'
import { logger } from './logger'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailTemplate {
  to: string
  subject: string
  html: string
}

export interface NotificationData {
  user_id: string
  email: string
  type: 'audit_complete' | 'weekly_report' | 'monthly_summary' | 'critical_alert'
  data?: any
}

export class NotificationService {
  static async sendAuditCompleteEmail(data: {
    email: string
    businessName: string
    score: number
    auditId: string
  }) {
    try {
      const { email, businessName, score, auditId } = data
      
      const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Audit Complete - ${businessName}</title>
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #0f172a; color: #ffffff; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 8px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #dc2626, #7c2d12); padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; font-weight: bold;">BusinessScope AI</h1>
                <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Business Intelligence Report</p>
              </div>
              
              <div style="padding: 40px 30px;">
                <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 20px;">Audit Complete</h2>
                
                <div style="background-color: #334155; border-radius: 8px; padding: 25px; margin: 20px 0; text-align: center;">
                  <h3 style="margin: 0 0 10px; color: #ffffff;">${businessName}</h3>
                  <div style="font-size: 48px; font-weight: bold; color: ${scoreColor}; margin: 10px 0;">${score}</div>
                  <p style="margin: 0; color: #94a3b8;">Overall Score</p>
                </div>
                
                <p style="color: #e2e8f0; line-height: 1.6; margin: 20px 0;">
                  Your comprehensive business audit has been completed. The report includes analysis of your online presence, 
                  reputation management, SEO performance, and competitive positioning.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                     style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    View Full Report
                  </a>
                </div>
                
                <div style="border-top: 1px solid #475569; padding-top: 20px; margin-top: 30px; color: #94a3b8; font-size: 14px;">
                  <p>Need help with your audit results? Reply to this email or visit our support center.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
      
      await resend.emails.send({
        from: 'BusinessScope AI <noreply@businessscope.ai>',
        to: email,
        subject: `Audit Complete: ${businessName} (Score: ${score})`,
        html
      })
      
      logger.info('Audit complete email sent', { email, businessName, score, auditId })
      return { success: true }
    } catch (error) {
      logger.error('Failed to send audit complete email', { error, data })
      return { success: false, error }
    }
  }

  static async sendWeeklyReport(data: {
    email: string
    fullName: string
    stats: {
      auditsThisWeek: number
      avgScore: number
      improvements: string[]
    }
  }) {
    try {
      const { email, fullName, stats } = data
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Weekly Performance Report</title>
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #0f172a; color: #ffffff; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 8px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #dc2626, #7c2d12); padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; font-weight: bold;">BusinessScope AI</h1>
                <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Weekly Performance Report</p>
              </div>
              
              <div style="padding: 40px 30px;">
                <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 20px;">Hello ${fullName},</h2>
                
                <p style="color: #e2e8f0; line-height: 1.6;">
                  Here's your weekly performance summary:
                </p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0;">
                  <div style="background-color: #334155; border-radius: 8px; padding: 20px; text-align: center;">
                    <div style="font-size: 32px; font-weight: bold; color: #3b82f6;">${stats.auditsThisWeek}</div>
                    <p style="margin: 5px 0 0; color: #94a3b8;">Audits This Week</p>
                  </div>
                  <div style="background-color: #334155; border-radius: 8px; padding: 20px; text-align: center;">
                    <div style="font-size: 32px; font-weight: bold; color: #10b981;">${stats.avgScore.toFixed(1)}</div>
                    <p style="margin: 5px 0 0; color: #94a3b8;">Average Score</p>
                  </div>
                </div>
                
                ${stats.improvements.length > 0 ? `
                  <div style="background-color: #334155; border-radius: 8px; padding: 25px; margin: 20px 0;">
                    <h3 style="margin: 0 0 15px; color: #ffffff;">Key Improvements</h3>
                    <ul style="color: #e2e8f0; margin: 0; padding-left: 20px;">
                      ${stats.improvements.map(improvement => `<li style="margin-bottom: 8px;">${improvement}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                     style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    View Dashboard
                  </a>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
      
      await resend.emails.send({
        from: 'BusinessScope AI <reports@businessscope.ai>',
        to: email,
        subject: 'Weekly Performance Report - BusinessScope AI',
        html
      })
      
      logger.info('Weekly report email sent', { email, fullName })
      return { success: true }
    } catch (error) {
      logger.error('Failed to send weekly report email', { error, data })
      return { success: false, error }
    }
  }

  static async sendCriticalAlert(data: {
    email: string
    businessName: string
    alertType: string
    description: string
    severity: 'high' | 'critical'
  }) {
    try {
      const { email, businessName, alertType, description, severity } = data
      
      const severityColor = severity === 'critical' ? '#dc2626' : '#f59e0b'
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Critical Alert - ${businessName}</title>
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #0f172a; color: #ffffff; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 8px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, ${severityColor}, #7c2d12); padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; font-weight: bold;">⚠️ Critical Alert</h1>
                <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Immediate Attention Required</p>
              </div>
              
              <div style="padding: 40px 30px;">
                <div style="background-color: #334155; border-left: 4px solid ${severityColor}; border-radius: 8px; padding: 25px; margin: 20px 0;">
                  <h3 style="margin: 0 0 10px; color: #ffffff; text-transform: uppercase; font-size: 14px; font-weight: bold;">${severity.toUpperCase()} - ${alertType}</h3>
                  <h2 style="margin: 0 0 15px; color: #ffffff;">${businessName}</h2>
                  <p style="color: #e2e8f0; line-height: 1.6; margin: 0;">${description}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                     style="background-color: ${severityColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Take Action Now
                  </a>
                </div>
                
                <div style="border-top: 1px solid #475569; padding-top: 20px; margin-top: 30px; color: #94a3b8; font-size: 14px;">
                  <p>This alert was sent because your notification settings include ${severity} alerts. You can manage your notification preferences in your dashboard settings.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
      
      await resend.emails.send({
        from: 'BusinessScope AI <alerts@businessscope.ai>',
        to: email,
        subject: `🚨 ${severity.toUpperCase()} ALERT: ${businessName} - ${alertType}`,
        html
      })
      
      logger.info('Critical alert email sent', { email, businessName, alertType, severity })
      return { success: true }
    } catch (error) {
      logger.error('Failed to send critical alert email', { error, data })
      return { success: false, error }
    }
  }
}

export default NotificationService
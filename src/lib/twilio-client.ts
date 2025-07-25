import twilio from 'twilio'

const accountSid = process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const serviceSid = process.env.NEXT_PUBLIC_TWILIO_VERIFY_SERVICE_SID

// Check if all required environment variables are present
const hasTwilioConfig = accountSid && authToken && serviceSid

if (!hasTwilioConfig) {
  console.warn('Twilio configuration missing - phone authentication will be disabled')
}

// Only create client if all credentials are available
const client = hasTwilioConfig ? twilio(accountSid!, authToken!) : null

export async function sendVerificationCode(phoneNumber: string) {
  if (!client || !serviceSid) {
    return { 
      success: false, 
      error: 'Phone authentication is not configured' 
    }
  }

  try {
    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({
        to: phoneNumber,
        channel: 'sms'
      })
    
    return { success: true, verification }
  } catch (error) {
    console.error('Error sending verification code:', error)
    return { success: false, error }
  }
}

export async function verifyCode(phoneNumber: string, code: string) {
  if (!client || !serviceSid) {
    return { 
      success: false, 
      error: 'Phone authentication is not configured' 
    }
  }

  try {
    const verificationCheck = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({
        to: phoneNumber,
        code: code
      })
    
    return { 
      success: verificationCheck.status === 'approved',
      verificationCheck 
    }
  } catch (error) {
    console.error('Error verifying code:', error)
    return { success: false, error }
  }
}

export { client as twilioClient }

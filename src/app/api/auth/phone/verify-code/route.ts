import { NextRequest, NextResponse } from 'next/server'
import { verifyCode } from '@/lib/twilio-client'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, code, email, fullName, companyName, role, industry, businessType } = await request.json()

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: 'Phone number and verification code are required' },
        { status: 400 }
      )
    }

    const result = await verifyCode(phoneNumber, code)

    if (result.success) {
      // If this is for signup, create the user
      if (email) {
        const { data: authData, error: authError } = await supabaseAdmin().auth.admin.createUser({
          email,
          password: Math.random().toString(36).slice(-8), // Temporary password
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            company_name: companyName,
            role: role,
            industry: industry,
            business_type: businessType,
            phone: phoneNumber,
            phone_verified: true
          }
        })

        if (authError) {
          return NextResponse.json(
            { error: authError.message },
            { status: 400 }
          )
        }

        // Create profile record
        const { error: profileError } = await supabaseAdmin()
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: fullName,
            email: email,
            company_name: companyName,
            role: role,
            industry: industry,
            business_type: businessType,
            phone: phoneNumber,
            phone_verified: true,
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          return NextResponse.json(
            { error: profileError.message },
            { status: 400 }
          )
        }

        return NextResponse.json({ 
          success: true, 
          user: authData.user
        })
      }

      // If this is for login, find user by phone
      const { data: user, error: userError } = await supabaseAdmin()
        .from('profiles')
        .select('id, email')
        .eq('phone', phoneNumber)
        .single()

      if (userError || !user) {
        return NextResponse.json(
          { error: 'No account found with this phone number' },
          { status: 404 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        user: { email: user.email }
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in verify-code route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

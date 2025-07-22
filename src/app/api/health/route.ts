import { NextRequest, NextResponse } from 'next/server'
import { monitoring } from '@/lib/monitoring'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Perform health checks
    const healthStatus = await monitoring.healthCheck()
    
    // Additional database health check
    let databaseStatus: { status: 'pass' | 'fail'; message?: string } = { status: 'pass' }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (error) {
        databaseStatus = { status: 'fail', message: error.message }
      }
    } catch (error) {
      databaseStatus = { status: 'fail', message: 'Database connection failed' }
    }

    // Update health status with database check
    healthStatus.checks.database = databaseStatus

    // Calculate response time
    const responseTime = Date.now() - startTime

    // Prepare response
    const response = {
      status: healthStatus.status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: healthStatus.checks,
      responseTime: `${responseTime}ms`
    }

    // Log health check
    logger.info('Health check performed', {
      status: healthStatus.status,
      responseTime,
      checks: Object.keys(healthStatus.checks)
    })

    // Return appropriate status code
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503

    return NextResponse.json(response, { status: statusCode })

  } catch (error) {
    logger.error('Health check failed', { error })
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 503 })
  }
}
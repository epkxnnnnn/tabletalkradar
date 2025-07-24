import { logger } from './logger'
import { PerformanceTracker } from './performance'
import * as Sentry from '@sentry/nextjs'

interface Metric {
  name: string
  value: number
  tags: Record<string, string>
  timestamp: number
}

interface Alert {
  id: string
  name: string
  condition: string
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  lastTriggered?: number
}

class MonitoringSystem {
  private metrics: Metric[] = []
  private alerts: Alert[] = []
  private isProduction = process.env.NODE_ENV === 'production'

  constructor() {
    this.initializeAlerts()
    this.startMetricsCollection()
    this.initializeSentry()
  }

  private initializeSentry() {
    // Sentry integration removed
    return
  }

  private initializeAlerts() {
    this.alerts = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: 'error_rate > 5',
        threshold: 5,
        severity: 'high',
        enabled: true
      },
      {
        id: 'slow_response_time',
        name: 'Slow Response Time',
        condition: 'avg_response_time > 2000',
        threshold: 2000,
        severity: 'medium',
        enabled: true
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        condition: 'memory_usage > 80',
        threshold: 80,
        severity: 'critical',
        enabled: true
      },
      {
        id: 'database_connection_failure',
        name: 'Database Connection Failure',
        condition: 'db_connection_errors > 0',
        threshold: 0,
        severity: 'critical',
        enabled: true
      }
    ]
  }

  private startMetricsCollection() {
    if (!this.isProduction) return

    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics()
    }, 30000)

    // Check alerts every minute
    setInterval(() => {
      this.checkAlerts()
    }, 60000)
  }

  private collectSystemMetrics() {
    const memoryUsage = this.getMemoryUsage()
    const cpuUsage = this.getCpuUsage()
    const activeConnections = this.getActiveConnections()

    this.recordMetric('system.memory.usage', memoryUsage.percentage, {
      environment: process.env.NODE_ENV || 'development'
    })

    this.recordMetric('system.cpu.usage', cpuUsage, {
      environment: process.env.NODE_ENV || 'development'
    })

    this.recordMetric('system.connections.active', activeConnections, {
      environment: process.env.NODE_ENV || 'development'
    })
  }

  private getMemoryUsage(): { used: number; total: number; percentage: number } {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage()
      const used = Math.round(usage.heapUsed / 1024 / 1024)
      const total = Math.round(usage.heapTotal / 1024 / 1024)
      const percentage = Math.round((used / total) * 100)

      return { used, total, percentage }
    }

    return { used: 0, total: 0, percentage: 0 }
  }

  private getCpuUsage(): number {
    // In a real implementation, you'd use a library like `os-utils`
    // For now, we'll return a placeholder
    return Math.random() * 100
  }

  private getActiveConnections(): number {
    // In a real implementation, you'd track active connections
    // For now, we'll return a placeholder
    return Math.floor(Math.random() * 100)
  }

  recordMetric(name: string, value: number, tags: Record<string, string> = {}) {
    const metric: Metric = {
      name,
      value,
      tags: {
        ...tags,
        service: 'tabletalk-radar',
        timestamp: Date.now().toString()
      },
      timestamp: Date.now()
    }

    this.metrics.push(metric)

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Send to external monitoring service in production
    if (this.isProduction) {
      this.sendToMonitoringService(metric)
    }

    logger.debug(`Metric recorded: ${name} = ${value}`, { tags })
  }

  private async sendToMonitoringService(metric: Metric) {
    // Monitoring to external service is disabled (no MONITORING_ENDPOINT configured)
    return
  }

  private checkAlerts() {
    for (const alert of this.alerts) {
      if (!alert.enabled) continue

      const shouldTrigger = this.evaluateAlertCondition(alert)
      
      if (shouldTrigger && !this.isAlertRecentlyTriggered(alert)) {
        this.triggerAlert(alert)
      }
    }
  }

  private evaluateAlertCondition(alert: Alert): boolean {
    const recentMetrics = this.metrics.filter(
      m => m.timestamp > Date.now() - 300000 // Last 5 minutes
    )

    switch (alert.id) {
      case 'high_error_rate':
        const errorMetrics = recentMetrics.filter(m => m.name === 'error.count')
        const totalRequests = recentMetrics.filter(m => m.name === 'request.count')
        const errorRate = errorMetrics.length > 0 && totalRequests.length > 0
          ? (errorMetrics.reduce((sum, m) => sum + m.value, 0) / 
             totalRequests.reduce((sum, m) => sum + m.value, 0)) * 100
          : 0
        return errorRate > alert.threshold

      case 'slow_response_time':
        const responseTimeMetrics = recentMetrics.filter(m => m.name === 'response.time')
        const avgResponseTime = responseTimeMetrics.length > 0
          ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
          : 0
        return avgResponseTime > alert.threshold

      case 'high_memory_usage':
        const memoryMetrics = recentMetrics.filter(m => m.name === 'system.memory.usage')
        const latestMemoryUsage = memoryMetrics.length > 0
          ? memoryMetrics[memoryMetrics.length - 1].value
          : 0
        return latestMemoryUsage > alert.threshold

      case 'database_connection_failure':
        const dbErrorMetrics = recentMetrics.filter(m => m.name === 'database.connection.error')
        return dbErrorMetrics.length > 0

      default:
        return false
    }
  }

  private isAlertRecentlyTriggered(alert: Alert): boolean {
    if (!alert.lastTriggered) return false
    return Date.now() - alert.lastTriggered < 300000 // 5 minutes
  }

  private async triggerAlert(alert: Alert) {
    alert.lastTriggered = Date.now()

    logger.warn(`Alert triggered: ${alert.name}`, {
      alertId: alert.id,
      severity: alert.severity,
      threshold: alert.threshold
    })

    // Send alert to external service
    if (this.isProduction) {
      await this.sendAlertToExternalService(alert)
    }
  }

  private async sendAlertToExternalService(alert: Alert) {
    // Alerting to external service is disabled (no ALERTING_ENDPOINT configured)
    return
  }

  // Performance monitoring helpers
  startPerformanceTimer(operation: string): () => void {
    const startTime = performance.now()
    return () => {
      const duration = performance.now() - startTime
      this.recordMetric('performance.operation.duration', duration, {
        operation,
        unit: 'milliseconds'
      })
    }
  }

  recordError(error: Error, context: Record<string, any> = {}) {
    this.recordMetric('error.count', 1, {
      error_type: error.name,
      error_message: error.message,
      ...context
    })
    logger.error('Application error', { error, context })
    // Sentry reporting removed
  }

  recordRequest(method: string, path: string, statusCode: number, duration: number) {
    this.recordMetric('request.count', 1, {
      method,
      path,
      status_code: statusCode.toString()
    })

    this.recordMetric('response.time', duration, {
      method,
      path,
      status_code: statusCode.toString()
    })

    if (statusCode >= 400) {
      this.recordMetric('error.count', 1, {
        method,
        path,
        status_code: statusCode.toString()
      })
    }
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    checks: Record<string, { status: 'pass' | 'fail'; message?: string }>
  }> {
    const checks: Record<string, { status: 'pass' | 'fail'; message?: string }> = {}

    // Database connectivity check
    try {
      // Add your database health check here
      checks.database = { status: 'pass' }
    } catch (error) {
      checks.database = { status: 'fail', message: 'Database connection failed' }
    }

    // Memory usage check
    const memoryUsage = this.getMemoryUsage()
    checks.memory = memoryUsage.percentage > 90
      ? { status: 'fail', message: `High memory usage: ${memoryUsage.percentage}%` }
      : { status: 'pass' }

    // Determine overall status
    const failedChecks = Object.values(checks).filter(check => check.status === 'fail')
    
    let status: 'healthy' | 'degraded' | 'unhealthy'
    if (failedChecks.length === 0) {
      status = 'healthy'
    } else if (failedChecks.length === 1) {
      status = 'degraded'
    } else {
      status = 'unhealthy'
    }

    return { status, checks }
  }
}

export const monitoring = new MonitoringSystem() 
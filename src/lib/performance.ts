import { logger } from './logger'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class Cache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly defaultTtl: number

  constructor(defaultTtl: number = 3600) {
    this.defaultTtl = defaultTtl
    this.startCleanupInterval()
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl
    }
    this.cache.set(key, entry)
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    const age = now - entry.timestamp

    if (age > entry.ttl * 1000) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now()
      let cleanedCount = 0

      for (const [key, entry] of Array.from(this.cache.entries())) {
        const age = now - entry.timestamp
        if (age > entry.ttl * 1000) {
          this.cache.delete(key)
          cleanedCount++
        }
      }

      if (cleanedCount > 0) {
        logger.debug(`Cache cleanup: removed ${cleanedCount} expired entries`)
      }
    }, 60000) // Run every minute
  }
}

export const cache = new Cache()

// Performance monitoring
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()

  startTimer(label: string): () => void {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      this.recordMetric(label, duration)
    }
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    this.metrics.get(label)!.push(value)
  }

  getMetrics(label: string): { avg: number; min: number; max: number; count: number } {
    const values = this.metrics.get(label) || []
    if (values.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 }
    }

    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)

    return { avg, min, max, count: values.length }
  }

  clearMetrics(label?: string): void {
    if (label) {
      this.metrics.delete(label)
    } else {
      this.metrics.clear()
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Database query optimization
export class QueryOptimizer {
  private queryCache = new Map<string, { result: any; timestamp: number }>()

  async executeWithCache<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = 300 // 5 minutes default
  ): Promise<T> {
    const cached = this.queryCache.get(key)
    if (cached && Date.now() - cached.timestamp < ttl * 1000) {
      logger.debug(`Cache hit for query: ${key}`)
      return cached.result
    }

    const stopTimer = performanceMonitor.startTimer(`query_${key}`)
    const result = await queryFn()
    stopTimer()

    this.queryCache.set(key, {
      result,
      timestamp: Date.now()
    })

    logger.debug(`Cache miss for query: ${key}`)
    return result
  }

  invalidateCache(pattern?: string): void {
    if (pattern) {
      for (const key of Array.from(this.queryCache.keys())) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key)
        }
      }
    } else {
      this.queryCache.clear()
    }
  }
}

export const queryOptimizer = new QueryOptimizer()

// Memory usage monitoring
export function getMemoryUsage(): { used: number; total: number; percentage: number } {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage()
    const used = Math.round(usage.heapUsed / 1024 / 1024)
    const total = Math.round(usage.heapTotal / 1024 / 1024)
    const percentage = Math.round((used / total) * 100)

    return { used, total, percentage }
  }

  return { used: 0, total: 0, percentage: 0 }
}

// Debounce utility for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle utility for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
} 
// TableTalk Radar - Performance Optimization Utilities
import React, { lazy, memo, ComponentType, Suspense } from 'react'

// React Performance Optimization Helpers

// Generic memo wrapper with display name preservation
export function withMemo<T extends ComponentType<any>>(
  Component: T,
  propsAreEqual?: (prevProps: any, nextProps: any) => boolean
): ComponentType<any> {
  const MemoizedComponent = memo(Component, propsAreEqual)
  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name})`
  return MemoizedComponent
}

// Lazy loading wrapper with error boundary
export function withLazy<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
): ComponentType<any> {
  const LazyComponent = lazy(importFunc)
  
  if (fallback) {
    const FallbackComponent = fallback
    const WithFallback = (props: any) => 
      React.createElement(
        Suspense,
        { fallback: React.createElement(FallbackComponent) },
        React.createElement(LazyComponent, props)
      )
    WithFallback.displayName = `withFallback(${(LazyComponent as any).displayName || 'Component'})`
    return WithFallback
  }
  
  return LazyComponent as ComponentType<any>
}

// Debounce utility for expensive operations  
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// Throttle utility for frequent events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Virtual scrolling helper for large lists
export function getVisibleItems<T>(
  items: T[],
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  buffer = 5
) {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
  )
  
  return {
    startIndex,
    endIndex,
    visibleItems: items.slice(startIndex, endIndex + 1),
    totalHeight: items.length * itemHeight,
    offsetY: startIndex * itemHeight
  }
}

// Performance measurement utilities
export class PerformanceTracker {
  private static marks: Map<string, number> = new Map()
  
  static mark(name: string) {
    this.marks.set(name, performance.now())
  }
  
  static measure(name: string, startMark?: string): number {
    const endTime = performance.now()
    const startTime = startMark ? this.marks.get(startMark) || 0 : 0
    const duration = endTime - startTime
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
    }
    
    return duration
  }
  
  static clearMarks() {
    this.marks.clear()
  }
}
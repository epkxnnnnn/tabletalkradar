'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AutoSaveOptions {
  table: string
  id?: string
  data: any
  delay?: number
  onSave?: (result: any) => void
  onError?: (error: any) => void
}

export function useAutoSave({
  table,
  id,
  data,
  delay = 1000, // 1 second delay by default
  onSave,
  onError
}: AutoSaveOptions) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastDataRef = useRef<string>('')

  useEffect(() => {
    const currentDataString = JSON.stringify(data)
    
    // Don't save if data hasn't changed
    if (currentDataString === lastDataRef.current) {
      return
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(async () => {
      if (!data || Object.keys(data).length === 0) return

      setIsSaving(true)
      setError(null)

      try {
        let result
        if (id) {
          // Update existing record
          result = await supabase
            .from(table)
            .update(data)
            .eq('id', id)
            .select()
            .single()
        } else {
          // Insert new record
          result = await supabase
            .from(table)
            .insert([data])
            .select()
            .single()
        }

        if (result.error) {
          throw result.error
        }

        setLastSaved(new Date())
        lastDataRef.current = currentDataString
        onSave?.(result.data)

      } catch (err: any) {
        console.error('Auto-save error:', err)
        setError(err.message || 'Failed to save')
        onError?.(err)
      } finally {
        setIsSaving(false)
      }
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, id, table, delay, onSave, onError])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    isSaving,
    lastSaved,
    error,
    clearError: () => setError(null)
  }
}
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../providers/AuthProvider'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  start_date: string
  end_date: string
  event_type: 'post' | 'promotion' | 'reminder' | 'other'
  business_name?: string
  platform?: string
  status: 'scheduled' | 'published' | 'cancelled'
}

export default function CalendarManager() {
  const { user } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    event_type: 'post' as const,
    business_name: '',
    platform: 'facebook'
  })

  useEffect(() => {
    loadEvents()
  }, [currentDate])

  const loadEvents = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user?.id)
        .gte('start_date', startOfMonth.toISOString())
        .lte('start_date', endOfMonth.toISOString())
        .order('start_date')

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert([{
          ...newEvent,
          user_id: user?.id,
          status: 'scheduled'
        }])
        .select()

      if (error) throw error
      
      await loadEvents()
      setNewEvent({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        event_type: 'post',
        business_name: '',
        platform: 'facebook'
      })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding event:', error)
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'post': return 'bg-blue-600'
      case 'promotion': return 'bg-green-600'
      case 'reminder': return 'bg-yellow-600'
      default: return 'bg-gray-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-600'
      case 'published': return 'bg-green-600'
      case 'cancelled': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    
    return days
  }

  const getEventsForDay = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0]
    return events.filter(event => event.start_date.startsWith(dateStr))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading calendar...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Calendar</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Add Event
        </button>
      </div>

      {showAddForm && (
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Add New Event</h2>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Type
                </label>
                <select
                  value={newEvent.event_type}
                  onChange={(e) => setNewEvent({...newEvent, event_type: e.target.value as any})}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                >
                  <option value="post">Social Media Post</option>
                  <option value="promotion">Promotion</option>
                  <option value="reminder">Reminder</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none h-24 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={newEvent.start_date}
                  onChange={(e) => setNewEvent({...newEvent, start_date: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={newEvent.end_date}
                  onChange={(e) => setNewEvent({...newEvent, end_date: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add Event
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Calendar Header */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="text-white hover:text-red-400 transition-colors"
          >
            ← Previous
          </button>
          <h2 className="text-xl font-semibold text-white">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="text-white hover:text-red-400 transition-colors"
          >
            Next →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-gray-400 font-medium text-sm">
              {day}
            </div>
          ))}
          
          {getDaysInMonth().map((day, index) => (
            <div key={index} className="min-h-24 p-1 bg-slate-700 rounded">
              {day && (
                <>
                  <div className="text-white text-sm font-medium mb-1">{day}</div>
                  <div className="space-y-1">
                    {getEventsForDay(day).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded text-white truncate ${getEventTypeColor(event.event_type)}`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-slate-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Upcoming Events</h2>
        <div className="space-y-3">
          {events.slice(0, 5).map(event => (
            <div key={event.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <div className="flex-1">
                <h3 className="text-white font-medium">{event.title}</h3>
                <p className="text-gray-300 text-sm">{event.description}</p>
                <p className="text-gray-400 text-xs">{formatDate(event.start_date)}</p>
              </div>
              <div className="flex space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getEventTypeColor(event.event_type)}`}>
                  {event.event_type}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(event.status)}`}>
                  {event.status}
                </span>
              </div>
            </div>
          ))}
          
          {events.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📅</div>
              <p className="text-gray-400">No events scheduled</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
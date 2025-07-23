'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthProvider'

interface Question {
  id: string
  business_name: string
  question_text: string
  platform: string
  status: 'pending' | 'answered' | 'ignored'
  created_at: string
  answer_text?: string
}

export default function QAManager() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('all')
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [answerText, setAnswerText] = useState('')

  useEffect(() => {
    loadQuestions()
  }, [filter])

  const loadQuestions = async () => {
    try {
      let query = supabase
        .from('questions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query
      if (error) throw error
      setQuestions(data || [])
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          status: 'answered',
          answer_text: answerText
        })
        .eq('id', questionId)

      if (error) throw error
      
      await loadQuestions()
      setSelectedQuestion(null)
      setAnswerText('')
    } catch (error) {
      console.error('Error answering question:', error)
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'google': return 'bg-blue-600'
      case 'yelp': return 'bg-red-600'
      case 'facebook': return 'bg-blue-700'
      default: return 'bg-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading questions...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Questions & Answers</h1>
        <div className="flex space-x-2">
          {['all', 'pending', 'answered'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                filter === status
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {questions.map((question) => (
          <div key={question.id} className="bg-slate-800 p-6 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{question.business_name}</h3>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(question.platform)} text-white mt-1`}>
                  {question.platform}
                </span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                question.status === 'pending' ? 'bg-yellow-600' :
                question.status === 'answered' ? 'bg-green-600' : 'bg-gray-600'
              } text-white`}>
                {question.status}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-start space-x-2 mb-2">
                <span className="text-red-400 text-lg">❓</span>
                <p className="text-gray-300 text-sm leading-relaxed">{question.question_text}</p>
              </div>
            </div>

            {question.answer_text && (
              <div className="bg-slate-700 p-4 rounded-lg mb-4">
                <div className="flex items-start space-x-2">
                  <span className="text-green-400 text-lg">💬</span>
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Your Answer:</h4>
                    <p className="text-gray-300 text-sm">{question.answer_text}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">
                {new Date(question.created_at).toLocaleDateString()}
              </span>
              {question.status === 'pending' && (
                <button
                  onClick={() => setSelectedQuestion(question)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Answer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❓</div>
          <h3 className="text-xl font-medium text-white mb-2">No questions yet</h3>
          <p className="text-gray-400">Customer questions will appear here when they ask about your business</p>
        </div>
      )}

      {/* Answer Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg max-w-2xl w-full mx-4">
            <h2 className="text-xl font-semibold text-white mb-4">Answer Question</h2>
            
            <div className="mb-4 p-4 bg-slate-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-white">{selectedQuestion.business_name}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(selectedQuestion.platform)} text-white`}>
                  {selectedQuestion.platform}
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-red-400 text-lg">❓</span>
                <p className="text-gray-300 text-sm">{selectedQuestion.question_text}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Answer
              </label>
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none h-32 resize-none"
                placeholder="Provide a helpful and informative answer..."
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleAnswer(selectedQuestion.id)}
                disabled={!answerText.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Submit Answer
              </button>
              <button
                onClick={() => {
                  setSelectedQuestion(null)
                  setAnswerText('')
                }}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
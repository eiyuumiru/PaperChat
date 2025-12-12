import { useState, useCallback, useRef } from 'react'
import { normalizeContent } from '../utils/content'
import { MAX_CHAT_HISTORY } from '../utils/constants'

export function useChat() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesRef = useRef([])

  // Keep ref in sync with state for stable references
  messagesRef.current = messages

  const sendMessage = useCallback(async (content, model) => {
    if (!content.trim() || isLoading) return

    const userMessage = { role: 'user', content: content.trim() }
    
    // Get current messages before updating state
    const currentMessages = messagesRef.current
    const messagesWithUser = [...currentMessages, userMessage]
    
    // Optimistically add user message to UI
    setMessages(messagesWithUser)
    setIsLoading(true)
    setError(null)

    try {
      // Build messages history for context (last N messages)
      // Format: array of { role: 'user'|'assistant', content: string }
      const history = messagesWithUser.slice(-MAX_CHAT_HISTORY)
      
      // Call Puter AI with messages array for memory/context
      // Puter API supports both formats:
      // 1. puter.ai.chat(prompt, options) - single prompt
      // 2. puter.ai.chat(messages, options) - messages array
      // We use the messages array format to ensure proper memory/context
      const messagesForAPI = history.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await window.puter.ai.chat(messagesForAPI, {
        model: model
      })

      // Parse response safely
      const responseText = normalizeContent(response)

      // Add AI assistant message using functional update to ensure consistency
      const assistantMessage = { role: 'assistant', content: responseText }
      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      console.error('Chat error:', err)
      setError(err.message || 'Không thể kết nối với AI')
      // Remove the user message on error to keep state consistent
      setMessages(currentMessages)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    setError
  }
}
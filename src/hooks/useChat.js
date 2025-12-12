import { useState, useCallback, useRef } from 'react'
import { normalizeContent } from '../utils/content'
import { MAX_CHAT_HISTORY, MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES } from '../utils/constants'

/**
 * Validate image file
 */
function validateImageFile(file) {
  if (!file) return { valid: false, error: 'Không có file được chọn' }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Định dạng ảnh không được hỗ trợ. Chỉ hỗ trợ JPEG, PNG, GIF, WebP.' }
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: 'Ảnh quá lớn. Kích thước tối đa là 5MB.' }
  }
  return { valid: true }
}

/**
 * Convert file to data URL for display
 */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useChat() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesRef = useRef([])

  // Keep ref in sync with state for stable references
  messagesRef.current = messages

  /**
   * Send a text-only message
   */
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
      const history = messagesWithUser.slice(-MAX_CHAT_HISTORY)

      // Build API messages (without image data for history - text only)
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

  /**
   * Send a message with an image attachment
   */
  const sendMessageWithImage = useCallback(async (content, imageFile, model) => {
    if (isLoading) return

    // Validate image
    const validation = validateImageFile(imageFile)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    // Convert image to data URL for display in chat
    let imageDataUrl
    try {
      imageDataUrl = await fileToDataURL(imageFile)
    } catch {
      setError('Không thể đọc file ảnh')
      return
    }

    const userMessage = {
      role: 'user',
      content: content.trim() || 'Hãy mô tả ảnh này',
      image: imageDataUrl
    }

    // Get current messages before updating state
    const currentMessages = messagesRef.current
    const messagesWithUser = [...currentMessages, userMessage]

    // Optimistically add user message to UI
    setMessages(messagesWithUser)
    setIsLoading(true)
    setError(null)

    let uploadedPath = null

    try {
      // Upload image to Puter storage
      const fileName = `chat_image_${Date.now()}.${imageFile.name.split('.').pop()}`
      const puterFile = await window.puter.fs.write(fileName, imageFile)
      uploadedPath = puterFile.path

      // Build multimodal message for API
      const multimodalMessage = {
        role: 'user',
        content: [
          { type: 'file', puter_path: uploadedPath },
          { type: 'text', text: content.trim() || 'Hãy mô tả ảnh này' }
        ]
      }

      const response = await window.puter.ai.chat([multimodalMessage], {
        model: model
      })

      // Parse response safely
      const responseText = normalizeContent(response)

      // Add AI assistant message
      const assistantMessage = { role: 'assistant', content: responseText }
      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      console.error('Chat with image error:', err)
      setError(err.message || 'Không thể gửi tin nhắn với ảnh')
      // Remove the user message on error
      setMessages(currentMessages)
    } finally {
      // Clean up uploaded file
      if (uploadedPath) {
        try {
          await window.puter.fs.delete(uploadedPath)
        } catch (cleanupErr) {
          console.warn('Failed to cleanup temp file:', cleanupErr)
        }
      }
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
    sendMessageWithImage,
    clearMessages,
    setError
  }
}
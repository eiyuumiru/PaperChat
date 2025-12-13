import { useState, useCallback, useRef } from 'react'
import { normalizeContent } from '../utils/content'
import { MAX_CHAT_HISTORY, MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES, WEB_SEARCH_MODEL } from '../utils/constants'

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

/**
 * Perform web search using GPT-4o Search model
 */
async function performWebSearch(query) {
  const searchPrompt = `Tìm kiếm thông tin mới nhất về: "${query}". Trả về kết quả ngắn gọn, chính xác với nguồn nếu có.`

  const response = await window.puter.ai.chat(searchPrompt, {
    model: WEB_SEARCH_MODEL
  })

  return normalizeContent(response)
}

export function useChat() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const messagesRef = useRef([])


  messagesRef.current = messages

  /**
   * Send a text-only message (with optional web search)
   */
  const sendMessage = useCallback(async (content, model, enableWebSearch = false) => {
    if (!content.trim() || isLoading) return

    const userMessage = { role: 'user', content: content.trim() }

    const currentMessages = messagesRef.current
    const messagesWithUser = [...currentMessages, userMessage]

    setMessages(messagesWithUser)
    setIsLoading(true)
    setError(null)

    try {
      let systemContext = null

      // Web Search Chain: search first, then use results as context
      if (enableWebSearch && model !== WEB_SEARCH_MODEL) {
        setIsSearching(true)
        try {
          const searchResults = await performWebSearch(content.trim())
          systemContext = `[Kết quả tìm kiếm web]\n${searchResults}\n\n[Hướng dẫn]\nDựa trên thông tin tìm kiếm ở trên, hãy trả lời câu hỏi của người dùng một cách chính xác và đầy đủ.`
        } catch {
          // If search fails, continue without search results
        } finally {
          setIsSearching(false)
        }
      }

      const history = messagesWithUser.slice(-MAX_CHAT_HISTORY)

      const messagesForAPI = []

      // Add system context from web search if available
      if (systemContext) {
        messagesForAPI.push({ role: 'system', content: systemContext })
      }

      // Add conversation history
      messagesForAPI.push(...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })))

      const response = await window.puter.ai.chat(messagesForAPI, {
        model: model
      })

      const responseText = normalizeContent(response)

      const assistantMessage = { role: 'assistant', content: responseText }
      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      setError(err.message || 'Không thể kết nối với AI')
      setMessages(currentMessages)
    } finally {
      setIsLoading(false)
      setIsSearching(false)
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
      setError(err.message || 'Không thể gửi tin nhắn với ảnh')
      // Remove the user message on error
      setMessages(currentMessages)
    } finally {
      // Clean up uploaded file
      if (uploadedPath) {
        try {
          await window.puter.fs.delete(uploadedPath)
        } catch {
          // Silent cleanup
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
    isSearching,
    error,
    sendMessage,
    sendMessageWithImage,
    clearMessages,
    setError
  }
}
import { useState, useRef, useEffect, useCallback } from 'react'
import { useChat } from '../hooks/useChat'
import { useAutoDismiss } from '../hooks/useAutoDismiss'
import { DEFAULT_CHAT_MODEL, TEXTAREA_MIN_HEIGHT, TEXTAREA_MAX_HEIGHT, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '../utils/constants'
import ModelSelector from './ModelSelector'
import Message, { LoadingMessage } from './Message'
import WelcomeMessage from './WelcomeMessage'

function ChatPanel() {
  const [input, setInput] = useState('')
  const [model, setModel] = useState(DEFAULT_CHAT_MODEL)
  const [attachedImage, setAttachedImage] = useState(null) // { file: File, preview: string }
  const [isDragOver, setIsDragOver] = useState(false)
  const { messages, isLoading, error, sendMessage, sendMessageWithImage, setError } = useChat()

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Auto resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const nextHeight = Math.max(
        TEXTAREA_MIN_HEIGHT,
        Math.min(textarea.scrollHeight, TEXTAREA_MAX_HEIGHT)
      )
      textarea.style.height = `${nextHeight}px`
    }
  }, [input])

  // Auto dismiss error
  useAutoDismiss(error, setError)

  // Cleanup preview URL on unmount or when image changes
  useEffect(() => {
    return () => {
      if (attachedImage?.preview) {
        URL.revokeObjectURL(attachedImage.preview)
      }
    }
  }, [attachedImage])

  // Handle image file selection
  const handleImageSelect = useCallback((file) => {
    if (!file) return

    // Validate type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Định dạng ảnh không được hỗ trợ. Chỉ hỗ trợ JPEG, PNG, GIF, WebP.')
      return
    }

    // Validate size
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Ảnh quá lớn. Kích thước tối đa là 5MB.')
      return
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setAttachedImage({ file, preview: previewUrl })
  }, [setError])

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageSelect(file)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  // Handle paste event (Ctrl+V)
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) handleImageSelect(file)
        return
      }
    }
  }, [handleImageSelect])

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  // Handle drag leave
  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)

    const file = e.dataTransfer?.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleImageSelect(file)
    }
  }

  // Remove attached image
  const handleRemoveImage = () => {
    if (attachedImage?.preview) {
      URL.revokeObjectURL(attachedImage.preview)
    }
    setAttachedImage(null)
  }

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (isLoading) return

    if (attachedImage) {
      // Send with image
      sendMessageWithImage(input, attachedImage.file, model)
      setInput('')
      handleRemoveImage()
    } else if (input.trim()) {
      // Send text only
      sendMessage(input, model)
      setInput('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handlePromptClick = (prompt) => {
    setInput(prompt)
    textareaRef.current?.focus()
  }

  const canSubmit = !isLoading && (input.trim() || attachedImage)

  return (
    <div className="tab-panel active">
      <div className="chat-panel">
        <div className="chat-header">
          <ModelSelector
            type="chat"
            value={model}
            onChange={setModel}
            label="Chọn Model:"
          />
        </div>

        <div className="messages-container">
          {messages.length === 0 ? (
            <WelcomeMessage onPromptClick={handlePromptClick} />
          ) : (
            messages.map((msg, idx) => (
              <Message key={idx} role={msg.role} content={msg.content} image={msg.image} />
            ))
          )}

          {isLoading && <LoadingMessage />}

          {error && (
            <div className="error-message">{error}</div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form
          className={`input-area ${isDragOver ? 'drag-over' : ''}`}
          onSubmit={handleSubmit}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Image Preview */}
          {attachedImage && (
            <div className="image-preview-container">
              <img src={attachedImage.preview} alt="Preview" className="image-preview" />
              <button
                type="button"
                className="image-preview-remove"
                onClick={handleRemoveImage}
                title="Xóa ảnh"
              >
                ✕
              </button>
            </div>
          )}

          <div className="input-wrapper">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {/* Image upload button */}
            <button
              type="button"
              className="image-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Đính kèm ảnh (hoặc paste Ctrl+V)"
              disabled={isLoading}
            >
              📷
            </button>

            <textarea
              ref={textareaRef}
              className="message-input"
              placeholder={attachedImage ? "Nhập câu hỏi về ảnh..." : "Nhập tin nhắn của bạn..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              rows={1}
            />
          </div>
          <button
            type="submit"
            className="send-btn"
            disabled={!canSubmit}
          >
            Gửi
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatPanel


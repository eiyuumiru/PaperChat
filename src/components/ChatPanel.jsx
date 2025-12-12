import { useState, useRef, useEffect } from 'react'
import { useChat } from '../hooks/useChat'
import { useAutoDismiss } from '../hooks/useAutoDismiss'
import { DEFAULT_CHAT_MODEL, TEXTAREA_MIN_HEIGHT, TEXTAREA_MAX_HEIGHT } from '../utils/constants'
import ModelSelector from './ModelSelector'
import Message, { LoadingMessage } from './Message'
import WelcomeMessage from './WelcomeMessage'

function ChatPanel() {
  const [input, setInput] = useState('')
  const [model, setModel] = useState(DEFAULT_CHAT_MODEL)
  const { messages, isLoading, error, sendMessage, setError } = useChat()
  
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

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

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (input.trim() && !isLoading) {
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
              <Message key={idx} role={msg.role} content={msg.content} />
            ))
          )}
          
          {isLoading && <LoadingMessage />}
          
          {error && (
            <div className="error-message">{error}</div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <form className="input-area" onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <textarea
              ref={textareaRef}
              className="message-input"
              placeholder="Nhập tin nhắn của bạn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
          </div>
          <button
            type="submit"
            className="send-btn"
            disabled={isLoading || !input.trim()}
          >
            Gửi
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatPanel

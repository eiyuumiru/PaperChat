import { useState, useRef, useCallback, useEffect } from 'react'
import { useImageGeneration } from '../hooks/useImageGeneration'
import { useAutoDismiss } from '../hooks/useAutoDismiss'
import { DEFAULT_IMAGE_MODEL, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '../utils/constants'
import ModelSelector from './ModelSelector'
import { ImageLoading, ImageError, GeneratedImage, ImagePlaceholder } from './ImageComponents'

function ImagePanel() {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState(DEFAULT_IMAGE_MODEL)
  const [sourceImage, setSourceImage] = useState(null) // { file: File, preview: string }
  const [isDragOver, setIsDragOver] = useState(false)
  const { imageUrl, isLoading, error, lastPrompt, generateImage, editImage, setError } = useImageGeneration()

  const fileInputRef = useRef(null)

  // Auto dismiss error
  useAutoDismiss(error, setError)

  // Cleanup preview URL on unmount or when image changes
  useEffect(() => {
    return () => {
      if (sourceImage?.preview) {
        URL.revokeObjectURL(sourceImage.preview)
      }
    }
  }, [sourceImage])

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
    setSourceImage({ file, preview: previewUrl })
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

  // Remove source image
  const handleRemoveImage = () => {
    if (sourceImage?.preview) {
      URL.revokeObjectURL(sourceImage.preview)
    }
    setSourceImage(null)
  }

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (prompt.trim() && !isLoading) {
      if (sourceImage) {
        // Edit with source image
        editImage(prompt, sourceImage.file, model)
      } else {
        // Generate from scratch
        generateImage(prompt, model)
      }
    }
  }

  return (
    <div className="tab-panel active">
      <div className="image-panel">
        <div className="image-controls">
          <ModelSelector
            type="image"
            value={model}
            onChange={setModel}
            label="Chọn Model:"
          />

          <form className="prompt-section" onSubmit={handleSubmit}>
            <label className="prompt-label">
              {sourceImage ? 'Mô tả chỉnh sửa:' : 'Mô tả hình ảnh:'}
            </label>
            <textarea
              className="prompt-input"
              placeholder={sourceImage
                ? "Mô tả cách bạn muốn chỉnh sửa ảnh... Ví dụ: Thêm mũ phù thủy cho nhân vật, đổi nền thành bãi biển"
                : "Mô tả chi tiết hình ảnh bạn muốn tạo... Ví dụ: A cute cat wearing a wizard hat, digital art style, vibrant colors"
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onPaste={handlePaste}
            />
          </form>

          {/* Image Upload Section */}
          <div
            className={`image-upload-section ${isDragOver ? 'drag-over' : ''} ${sourceImage ? 'has-image' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <label className="upload-label">
              Ảnh gốc (tùy chọn - để chỉnh sửa):
            </label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {sourceImage ? (
              <div className="edit-image-preview-container">
                <img src={sourceImage.preview} alt="Source" className="edit-image-preview" />
                <button
                  type="button"
                  className="edit-image-remove"
                  onClick={handleRemoveImage}
                >
                  Xóa ảnh gốc
                </button>
              </div>
            ) : (
              <div
                className="upload-area"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="upload-icon">📤</span>
                <p className="upload-text">
                  Kéo thả ảnh vào đây hoặc nhấn để chọn
                </p>
                <p className="upload-text upload-text-small">
                  Hỗ trợ: JPEG, PNG, GIF, WebP (tối đa 5MB)
                </p>
              </div>
            )}
          </div>

          <div className="image-options">
            <button
              className="generate-btn"
              onClick={handleSubmit}
              disabled={isLoading || !prompt.trim()}
            >
              {sourceImage ? 'Chỉnh sửa ảnh' : 'Tạo hình ảnh'}
            </button>
          </div>
        </div>

        <div className="image-result">
          {isLoading ? (
            <ImageLoading />
          ) : error ? (
            <ImageError message={error} />
          ) : imageUrl ? (
            <GeneratedImage url={imageUrl} prompt={lastPrompt} />
          ) : (
            <ImagePlaceholder />
          )}
        </div>
      </div>
    </div>
  )
}

export default ImagePanel


import { useState } from 'react'
import { useImageGeneration } from '../hooks/useImageGeneration'
import { useAutoDismiss } from '../hooks/useAutoDismiss'
import { DEFAULT_IMAGE_MODEL } from '../utils/constants'
import ModelSelector from './ModelSelector'
import { ImageLoading, ImageError, GeneratedImage, ImagePlaceholder } from './ImageComponents'

function ImagePanel() {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState(DEFAULT_IMAGE_MODEL)
  const { imageUrl, isLoading, error, lastPrompt, generateImage, setError } = useImageGeneration()

  // Auto dismiss error
  useAutoDismiss(error, setError)

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (prompt.trim() && !isLoading) {
      generateImage(prompt, model)
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
            <label className="prompt-label">Mô tả hình ảnh:</label>
            <textarea
              className="prompt-input"
              placeholder="Mô tả chi tiết hình ảnh bạn muốn tạo... Ví dụ: A cute cat wearing a wizard hat, digital art style, vibrant colors"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </form>

          <div className="image-options">
            <button
              className="generate-btn"
              onClick={handleSubmit}
              disabled={isLoading || !prompt.trim()}
            >
              Tạo hình ảnh
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

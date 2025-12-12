import { useState, useCallback } from 'react'

export function useImageGeneration() {
  const [imageUrl, setImageUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastPrompt, setLastPrompt] = useState('')

  const generateImage = useCallback(async (prompt, model) => {
    if (!prompt.trim() || isLoading) return

    setIsLoading(true)
    setError(null)
    setLastPrompt(prompt.trim())

    try {
      // Call Puter AI for image generation
      const image = await window.puter.ai.txt2img(prompt, {
        model: model
      })

      // Get image URL
      if (image?.src) {
        setImageUrl(image.src)
      } else if (typeof image === 'string') {
        setImageUrl(image)
      } else {
        throw new Error('Invalid image response')
      }
    } catch (err) {
      console.error('Image generation error:', err)
      setError(err.message || 'Không thể tạo hình ảnh')
      setImageUrl(null)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  const resetImage = useCallback(() => {
    setImageUrl(null)
    setError(null)
    setLastPrompt('')
  }, [])

  return {
    imageUrl,
    isLoading,
    error,
    lastPrompt,
    generateImage,
    resetImage,
    setError
  }
}

import { useState, useCallback } from 'react'
import { MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES } from '../utils/constants'

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
 * Convert file to base64 string (without data: prefix)
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // Remove the data:image/xxx;base64, prefix
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useImageGeneration() {
  const [imageUrl, setImageUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastPrompt, setLastPrompt] = useState('')

  // Generate image from text prompt only
  const generateImage = useCallback(async (prompt, model) => {
    if (!prompt.trim() || isLoading) return

    setIsLoading(true)
    setError(null)
    setLastPrompt(prompt.trim())

    try {
      console.log('Generating image with model:', model, 'prompt:', prompt.trim())
      console.log('Puter available:', !!window.puter, 'puter.ai:', !!window.puter?.ai)

      // Call Puter AI for image generation
      const response = await window.puter.ai.txt2img(prompt.trim(), {
        model: model
      })

      console.log('Image generation response:', response, 'type:', typeof response)
      console.log('Response JSON:', JSON.stringify(response, null, 2))

      // Check for API error response format: {success: false, error: {...}}
      if (response && response.success === false) {
        const errorInfo = response.error || {}
        console.error('API returned error (full):', JSON.stringify(response, null, 2))
        console.error('Error object:', JSON.stringify(errorInfo, null, 2))
        const errorMessage = errorInfo.message || errorInfo.code || errorInfo.status || JSON.stringify(errorInfo)
        throw new Error(`Lỗi API: ${errorMessage}`)
      }

      // Handle various response formats
      let imageUrl = null

      // Check if response is an HTMLImageElement (Puter.js returns this)
      if (response instanceof HTMLImageElement) {
        imageUrl = response.src
        console.log('Got HTMLImageElement with src:', imageUrl?.substring(0, 100))
      }
      // Check for img element with src (object-like)
      else if (response?.tagName === 'IMG' && response?.src) {
        imageUrl = response.src
      }
      // Check for object with src property
      else if (response?.src) {
        imageUrl = response.src
      }
      // Check for object with url property
      else if (response?.url) {
        imageUrl = response.url
      }
      // Check for object with image property
      else if (response?.image) {
        imageUrl = response.image
      }
      // Check for direct string (http URL)
      else if (typeof response === 'string' && response.startsWith('http')) {
        imageUrl = response
      }
      // Check for direct string (data URL)
      else if (typeof response === 'string' && response.startsWith('data:')) {
        imageUrl = response
      }
      // Check for base64 data in data field
      else if (response?.data) {
        imageUrl = response.data
      }

      if (imageUrl) {
        setImageUrl(imageUrl)
      } else {
        console.error('Unexpected response format:', response)
        console.error('Response keys:', response ? Object.keys(response) : 'null')
        throw new Error('Model không trả về hình ảnh. Có thể model đang bận hoặc không hỗ trợ prompt này.')
      }
    } catch (err) {
      console.error('Image generation error:', err)
      console.error('Error details:', err.status, err.code, err.response)

      let errorMsg = 'Không thể tạo hình ảnh'

      // Check for specific HTTP error codes
      if (err.status === 451 || err.message?.includes('451')) {
        errorMsg = `Model "${model}" bị chặn (Lỗi 451). Vui lòng thử model khác như DALL-E 3 hoặc GPT Image.`
      } else if (err.status === 429 || err.message?.includes('429')) {
        errorMsg = 'Quá nhiều yêu cầu. Vui lòng đợi một chút rồi thử lại.'
      } else if (err.status === 503 || err.message?.includes('503')) {
        errorMsg = 'Model đang bận. Vui lòng thử lại sau.'
      } else if (err.message) {
        errorMsg = err.message
      }

      setError(errorMsg)
      setImageUrl(null)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  // Edit/generate image with a reference image
  const editImage = useCallback(async (prompt, imageFile, model) => {
    if (!prompt.trim() || isLoading) return

    // Validate image
    const validation = validateImageFile(imageFile)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setIsLoading(true)
    setError(null)
    setLastPrompt(prompt.trim())

    try {
      // Check if using Gemini model (supports native input_image)
      const isGeminiModel = model.includes('gemini')

      console.log('Editing image with model:', model, 'prompt:', prompt.trim(), 'isGemini:', isGeminiModel)

      let response

      if (isGeminiModel) {
        // Convert image to base64 for Gemini's input_image parameter
        const base64Data = await fileToBase64(imageFile)
        const mimeType = imageFile.type || 'image/png'

        console.log('Using Gemini input_image, MIME:', mimeType, 'base64 length:', base64Data.length)

        // Use Gemini's native image-to-image feature
        response = await window.puter.ai.txt2img(prompt.trim(), {
          model: model,
          input_image: base64Data,
          input_image_mime_type: mimeType
        })
      } else {
        // For non-Gemini models, use AI to analyze image and create enhanced prompt
        const fileName = `edit_image_${Date.now()}.${imageFile.name.split('.').pop() || 'png'}`
        const puterFile = await window.puter.fs.write(fileName, imageFile)

        try {
          const analysisResponse = await window.puter.ai.chat([
            {
              role: 'user',
              content: [
                { type: 'file', puter_path: puterFile.path },
                {
                  type: 'text',
                  text: `Analyze this image and create a detailed prompt for regenerating it with these modifications: "${prompt}". Output ONLY the prompt.`
                }
              ]
            }
          ], { model: 'gpt-5-nano' })

          let enhancedPrompt = prompt
          if (analysisResponse?.message?.content) {
            enhancedPrompt = analysisResponse.message.content
          } else if (typeof analysisResponse === 'string') {
            enhancedPrompt = analysisResponse
          }

          console.log('Enhanced prompt for non-Gemini:', enhancedPrompt)
          response = await window.puter.ai.txt2img(enhancedPrompt, { model })
        } finally {
          try { await window.puter.fs.delete(puterFile.path) } catch { }
        }
      }

      console.log('Edit image response:', response, 'type:', typeof response)

      // Handle various response formats (same as generateImage)
      let imageUrl = null

      // Check if response is an HTMLImageElement (Puter.js returns this)
      if (response instanceof HTMLImageElement) {
        imageUrl = response.src
        console.log('Got HTMLImageElement with src:', imageUrl?.substring(0, 100))
      }
      // Check for img element with src (object-like)
      else if (response?.tagName === 'IMG' && response?.src) {
        imageUrl = response.src
      }
      // Check for object with src property
      else if (response?.src) {
        imageUrl = response.src
      }
      // Check for object with url property
      else if (response?.url) {
        imageUrl = response.url
      }
      // Check for object with image property
      else if (response?.image) {
        imageUrl = response.image
      }
      // Check for direct string (http URL)
      else if (typeof response === 'string' && response.startsWith('http')) {
        imageUrl = response
      }
      // Check for direct string (data URL)
      else if (typeof response === 'string' && response.startsWith('data:')) {
        imageUrl = response
      }
      // Check for base64 data in data field
      else if (response?.data) {
        imageUrl = response.data
      }

      if (imageUrl) {
        setImageUrl(imageUrl)
      } else {
        console.error('Unexpected response format:', response)
        console.error('Response keys:', response ? Object.keys(response) : 'null')
        throw new Error('Model không trả về hình ảnh. Vui lòng thử lại hoặc dùng model khác.')
      }
    } catch (err) {
      console.error('Image editing error:', err)
      setError(err.message || 'Không thể chỉnh sửa hình ảnh')
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
    editImage,
    resetImage,
    setError
  }
}


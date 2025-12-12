/**
 * AI Models Configuration
 * Source: https://docs.puter.com/AI/listModels/
 * Top-tier models from each provider
 */

const CHAT_MODELS = [
  {
    group: 'OpenAI',
    models: [
      { value: 'gpt-5.2', label: 'GPT-5.2' },
      { value: 'gpt-5.1-codex-max', label: 'GPT-5.1 Codex Max' },
      { value: 'o3', label: 'o3 (Reasoning)' }
    ]
  },
  {
    group: 'Claude',
    models: [
      { value: 'claude-opus-4-5', label: 'Claude Opus 4.5' },
      { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' }
    ]
  },
  {
    group: 'Gemini',
    models: [
      { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro' },
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' }
    ]
  }
]

// Image models - ordered by stability
const IMAGE_MODELS = [
  {
    group: 'Gemini',
    models: [
      { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image' },
      { value: 'gemini-2.5-flash-image-preview', label: 'Gemini 2.5 Flash Image' }
    ]
  },
  {
    group: 'OpenAI',
    models: [
      { value: 'gpt-image-1', label: 'GPT Image 1' },
      { value: 'dall-e-3', label: 'DALL-E 3' }
    ]
  },
  {
    group: 'Khác',
    models: [
      { value: 'black-forest-labs/FLUX.1.1-pro', label: 'FLUX 1.1 Pro' },
      { value: 'stabilityai/stable-diffusion-3.5-large', label: 'SD 3.5 Large' },
      { value: 'google/imagen-3', label: 'Imagen 3' }
    ]
  }
]

function ModelSelector({ type, value, onChange, label }) {
  const modelGroups = type === 'chat' ? CHAT_MODELS : IMAGE_MODELS

  return (
    <div className="model-selector">
      {label && <label className="form-label">{label}</label>}
      <select
        className="model-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        title="Chọn model AI"
      >
        {modelGroups.map(group => (
          <optgroup key={group.group} label={group.group}>
            {group.models.map(model => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}

export default ModelSelector
export { CHAT_MODELS, IMAGE_MODELS }

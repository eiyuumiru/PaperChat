/**
 * ModelSelector Component
 * AI Models Configuration
 */

import type { ModelSelectorProps, ModelGroup } from '../types';
import { useLanguage } from '../utils/i18n';

/**
 * Chat models configuration
 * Source: Puter live model list (drivers/call → puter-chat-completion "models"),
 * verified 2026-07-21. Values are aliases confirmed accepted by the ai-chat router.
 */
const CHAT_MODELS: ModelGroup[] = [
    {
        group: 'OpenAI',
        models: [
            { value: 'gpt-5.5', label: 'GPT-5.5 Thinking' },
            { value: 'gpt-5.4', label: 'GPT-5.4 Thinking' },
            { value: 'gpt-5.3-chat', label: 'GPT-5.3 Instant' },
            {
                value: 'openrouter:openai/gpt-4o-search-preview',
                label: 'GPT-4o Search',
            },
        ],
    },
    {
        group: 'Claude',
        models: [
            { value: 'claude-sonnet-5', label: 'Claude Sonnet 5' },
            { value: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
            { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
        ],
    },
    {
        group: 'Gemini',
        models: [
            { value: 'google/gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
            { value: 'google/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro' },
        ],
    },
    {
        group: 'Grok (xAI)',
        models: [
            { value: 'x-ai/grok-4.5', label: 'Grok 4.5' },
            { value: 'x-ai/grok-4-1-fast', label: 'Grok 4.1 Fast' },
            { value: 'x-ai/grok-4-fast', label: 'Grok 4 Fast' },
        ],
    },
    {
        group: 'DeepSeek',
        models: [
            { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
            { value: 'deepseek-chat', label: 'DeepSeek V4 Flash' },
        ],
    },
];

function ModelSelector({ value, onChange, label }: ModelSelectorProps): React.ReactElement {
    const { language } = useLanguage();

    const modelGroups = CHAT_MODELS;

    return (
        <div className="model-selector">
            {label && <label className="form-label">{label}</label>}
            <select
                className="model-select"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                title={language === 'vi' ? 'Chọn model AI' : 'Select AI model'}
            >
                {modelGroups.map((group) => (
                    <optgroup key={group.group} label={group.group}>
                        {group.models.map((model) => (
                            <option key={model.value} value={model.value}>
                                {model.label}
                            </option>
                        ))}
                    </optgroup>
                ))}
            </select>
        </div>
    );
}

export default ModelSelector;
export { CHAT_MODELS };

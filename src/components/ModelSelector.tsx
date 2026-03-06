/**
 * ModelSelector Component
 * AI Models Configuration
 */

import type { ModelSelectorProps, ModelGroup } from '../types';
import { useLanguage } from '../utils/i18n';

/**
 * Chat models configuration
 * Source: https://docs.puter.com/AI/listModels/
 */
const CHAT_MODELS: ModelGroup[] = [
    {
        group: 'OpenAI',
        models: [
            { value: 'gpt-5.3-chat', label: 'GPT-5.3 Instant' },
            { value: 'gpt-5.2-chat-latest', label: 'GPT-5.2 Instant' },
            { value: 'gpt-5.2', label: 'GPT-5.2 Thinking' },
            { value: 'gpt-5.2-pro', label: 'GPT-5.2 Pro' },
            {
                value: 'openrouter:openai/gpt-4o-search-preview',
                label: 'GPT-4o Search',
            },
            { value: 'o3', label: 'o3 (Reasoning)' },
        ],
    },
    {
        group: 'Claude',
        models: [
            { value: 'claude-opus-4-5-20251101', label: 'Claude Opus 4.5' },
            { value: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5' },
        ],
    },
    {
        group: 'Gemini',
        models: [
            { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro' },
            { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
        ],
    },
    {
        group: 'DeepSeek',
        models: [
            { value: 'deepseek-chat', label: 'DeepSeek Chat' },
            { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
            {
                value: 'openrouter:tngtech/deepseek-r1t2-chimera:free',
                label: 'DeepSeek R1 Chimera (Free)',
            },
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

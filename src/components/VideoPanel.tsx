/**
 * VideoPanel Component
 * Video generation panel with model selection
 */

import { useState, type FormEvent } from 'react';
import { useVideoGeneration } from '../hooks/useVideoGeneration';
import { useAutoDismiss } from '../hooks/useAutoDismiss';
import { useLanguage } from '../utils/i18n';
import type { ModelGroup } from '../types';

/**
 * Video models configuration
 */
const VIDEO_MODELS: ModelGroup[] = [
    {
        group: 'OpenAI',
        models: [
            { value: 'sora-2', label: 'Sora 2' },
            { value: 'sora-2-pro', label: 'Sora 2 Pro' },
        ],
    },
    {
        group: 'Google',
        models: [
            { value: 'google/veo-3.0', label: 'Veo 3.0' },
            { value: 'google/veo-3.0-fast', label: 'Veo 3.0 Fast' },
        ],
    },
    {
        group: 'ByteDance',
        models: [
            { value: 'ByteDance/Seedance-1.0-lite', label: 'Seedance 1.0 Lite' },
            { value: 'ByteDance/Seedance-1.0-pro', label: 'Seedance 1.0 Pro' },
        ],
    },
    {
        group: 'Kling',
        models: [
            { value: 'kwaivgI/kling-2.1-master', label: 'Kling 2.1 Master' },
            { value: 'kwaivgI/kling-2.1-pro', label: 'Kling 2.1 Pro' },
            { value: 'kwaivgI/kling-2.1-standard', label: 'Kling 2.1 Standard' },
        ],
    },
    {
        group: 'MiniMax',
        models: [
            { value: 'minimax/video-01-director', label: 'Video-01 Director' },
            { value: 'minimax/hailuo-02', label: 'Hailuo 02' },
        ],
    },
];

function VideoPanel(): React.ReactElement {
    const { t, language } = useLanguage();
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState<string>('sora-2');
    const [seconds, setSeconds] = useState(4);
    const [size, setSize] = useState('1280x720');
    const [testMode, setTestMode] = useState(false);
    const {
        videoUrl,
        isLoading,
        error,
        lastPrompt,
        generateVideo,
        setError,
    } = useVideoGeneration();

    useAutoDismiss(error, setError);

    // Get size options based on model
    const getSizeOptions = (modelId: string) => {
        const modelLower = modelId.toLowerCase();

        // Sora 2 Pro - higher resolutions
        if (modelLower === 'sora-2-pro') {
            return [
                { value: '1792x1024', label: `1792x1024 (${t('horizontal')})` },
                { value: '1024x1792', label: `1024x1792 (${t('vertical')})` },
            ];
        }

        // Standard Sora 2
        if (modelLower.includes('sora')) {
            return [
                { value: '1280x720', label: `1280x720 (${t('horizontal')})` },
                { value: '720x1280', label: `720x1280 (${t('vertical')})` },
            ];
        }

        // Google Veo - uses resolution string
        if (modelLower.includes('veo') || modelLower.includes('google')) {
            return [
                { value: '720p', label: `720p (${t('horizontal')})` },
                { value: '1080p', label: `1080p (${t('horizontal')})` },
            ];
        }

        // ByteDance Seedance - uses aspect ratio
        if (modelLower.includes('seedance') || modelLower.includes('bytedance')) {
            return [
                { value: '16:9', label: `16:9 (${t('horizontal')})` },
                { value: '9:16', label: `9:16 (${t('vertical')})` },
                { value: '1:1', label: '1:1 (Square)' },
            ];
        }

        // Kling - supports 1080p
        if (modelLower.includes('kling') || modelLower.includes('kwaivgi')) {
            return [
                { value: '1920x1080', label: `1920x1080 (${t('horizontal')})` },
                { value: '1080x1920', label: `1080x1920 (${t('vertical')})` },
                { value: '1280x720', label: `1280x720 (${t('horizontal')})` },
                { value: '720x1280', label: `720x1280 (${t('vertical')})` },
            ];
        }

        // MiniMax - fixed 720p only
        if (modelLower.includes('minimax') || modelLower.includes('hailuo') || modelLower.includes('video-01')) {
            return [
                { value: '1280x720', label: `1280x720 (${t('horizontal')})` },
            ];
        }

        // Default for other models
        return [
            { value: '1280x720', label: `1280x720 (${t('horizontal')})` },
            { value: '720x1280', label: `720x1280 (${t('vertical')})` },
        ];
    };

    // Handle model change - reset size to first valid option
    const handleModelChange = (newModel: string) => {
        setModel(newModel);
        const newSizeOptions = getSizeOptions(newModel);
        // Reset to first valid size for new model
        if (!newSizeOptions.find(opt => opt.value === size)) {
            setSize(newSizeOptions[0].value);
        }
    };

    const SIZE_OPTIONS = getSizeOptions(model);

    // Localized options
    const DURATION_OPTIONS = [
        { value: 4, label: `4 ${t('seconds')}` },
        { value: 8, label: `8 ${t('seconds')}` },
        { value: 12, label: `12 ${t('seconds')}` },
    ];

    // Localized model groups
    const localizedModels: ModelGroup[] = [
        ...VIDEO_MODELS,
        {
            group: t('other'),
            models: [
                { value: 'pixverse/pixverse-v5', label: 'PixVerse V5' },
                { value: 'Wan-AI/Wan2.2-T2V-A14B', label: 'Wan 2.2 T2V' },
                { value: 'vidu/vidu-2.0', label: 'Vidu 2.0' },
                { value: 'vidu/vidu-q1', label: 'Vidu Q1' },
            ],
        },
    ];

    const handleSubmit = (e?: FormEvent): void => {
        e?.preventDefault();
        if (prompt.trim() && !isLoading) {
            generateVideo(prompt, { model, seconds, size, testMode });
        }
    };

    const shortPrompt = lastPrompt.length > 80 ? lastPrompt.substring(0, 80) + '...' : lastPrompt;

    return (
        <div className="tab-panel active">
            <div className="unstable-warning">
                <span className="unstable-warning-icon">⚡</span>
                <span className="unstable-warning-text">
                    <strong>{t('unstable')}:</strong> {t('unstableVideoWarning')}
                </span>
            </div>
            <div className="image-panel">
                <div className="image-controls">
                    <div className="model-selector">
                        <label className="form-label">{t('selectModel')}</label>
                        <select
                            className="model-select"
                            value={model}
                            onChange={(e) => handleModelChange(e.target.value)}
                            title={language === 'vi' ? 'Chọn model AI' : 'Select AI model'}
                        >
                            {localizedModels.map((group) => (
                                <optgroup key={group.group} label={group.group}>
                                    {group.models.map((m) => (
                                        <option key={m.value} value={m.value}>
                                            {m.label}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    <div className="video-options-row">
                        <div className="video-option">
                            <label className="form-label">{t('duration')}</label>
                            <select
                                className="model-select"
                                value={seconds}
                                onChange={(e) => setSeconds(Number(e.target.value))}
                            >
                                {DURATION_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="video-option">
                            <label className="form-label">{t('size')}</label>
                            <select
                                className="model-select"
                                value={size}
                                onChange={(e) => setSize(e.target.value)}
                            >
                                {SIZE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="test-mode-toggle">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={testMode}
                                onChange={(e) => setTestMode(e.target.checked)}
                            />
                            <span>{t('testMode')}</span>
                            <span className="test-mode-hint">{t('testModeHint')}</span>
                        </label>
                    </div>

                    <form className="prompt-section" onSubmit={handleSubmit}>
                        <label className="prompt-label">{t('describeVideo')}</label>
                        <textarea
                            className="prompt-input"
                            placeholder={t('videoPlaceholder')}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </form>

                    <div className="image-options">
                        <button
                            className="generate-btn"
                            onClick={() => handleSubmit()}
                            disabled={isLoading || !prompt.trim()}
                        >
                            {isLoading ? t('generatingVideo') : t('generateVideo')}
                        </button>
                    </div>
                </div>

                <div className="image-result">
                    {isLoading ? (
                        <div className="image-loading">
                            <div className="image-loading-spinner"></div>
                            <p className="image-loading-text">{t('videoLoadingText')}</p>
                            <p className="image-loading-subtext">
                                {t('videoLoadingSubtext')}
                            </p>
                        </div>
                    ) : error ? (
                        <div className="image-placeholder">
                            <div className="image-placeholder-icon"></div>
                            <p className="image-placeholder-text error">
                                {error}
                                <br />
                                <span className="hl-yellow">{t('pleaseTryAgain')}</span>
                            </p>
                        </div>
                    ) : videoUrl ? (
                        <div className="generated-video-wrapper">
                            <div className="polaroid-frame">
                                <video
                                    className="generated-video"
                                    src={videoUrl}
                                    controls
                                    autoPlay
                                    loop
                                />
                                <p className="polaroid-caption">"{shortPrompt}"</p>
                            </div>
                        </div>
                    ) : (
                        <div className="image-placeholder">
                            <div className="image-placeholder-icon">🎬</div>
                            <p className="image-placeholder-text">
                                {t('videoPlaceholderText')}
                                <br />
                                <span className="hl-blue">{t('videoPlaceholderHint')}</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VideoPanel;

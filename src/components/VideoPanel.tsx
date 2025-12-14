/**
 * VideoPanel Component
 * Video generation panel with model selection
 */

import { useState, type FormEvent } from 'react';
import { useVideoGeneration } from '../hooks/useVideoGeneration';
import { useAutoDismiss } from '../hooks/useAutoDismiss';
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
    {
        group: 'Khác',
        models: [
            { value: 'pixverse/pixverse-v5', label: 'PixVerse V5' },
            { value: 'Wan-AI/Wan2.2-T2V-A14B', label: 'Wan 2.2 T2V' },
            { value: 'vidu/vidu-2.0', label: 'Vidu 2.0' },
            { value: 'vidu/vidu-q1', label: 'Vidu Q1' },
        ],
    },
];

const DURATION_OPTIONS = [
    { value: 4, label: '4 giây' },
    { value: 8, label: '8 giây' },
    { value: 12, label: '12 giây' },
];

const SIZE_OPTIONS = [
    { value: '1280x720', label: '1280x720 (Ngang)' },
    { value: '720x1280', label: '720x1280 (Dọc)' },
];

function VideoPanel(): React.ReactElement {
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

    const handleSubmit = (e?: FormEvent): void => {
        e?.preventDefault();
        if (prompt.trim() && !isLoading) {
            generateVideo(prompt, { model, seconds, size, testMode });
        }
    };

    const shortPrompt = lastPrompt.length > 80 ? lastPrompt.substring(0, 80) + '...' : lastPrompt;

    return (
        <div className="tab-panel active">
            <div className="alpha-warning">
                <span className="alpha-warning-icon">⚠️</span>
                <span className="alpha-warning-text">
                    <strong>Tính năng Alpha:</strong> Tạo video đang ở giai đoạn rất sớm.
                    Tính năng này rất không ổn định và có thể không hoạt động.
                </span>
            </div>
            <div className="image-panel">
                <div className="image-controls">
                    <div className="model-selector">
                        <label className="form-label">Chọn Model:</label>
                        <select
                            className="model-select"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            title="Chọn model AI"
                        >
                            {VIDEO_MODELS.map((group) => (
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
                            <label className="form-label">Thời lượng:</label>
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
                            <label className="form-label">Kích thước:</label>
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
                            <span>Test Mode</span>
                            <span className="test-mode-hint">(Không tốn credits)</span>
                        </label>
                    </div>

                    <form className="prompt-section" onSubmit={handleSubmit}>
                        <label className="prompt-label">Mô tả video:</label>
                        <textarea
                            className="prompt-input"
                            placeholder="Mô tả chi tiết video bạn muốn tạo... Ví dụ: A fox sprinting through a snow-covered forest at dusk, cinematic lighting"
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
                            {isLoading ? 'Đang tạo...' : 'Tạo video'}
                        </button>
                    </div>
                </div>

                <div className="image-result">
                    {isLoading ? (
                        <div className="image-loading">
                            <div className="image-loading-spinner"></div>
                            <p className="image-loading-text">Đang tạo video...</p>
                            <p className="image-loading-subtext">
                                Quá trình này có thể mất 1-5 phút
                            </p>
                        </div>
                    ) : error ? (
                        <div className="image-placeholder">
                            <div className="image-placeholder-icon"></div>
                            <p className="image-placeholder-text error">
                                {error}
                                <br />
                                <span className="hl-yellow">Vui lòng thử lại</span>
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
                                Video được tạo sẽ hiển thị ở đây
                                <br />
                                <span className="hl-blue">Nhập prompt và nhấn "Tạo video"</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VideoPanel;

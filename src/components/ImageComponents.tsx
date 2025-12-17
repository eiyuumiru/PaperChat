/**
 * ImageComponents - Image Panel Sub-components
 */

import type { ImageErrorProps, GeneratedImageProps } from '../types';
import { useLanguage } from '../utils/i18n';

export function ImagePlaceholder(): React.ReactElement {
    const { t } = useLanguage();

    return (
        <div className="image-placeholder">
            <div className="image-placeholder-icon"></div>
            <p className="image-placeholder-text">
                {t('imagePlaceholderText')}
                <br />
                <span className="hl-blue">{t('imagePlaceholderHint')}</span>
            </p>
        </div>
    );
}

export function ImageLoading(): React.ReactElement {
    const { t } = useLanguage();

    return (
        <div className="image-loading">
            <div className="image-loading-spinner"></div>
            <p className="image-loading-text">{t('imageLoadingText')}</p>
            <p className="image-loading-subtext">
                {t('imageLoadingSubtext')}
            </p>
        </div>
    );
}

export function ImageError({ message }: ImageErrorProps): React.ReactElement {
    return (
        <div className="image-placeholder">
            <div className="image-placeholder-icon"></div>
            <p className="image-placeholder-text error">
                {message}
            </p>
        </div>
    );
}

export function GeneratedImage({ url, prompt }: GeneratedImageProps): React.ReactElement {
    const shortPrompt =
        prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt;

    return (
        <div className="generated-image-wrapper">
            <div className="polaroid-frame">
                <img className="generated-image" src={url} alt="Generated" />
                <p className="polaroid-caption">"{shortPrompt}"</p>
            </div>
        </div>
    );
}

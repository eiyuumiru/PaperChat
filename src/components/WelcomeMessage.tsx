/**
 * WelcomeMessage Component
 */

import type { WelcomeMessageProps } from '../types';
import { useLanguage, type TranslationKey } from '../utils/i18n';

interface LocalizedTip {
    textKey: TranslationKey;
    promptKey: TranslationKey;
}

const TIPS: LocalizedTip[] = [
    { textKey: 'tipQuantum', promptKey: 'tipQuantumPrompt' },
    { textKey: 'tipPoem', promptKey: 'tipPoemPrompt' },
    { textKey: 'tipStartup', promptKey: 'tipStartupPrompt' },
];

function WelcomeMessage({ onPromptClick }: WelcomeMessageProps): React.ReactElement {
    const { t } = useLanguage();

    return (
        <div className="welcome-message">
            <div className="welcome-icon"></div>
            <h2 className="welcome-title">{t('welcomeTitle')}</h2>
            <p className="welcome-text">
                {t('welcomeText')}
                <br />
                <span className="hl-yellow">{t('free')}</span> {t('and')}{' '}
                <span className="hl-pink">{t('unlimited')}</span>
            </p>
            <div className="tips-container">
                {TIPS.map((tip, idx) => (
                    <div
                        key={idx}
                        className="tip-card"
                        onClick={() => onPromptClick(t(tip.promptKey))}
                    >
                        {t(tip.textKey)}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default WelcomeMessage;

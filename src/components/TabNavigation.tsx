/**
 * TabNavigation Component
 */

import type { TabNavigationProps, TabId } from '../types';
import { useLanguage, type TranslationKey } from '../utils/i18n';

interface LocalizedTab {
    id: TabId;
    labelKey: TranslationKey;
}

const TABS: LocalizedTab[] = [
    { id: 'chat', labelKey: 'tabChat' },
    { id: 'image', labelKey: 'tabImage' },
    { id: 'video', labelKey: 'tabVideo' },
];

function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps): React.ReactElement {
    const { t } = useLanguage();

    return (
        <nav className="tab-container">
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                >
                    {t(tab.labelKey)}
                </button>
            ))}
        </nav>
    );
}

export default TabNavigation;

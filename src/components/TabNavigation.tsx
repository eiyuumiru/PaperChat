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
    // { id: 'image', labelKey: 'tabImage' },  // Temporarily disabled
    // { id: 'video', labelKey: 'tabVideo' },  // Temporarily disabled
];

function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps): React.ReactElement | null {
    const { t } = useLanguage();

    // Hide tab navigation when only one tab
    if (TABS.length <= 1) {
        return null;
    }

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

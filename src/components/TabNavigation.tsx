/**
 * TabNavigation Component
 */

import type { TabNavigationProps, TabItem } from '../types';

const TABS: TabItem[] = [
    { id: 'chat', label: 'Chat văn bản' },
    { id: 'image', label: 'Tạo hình ảnh' },
    { id: 'video', label: 'Tạo video' },
];

function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps): React.ReactElement {
    return (
        <nav className="tab-container">
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </nav>
    );
}

export default TabNavigation;

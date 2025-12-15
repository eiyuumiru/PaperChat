/**
 * App Component
 * Main application entry point
 */

import { useState } from 'react';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import ChatPanel from './components/ChatPanel';
import ImagePanel from './components/ImagePanel';
import VideoPanel from './components/VideoPanel';
import Footer from './components/Footer';
import type { TabId } from './types';

function App(): React.ReactElement {
    const [activeTab, setActiveTab] = useState<TabId>('chat');

    return (
        <div className="app-container">
            <Header />
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="main-content">
                {activeTab === 'chat' && <ChatPanel />}
                {activeTab === 'image' && <ImagePanel />}
                {activeTab === 'video' && <VideoPanel />}
            </main>

            <Footer />
        </div>
    );
}

export default App;

import { useState } from 'react'
import Header from './components/Header'
import TabNavigation from './components/TabNavigation'
import ChatPanel from './components/ChatPanel'
import ImagePanel from './components/ImagePanel'
import Footer from './components/Footer'

function App() {
  const [activeTab, setActiveTab] = useState('chat')

  return (
    <div className="app-container">
      <Header />
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        {activeTab === 'chat' ? <ChatPanel /> : <ImagePanel />}
      </main>
      
      <Footer />
    </div>
  )
}

export default App

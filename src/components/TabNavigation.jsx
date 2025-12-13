function TabNavigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "chat", label: "Chat văn bản" },
    { id: "image", label: "Tạo hình ảnh" },
  ];

  return (
    <nav className="tab-container">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default TabNavigation;

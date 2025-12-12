const TIPS = [
  { text: 'Giải thích quantum computing', prompt: 'Giải thích quantum computing đơn giản' },
  { text: 'Viết thơ về mùa thu', prompt: 'Viết một bài thơ về mùa thu' },
  { text: 'Ý tưởng startup', prompt: 'Cho tôi 5 ý tưởng startup công nghệ' }
]

function WelcomeMessage({ onPromptClick }) {
  return (
    <div className="welcome-message">
      <div className="welcome-icon"></div>
      <h2 className="welcome-title">Xin chào!</h2>
      <p className="welcome-text">
        Mình là trợ lý AI của bạn. Hãy hỏi bất cứ điều gì nhé!<br />
        <span className="hl-yellow">Miễn phí</span> và{' '}
        <span className="hl-pink">không giới hạn</span>
      </p>
      <div className="tips-container">
        {TIPS.map((tip, idx) => (
          <div
            key={idx}
            className="tip-card"
            onClick={() => onPromptClick(tip.prompt)}
          >
            {tip.text}
          </div>
        ))}
      </div>
    </div>
  )
}

export default WelcomeMessage

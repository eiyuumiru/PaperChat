# PaperChat 🎉

A beautiful **Studygram-styled** web application for AI Chat, Image Generation, and Video Generation — completely **free** via [Puter.js](https://puter.com).

<p align="center">
  <strong>
    <a href="#features">Features</a> •
    <a href="#demo">Demo</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#tech-stack">Tech Stack</a>
  </strong>
</p>

<p align="center">
  <a href="./README-vi.md">🇻🇳 Tiếng Việt</a>
</p>

---

## Features

### 💬 AI Chat
- **Multi-model support**: GPT-5.2, Claude Opus 4.5, Gemini 3 Pro, DeepSeek, o3 Reasoning, and more
- **Multi-modal input**: Upload up to 10 images/files (max 20MB each) for AI analysis
- **Rich content display**: Markdown (GFM), LaTeX math rendering, syntax-highlighted code blocks
- **Smart UX**: 40-message context history, Enter to send / Shift+Enter for newline, quick prompt suggestions
- **Web Search**: Integrated GPT-4o Search model for real-time information

### Image Generation
- **Top models**: Gemini 3 Pro Image, GPT Image 1, DALL-E 3, FLUX 1.1 Pro, Stable Diffusion 3.5
- **Polaroid-style display**: Generated images appear in a beautiful polaroid frame
- **Error handling**: Friendly loading states and error messages

### Video Generation *(Alpha)*
- **Cutting-edge models**: Sora 2, Veo 3.0, Kling 2.1, Seedance, and more
- **Customizable**: Duration (4-12s) and resolution options
- **Test Mode**: Try without consuming credits
- **Note**: Currently experiencing issues due to [Puter.js bug #2175](https://github.com/HeyPuter/puter/issues/2175)

### Studygram Design
- Handwritten fonts, lined paper background, pastel colors
- Light/Dark mode toggle
- Responsive and mobile-friendly

---

## Demo

Try PaperChat: **[Live Demo](https://chat.eiyuumiru.it.eu.org/)**

---

## Quick Start

### Prerequisites
- **Node.js** ≥ 20
- **npm** or compatible package manager
- **Puter account** (auto-created on first use via browser)

### Installation

```bash
# Clone the repository
git clone https://github.com/eiyuumiru/PaperChat.git
cd PaperChat

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | React 18, TypeScript, Vite 6 |
| **AI Backend** | [Puter.js SDK](https://docs.puter.com) (`@heyputer/puter.js`) |
| **Markdown** | react-markdown, remark-gfm, rehype-highlight |
| **Math** | remark-math, rehype-katex, KaTeX |
| **Styling** | CSS3 with Studygram aesthetic |

---

## Project Structure

```
src/
├── App.tsx              # Main app with tab navigation
├── main.tsx             # React entry point
├── components/
│   ├── ChatPanel.tsx    # Chat interface with file upload
│   ├── ImagePanel.tsx   # Image generation panel
│   ├── VideoPanel.tsx   # Video generation panel (Alpha)
│   ├── Header.tsx       # Header with help/changelog modals
│   ├── ModelSelector.tsx# AI model dropdown
│   ├── Message.tsx      # Message rendering component
│   └── ...
├── hooks/
│   ├── useChat.ts       # Chat logic with Puter AI
│   ├── useImageGeneration.ts
│   └── useVideoGeneration.ts
├── utils/
│   ├── constants.ts     # App constants & configs
│   ├── markdown.ts      # Markdown plugins config
│   └── fileValidator.ts # File upload validation
├── types/               # TypeScript definitions
└── styles/
    └── index.css        # Studygram CSS design
```

---

## API Rate Limits

PaperChat uses Puter.js which is **free** but has rate limits per account. If you hit the limit:

1. Clear cookies for PaperChat site
2. Clear cookies for [puter.com](https://puter.com)
3. Return to PaperChat and send any message
4. A new account is auto-created ✨

---

## Security Notes

- All API calls are handled via Puter.js SDK — **no API keys required**
- For production deployment, serve over **HTTPS** for stable Puter.js operation
- User authentication is managed by Puter.js automatically

---

## Contributing

Contributions are welcome! Feel free to:
- Report bugs or issues
- Suggest new features
- Submit pull requests

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Made with 💖 by <a href="https://github.com/eiyuumiru">eiyuumiru</a>
</p>
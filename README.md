# PaperChat

Ứng dụng web giao diện Studygram cho phép trò chuyện với AI và tạo hình ảnh miễn phí thông qua Puter AI.

## Tính năng
- **Chat văn bản**: Hỗ trợ nhiều model AI hàng đầu (GPT-5.2, Claude Opus 4.5, Gemini 3 Pro...), lưu ngữ cảnh 40 tin nhắn gần nhất, Enter để gửi / Shift+Enter để xuống dòng.
- **Hiển thị nội dung phong phú**: Markdown với GitHub Flavored Markdown, LaTeX math, syntax highlighting cho code blocks; tự cuộn cuối, tự co giãn ô nhập, gợi ý prompt nhanh.
- **Tạo hình ảnh**: Hỗ trợ các model image generation hàng đầu (Gemini 3 Pro Image, GPT Image 1, DALL-E 3, FLUX 2 Pro, Imagen 3, Stable Diffusion 3.5...), khung polaroid, trạng thái loading và xử lý lỗi thân thiện.
- **Thiết kế Studygram**: Phông chữ viết tay, nền giấy kẻ, màu pastel, phù hợp khi demo hoặc dạy học.
- **Công nghệ**: React 18 + Vite 6, Puter.js SDK (nạp từ CDN), react-markdown + highlight.js + KaTeX để hiển thị nội dung AI.

## Yêu cầu
- **Node.js** >= 20 (khuyến nghị cùng bản Vite 6)
- **npm** hoặc package manager tương thích
- **Tài khoản Puter** (đăng nhập trong trình duyệt; Puter.js cần quyền truy cập AI)

## Cài đặt và chạy
```bash
npm install
npm run dev
npm run build
npm run preview
```

## Cách dùng nhanh
1. Mở trang dev, chọn tab **Chat văn bản** hoặc **Tạo hình ảnh**
2. Chọn model trong dropdown (mặc định: GPT-5.2 cho chat, Gemini 3 Pro Image cho image)
3. **Chat**: Nhập nội dung, Enter để gửi; các tin gợi ý có thể bấm dùng ngay
4. **Image**: Nhập mô tả, bấm "Tạo hình ảnh"; kết quả hiển thị dưới dạng polaroid, kèm nhắc lỗi nếu có

## Cấu trúc thư mục chính
```
src/
├── App.jsx              # Component chính, bố trí header, tab, panel chat/image
├── main.jsx             # Entry point, khởi tạo React app
├── components/           # Các thành phần UI
│   ├── ChatPanel.jsx    # Panel chat với AI
│   ├── ImagePanel.jsx   # Panel tạo hình ảnh
│   ├── ModelSelector.jsx # Dropdown chọn model AI
│   ├── Message.jsx      # Component hiển thị tin nhắn
│   └── ...
├── hooks/               # Custom React hooks
│   ├── useChat.js       # Hook quản lý chat với Puter AI
│   └── useImageGeneration.js # Hook tạo hình ảnh
├── utils/               # Utilities
│   ├── constants.js    # Constants (MAX_CHAT_HISTORY, default models...)
│   ├── markdown.js     # Cấu hình react-markdown plugins
│   └── content.js      # Utilities xử lý nội dung
└── styles/
    └── index.css       # CSS định dạng Studygram
```

## Tùy chỉnh nhanh
- **Chỉnh danh sách model**: Sửa `CHAT_MODELS` và `IMAGE_MODELS` trong `src/components/ModelSelector.jsx`
- **Điều chỉnh giới hạn lịch sử chat**: Thay đổi `MAX_CHAT_HISTORY` trong `src/utils/constants.js` (mặc định: 40 tin nhắn)
- **Thay đổi model mặc định**: Sửa `DEFAULT_CHAT_MODEL` và `DEFAULT_IMAGE_MODEL` trong `src/utils/constants.js`
- **Thay đổi giao diện**: Cập nhật biến màu/phông trong `src/styles/index.css`

## Dependencies chính
- **React 18.3.1** - UI framework
- **Vite 6.4.1** - Build tool và dev server
- **react-markdown 9.1.0** - Render Markdown
- **remark-gfm** - GitHub Flavored Markdown support
- **remark-math** + **rehype-katex** - LaTeX math rendering
- **rehype-highlight** + **highlight.js** - Syntax highlighting
- **Puter.js SDK** - Load từ CDN (`https://js.puter.com/v2/`)

## Ghi chú bảo mật
- Ứng dụng dựa trên Puter.js CDN (`https://js.puter.com/v2/`). Khi triển khai cần phục vụ qua **HTTPS** để Puter hoạt động ổn định.
- Tất cả API calls được xử lý qua Puter.js SDK, không cần API keys riêng.
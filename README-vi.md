# PaperChat 🎉

Ứng dụng web với giao diện **Studygram** đẹp mắt cho Chat AI, Tạo hình ảnh và Tạo video — hoàn toàn **miễn phí** thông qua [Puter.js](https://puter.com).

<p align="center">
  <strong>
    <a href="#tính-năng">Tính năng</a> •
    <a href="#demo">Demo</a> •
    <a href="#bắt-đầu-nhanh">Bắt đầu nhanh</a> •
    <a href="#công-nghệ">Công nghệ</a>
  </strong>
</p>

<p align="center">
  <a href="./README.md">🇬🇧 English</a>
</p>

---

## Tính năng

### Chat AI
- **Đa model**: GPT-5.2, Claude Opus 4.5, Gemini 3 Pro, DeepSeek, o3 Reasoning và nhiều model khác
- **Đầu vào đa phương thức**: Upload tối đa 10 ảnh/file (mỗi file tối đa 20MB) để AI phân tích
- **Hiển thị nội dung phong phú**: Markdown (GFM), LaTeX toán học, code blocks với syntax highlighting
- **UX thông minh**: Lưu ngữ cảnh 40 tin nhắn, Enter gửi / Shift+Enter xuống dòng, gợi ý prompt nhanh
- **Tìm kiếm Web**: Tích hợp GPT-4o Search cho thông tin thời gian thực

### Tạo hình ảnh
- **Model hàng đầu**: Gemini 3 Pro Image, GPT Image 1, DALL-E 3, FLUX 1.1 Pro, Stable Diffusion 3.5
- **Hiển thị polaroid**: Hình ảnh tạo ra hiển thị trong khung polaroid đẹp mắt
- **Xử lý lỗi**: Trạng thái loading và thông báo lỗi thân thiện

### Tạo video *(Beta)*
- **Model tiên tiến**: Sora 2, Veo 3.0, Kling 2.1, Seedance và nhiều hơn nữa
- **Tuỳ chỉnh**: Thời lượng (4-12s) và độ phân giải
- **Test Mode**: Thử nghiệm mà không tốn credits

### Thiết kế Studygram
- Font chữ viết tay, nền giấy kẻ, màu pastel
- Chuyển đổi Light/Dark mode
- Responsive và thân thiện mobile

### Cài đặt & Tài khoản
- **Account Pool**: Sử dụng miễn phí không cần đăng nhập - tự động xoay vòng tài khoản khi hết credits
- **Credits/Usage**: Xem chi tiết sử dụng API với popup modal
- **Tự động load**: Credits tự động refresh khi vào trang
- **Quản lý tài khoản**: Đăng nhập/xuất với tài khoản Puter

---

## Demo

Dùng thử PaperChat: **[Live Demo](https://chat.eiyuumiru.it.eu.org/)**

---

## Bắt đầu nhanh

### Yêu cầu
- **Node.js** ≥ 20
- **npm** hoặc package manager tương thích
- **Tài khoản Puter** (tự động tạo lần đầu sử dụng qua trình duyệt)

### Cài đặt

```bash
# Clone repository
git clone https://github.com/eiyuumiru/PaperChat.git
cd PaperChat

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

### Build cho Production

```bash
npm run build
npm run preview
```

---

## Công nghệ

| Loại | Công nghệ |
|------|-----------|
| **Framework** | React 18, TypeScript, Vite 6 |
| **AI Backend** | [Puter.js SDK](https://docs.puter.com) (`@heyputer/puter.js`) |
| **Markdown** | react-markdown, remark-gfm, rehype-highlight |
| **Toán học** | remark-math, rehype-katex, KaTeX |
| **Giao diện** | CSS3 với phong cách Studygram |

---

## Cấu trúc dự án

```
src/
├── App.tsx              # App chính với tab navigation
├── main.tsx             # React entry point
├── components/
│   ├── AdminPanel.tsx   # Admin panel ẩn (Ctrl+Alt+Shift+P)
│   ├── ChatPanel.tsx    # Giao diện chat với upload file
│   ├── ImagePanel.tsx   # Panel tạo hình ảnh
│   ├── VideoPanel.tsx   # Panel tạo video (Beta)
│   ├── Header.tsx       # Header với settings/changelog
│   ├── ModelSelector.tsx# Dropdown chọn model AI
│   ├── Message.tsx      # Component hiển thị tin nhắn
│   └── ...
├── hooks/
│   ├── useChat.ts       # Logic chat với Puter AI
│   ├── useImageGeneration.ts
│   └── useVideoGeneration.ts
├── utils/
│   ├── api.ts           # API helpers & Account Pool client
│   ├── constants.ts     # Constants & cấu hình
│   ├── i18n.ts          # Hỗ trợ đa ngôn ngữ (EN/VI)
│   └── fileValidator.ts # Validation upload file
├── types/               # TypeScript definitions
└── styles/
    ├── index.css        # CSS thiết kế Studygram
    └── admin.css        # CSS admin panel

api/                     # Vercel serverless functions
├── _lib/
│   ├── accountPool.ts   # Logic xoay vòng account
│   ├── db.ts            # Turso database client
│   └── puterClient.ts   # Puter API wrapper
├── chat.ts              # API endpoint chat
├── image.ts             # API tạo hình ảnh
├── video.ts             # API tạo video
├── admin-accounts.ts    # Admin: danh sách/thêm account
└── admin-refresh.ts     # Admin: refresh tất cả credits
```

---

## Giới hạn API

PaperChat sử dụng Puter.js - **miễn phí** nhưng có giới hạn request cho mỗi tài khoản. Nếu bạn gặp giới hạn:

1. Xoá cookie của trang PaperChat
2. Xoá cookie của [puter.com](https://puter.com)
3. Quay lại PaperChat và gửi tin nhắn bất kỳ
4. Tài khoản mới tự động được tạo ✨

---

## Ghi chú bảo mật

- Tất cả API calls được xử lý qua Puter.js SDK — **không cần API keys**
- Khi triển khai production, phục vụ qua **HTTPS** để Puter.js hoạt động ổn định
- Xác thực người dùng được Puter.js quản lý tự động

---

## Đóng góp

Chào mừng mọi đóng góp! Bạn có thể:
- Báo cáo bugs hoặc vấn đề
- Đề xuất tính năng mới
- Gửi pull requests

---

## Giấy phép

Dự án này là mã nguồn mở theo [MIT License](LICENSE).

---

<p align="center">
  Made with 💖 by <a href="https://github.com/eiyuumiru">eiyuumiru</a>
</p>

# PaperChat

Ứng dụng web giao diện Studygram cho phép trò chuyện với AI và tạo hình ảnh miễn phí thông qua Puter AI.

## Tính năng
- Chat văn bản với nhiều model (GPT, Claude, Gemini), lưu ngữ cảnh 10 tin nhắn gần nhất, Enter để gửi / Shift+Enter để xuống dòng.
- Hiển thị Markdown và tô sáng mã với highlight.js; tự cuộn cuối, tự co giãn ô nhập, gợi ý prompt nhanh.
- Tạo hình ảnh từ prompt với các model phổ biến (GPT Image, DALL-E, FLUX, Imagen...), khung polaroid, trạng thái loading và xử lý lỗi thân thiện.
- Thiết kế Studygram: phông chữ viết tay, nền giấy kẻ, màu pastel, phù hợp khi demo hoặc dạy học.
- Xây dựng bằng React 18 + Vite 6, Puter.js SDK (nạp từ CDN trong `index.html`), marked + highlight.js để hiển thị nội dung AI.

## Yêu cầu
- Node.js >= 20 (khuyến nghị cùng bản Vite 6).
- npm.
- Tài khoản Puter (đăng nhập trong trình duyệt; Puter.js cần quyền truy cập AI).

## Cài đặt và chạy
```bash
npm install
npm run dev
npm run build
npm run preview
```

## Cách dùng nhanh
- Mở trang dev, chọn tab `Chat văn bản` hoặc `Tạo hình ảnh`.
- Chọn model trong bộ lọc (mặc định ưu tiên ổn định).
- Chat: nhập nội dung, Enter để gửi; các tin gợi ý có thể bấm dùng ngay.
- Image: nhập mô tả, bấm "Tạo hình ảnh"; kết quả hiển thị dưới dạng polaroid, kèm nhắc lỗi nếu có.

## Cấu trúc thư mục chính
- `src/App.jsx` bố trí header, tab, panel chat/image.
- `src/components/` các thành phần UI (ChatPanel, ImagePanel, ModelSelector, Message...).
- `src/hooks/useChat.js` và `src/hooks/useImageGeneration.js` gọi Puter AI chat và txt2img.
- `src/utils/markdown.js` cấu hình marked + highlight.js.
- `src/styles/index.css` định dạng Studygram.

## Tùy chỉnh nhanh
- Chỉnh danh sách model: `src/components/ModelSelector.jsx`.
- Điều chỉnh logic gọi API hoặc giới hạn lịch sử: `src/hooks/useChat.js` (prop `messages.slice(-10)`).
- Thay đổi giao diện: cập nhật biến màu/phông trong `src/styles/index.css`.

## Ghi chú bảo mật
- Ứng dụng dựa trên Puter.js CDN (`https://js.puter.com/v2/`). Khi triển khai cần phục vụ qua HTTPS để Puter hoạt động ổn định.

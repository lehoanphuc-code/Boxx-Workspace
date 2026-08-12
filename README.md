# 🚀 Boxx Workspace - All-in-One Desktop Workspace & AI Copilot

[![Electron](https://img.shields.io/badge/Electron-34.5.8-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Boxx Workspace** là ứng dụng Desktop hợp nhất giúp bạn gom tất cả 9 nền tảng nhắn tin, trao đổi công việc và trí tuệ nhân tạo hàng đầu vào **duy nhất 1 giao diện hiện đại**, tối ưu RAM tối đa và tích hợp Trợ lý Trí tuệ Nhân tạo **Google Gemini 3.5 Flash AI Copilot**.

---

## 🌟 Tính năng Nổi bật (Key Features)

### 📱 1. Hợp nhất 9 Dịch vụ Công việc trên 1 Giao diện
* **Zalo Web** (`chat.zalo.me`)
* **Facebook Messenger** (`messenger.com`)
* **Telegram Web** (`web.telegram.org`)
* **WhatsApp Web** (`web.whatsapp.com`)
* **Microsoft Teams** (`teams.live.com/v2`)
* **Mail / Gmail** (`mail.google.com`)
* **ChatGPT Web** (`chatgpt.com`)
* **Gemini Web Chat** (`gemini.google.com`)
* **Transfer.it** (`transfer.it`)

### ⚡ 2. Trợ lý Trí tuệ Nhân tạo Google Gemini 3.5 Flash Copilot
* **Đọc & Phân tích Chat Trực tiếp**: Nhấn nút "Tóm tắt" để Gemini tự động đọc tin nhắn trên màn hình và tóm tắt cuộc họp/tin nhắn dài.
* **Bóc tách Việc cần làm (Task Extraction)**: Tự động phát hiện các việc được giao trong hội thoại và thêm vào bảng công việc **To-Do List**.
* **Gợi ý Câu trả lời Thông minh (Smart Reply Generator)**: Soạn sẵn 3 phương án trả lời bằng Tiếng Việt theo các phong cách chuyên nghiệp, nhanh gọn.

### 🔔 3. Động cơ Thông báo Thông minh (Smart Notification Engine v2.0)
* **Thông báo ngầm liên tục**: Tự động phát tiếng chuông báo khi có tin nhắn mới ở bất kỳ tab ngầm nào.
* **Hiệu ứng Thị giác linh hoạt**: Icon trên Sidebar hiển thị **hạt đậu đỏ số tin nhắn chưa đọc** kèm hiệu ứng vòng hào quang nhấp nháy.
* **Tự động xóa thông báo khi xem**: Tự động xóa chấm đỏ ngay khi bạn click sang xem tab ứng dụng đó.

### 📥 4. Kéo & Thả File Trực tiếp (Windows Native File Drop Injector)
* Thả file trực tiếp từ **Windows File Explorer** vào khung chat.
* Tích hợp nút 📎 đính kèm file nhanh trên thanh công cụ Sidebar.

### 🌐 5. Mở Liên kết Ngoại vi theo Trình duyệt Tùy chọn
* Tùy chọn trình duyệt yêu thích (**Microsoft Edge, Google Chrome, Mozilla Firefox, Brave...**) trong **Cài đặt ⚙️**.
* Nhấp vào đường link trong hội thoại chat sẽ **tự động mở tab mới** trong cửa sổ trình duyệt đang mở của bạn.

### 🛡️ 6. Bypass Đăng nhập Google & Tự động Cập nhật Ngầm (Auto-Update)
* Vượt qua các lớp rào cản kiểm tra an toàn trình duyệt của Google OAuth.
* Tự động kiểm tra và nâng cấp phiên bản mới nhất từ **GitHub Releases** chỉ với 1-click.

---

## 📥 Hướng dẫn Cài đặt & Sử dụng (Installation Guide)

### 👤 Dành cho Người dùng Cuối (End Users)

👉 **[📥 TẢI NGAY FILE BOXX-WORKSPACE.EXE (CLICK LÀ TẢI TRỰC TIẾP)](https://github.com/lehoanphuc-code/Boxx-Workspace/releases/latest/download/Boxx-Workspace.exe)**

1. Click vào đường dẫn **[Tải ngay file Boxx-Workspace.exe](https://github.com/lehoanphuc-code/Boxx-Workspace/releases/latest/download/Boxx-Workspace.exe)** ở trên.
2. Trình duyệt sẽ **tự động tải trực tiếp file `Boxx-Workspace.exe`** về máy tính của bạn (không mở trang trung gian, không cần giải nén file zip).
3. Click đúp vào file **`Boxx-Workspace.exe`** vừa tải về để sử dụng ngay!

---

### 💻 Dành cho Lập trình viên (Developers)

#### 1. Yêu cầu Tiền đề (Prerequisites)
* [Node.js](https://nodejs.org/) (Phiên bản v18 trở lên)
* [Git](https://git-scm.com/)

#### 2. Cài đặt Mã nguồn (Setup Project)
```bash
# Clone repository về máy
git clone https://github.com/lehoanphuc-code/Boxx-Workspace.git

# Di chuyển vào thư mục dự án
cd Boxx-Workspace

# Cài đặt các thư viện phụ thuộc
npm install
```

#### 3. Chạy ứng dụng ở Môi trường Phát triển (Development Mode)
```bash
npm run electron:dev
```

#### 4. Đóng gói Phần mềm thành File `.exe` (Production Build)
```bash
npm run electron:build
```
Sản phẩm đóng gói sẽ nằm trong thư mục: `dist_build/Boxx Workspace-win32-x64/Boxx Workspace.exe`.

---

## ⌨️ Phím tắt Nhanh (Keyboard Shortcuts)

| Phím tắt | Thao tác |
| :--- | :--- |
| `Ctrl + K` | Mở bảng điều khiển nhanh **Command Palette** |
| `Ctrl + Shift + A` | Bật / Tắt Trợ lý **Google Gemini AI Copilot** |
| `Ctrl + Shift + T` | Bật / Tắt Danh sách Công việc **To-Do Tasks** |

---

## 📄 Giấy phép (License)
Dự án được phát hành theo giấy phép [MIT License](LICENSE).

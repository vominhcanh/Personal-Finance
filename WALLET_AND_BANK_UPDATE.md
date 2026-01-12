# 🏦 Cập Nhật Tính Năng Ví & Ngân Hàng (Cho Frontend)

Mô tả các thay đổi API và hướng dẫn cập nhật giao diện (Frontend) để tích hợp tính năng liên kết Ngân hàng vào Ví.

---

## 1. Module Ngân Hàng (Banks) - [MỚI]

Dùng để lấy danh sách ngân hàng Việt Nam (từ VietQR) lấp vào Dropdown.

### API

- `GET /v1/banks?keyword=...`
  - **Mô tả:** Lấy danh sách ngân hàng.
  - **Params:** `keyword` (Tùy chọn) - Tìm theo tên hoặc mã ngân hàng (VD: "VCB", "Vietcombank").
  - **Response:**
    ```json
    [
        {
            "id": 4,
            "name": "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
            "code": "BIDV",
            "shortName": "BIDV",
            "logo": "https://cdn.vietqr.io/img/BIDV.png",
            ...
        },
        ...
    ]
    ```

### 🎨 UI Update (Frontend)

Tại form **Thêm mới / Chỉnh sửa Ví**:

1.  Thêm 1 trường **Select/Dropdown** chọn Ngân hàng.
2.  Data source: Gọi API `/v1/banks`.
3.  Hiển thị item: Logo + Tên ngắn (shortName).
4.  Giá trị lưu: Lấy `_id` của Bank (lưu ý: là `_id` mongoDB của record bank trong hệ thống mình, sau khi sync).

> **Lưu ý:** Nếu chưa có dữ liệu Bank, hãy gọi `POST /v1/banks/sync` một lần để nạp dữ liệu.

---

## 2. Module Ví (Wallets) - [CẬP NHẬT]

### Các trường mới trong `Wallet` Object

- `bankId` (ObjectId): ID của ngân hàng liên kết.
- `logo` (String URL): Logo của ngân hàng (hoặc logo tùy chỉnh).
- `color` (String Hex): Mã màu cho ví (VD: `#1890ff`).

### API Tạo / Cập nhật Ví (`POST /v1/wallets`, `PATCH /v1/wallets/:id`)

Payload bổ sung:

```json
{
  "name": "Ví tiêu dùng",
  "type": "BANK",
  "initialBalance": 1000000,
  ...
  "bankId": "65abcdef123456...",  // [MỚI] Chọn từ danh sách Bank
  "color": "#FF5733",             // [MỚI] Chọn từ Color Picker
  "logo": "..."                   // [TỰ ĐỘNG] Fe có thể gửi hoặc không. Backend sẽ tự fill từ bankId nếu không có.
}
```

### ⚙️ Logic Tự Động (Backend)

Khi Frontend gửi `bankId`:

1.  Backend sẽ tự động tìm ngân hàng đó.
2.  Lấy URL `logo` và `shortName` của ngân hàng điền vào `logo` và `bankName` của Ví (nếu Frontend để trống).
3.  Frontend **không cần** phải tự set logo thủ công, trừ khi người dùng muốn upload logo riêng.

---

## 3. Gợi ý hiển thị (FE Implementation)

1.  **Card Ví (Danh sách)**:
    - Background/Border: Dùng trường `color` để tô màu nền hoặc viền cho card ví.
    - Logo: Hiển thị ảnh từ trường `logo`.
2.  **Form Thêm Ví**:
    - Thêm **Color Picker** để chọn màu.
    - Thêm **Bank Select** (như mục 1).

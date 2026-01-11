# 📖 Hướng Dẫn Sử Dụng Module Giao Dịch (Transactions)

Tài liệu này mô tả chi tiết cách sử dụng, cấu trúc dữ liệu và cơ chế tự động cập nhật số dư của tính năng **Quản lý Thu Chi (Transactions)**.

## 1. Tổng Quan

Module **Transactions** là lõi của hệ thống quản lý tài chính, chịu trách nhiệm:

1.  Ghi nhận các khoản Thu (Income), Chi (Expense) và Chuyển khoản (Transfer).
2.  **Tự động tính toán lại số dư Ví (Wallet)** ngay lập tức khi tạo, sửa, hoặc xóa giao dịch.

---

## 2. Mô Hình Dữ Liệu (Data Model)

### 2.1. Transaction (Giao Dịch)

| Trường           | Kiểu     | Bắt buộc     | Mô tả                                         |
| :--------------- | :------- | :----------- | :-------------------------------------------- |
| `walletId`       | ObjectId | Có           | ID của Ví thực hiện giao dịch (Ví nguồn).     |
| `categoryId`     | ObjectId | Có           | ID của Danh mục chi tiêu (Ăn uống, Lương...). |
| `amount`         | Number   | Có           | Số tiền giao dịch.                            |
| `type`           | String   | Có           | `INCOME`, `EXPENSE`, hoặc `TRANSFER`.         |
| `date`           | Date     | Có           | Ngày phát sinh giao dịch.                     |
| `note`           | String   | Không        | Ghi chú thêm.                                 |
| `images`         | String[] | Không        | Danh sách link ảnh hóa đơn.                   |
| `targetWalletId` | ObjectId | Khi Transfer | ID của Ví đích (chỉ dùng khi Chuyển khoản).   |

---

## 3. Các API Endpoints

**Prefix:** `/v1/transactions`

### 3.1. Tạo Giao Dịch Mới (Create)

**Endpoint:** `POST /v1/transactions`

- **Logic Tự Động:**
  - `INCOME`: **Cộng** tiền vào `walletId`.
  - `EXPENSE`: **Trừ** tiền từ `walletId`.
  - `TRANSFER`: **Trừ** tiền từ `walletId` (nguồn) VÀ **Cộng** tiền vào `targetWalletId` (đích).

**Payload mẫu (Chi tiêu):**

```json
{
  "walletId": "65ae...",
  "categoryId": "65bf...",
  "amount": 50000,
  "type": "EXPENSE",
  "date": "2024-01-10T08:30:00Z",
  "note": "Ăn sáng"
}
```

**Payload mẫu (Chuyển khoản):**

```json
{
  "walletId": "65ae... (Ví Tiền mặt)",
  "targetWalletId": "65cc... (Ví Tiết kiệm)",
  "amount": 2000000,
  "type": "TRANSFER",
  "date": "2024-01-10T10:00:00Z",
  "note": "Gửi tiết kiệm tháng 1"
}
```

### 3.2. Lấy Danh Sách (List)

**Endpoint:** `GET /v1/transactions?page=1&take=20`

- Hỗ trợ phân trang qua `page` và `take`.
- Sắp xếp mặc định theo ngày giảm dần (`date` -1).

### 3.3. Xem Chi Tiết (Detail)

**Endpoint:** `GET /v1/transactions/:id`

### 3.4. Cập Nhật Giao Dịch (Update)

**Endpoint:** `PATCH /v1/transactions/:id`

- **Cơ chế hoàn tiền thông minh:**
  1.  Hệ thống sẽ **đảo ngược (revert)** số dư của giao dịch cũ.
  2.  Sau đó **áp dụng (apply)** số dư của dữ liệu mới cập nhật.
- _Ví dụ:_ Sửa một khoản chi 50k thành 100k -> Hệ thống sẽ cộng lại 50k vào ví, sau đó trừ đi 100k.

### 3.5. Xóa Giao Dịch (Delete)

**Endpoint:** `DELETE /v1/transactions/:id`

- **Logic Tự Động:** Hoàn trả lại số dư về ví như trước khi có giao dịch này.
  - Xóa `EXPENSE` -> Cộng lại tiền vào ví.
  - Xóa `INCOME` -> Trừ bớt tiền khỏi ví.

---

## 4. Lưu Ý Quan Trọng

1.  **Tính Toàn Vẹn Dữ Liệu:** Mọi thao tác (Tạo, Sửa, Xóa) đều được thực hiện trong một **Database Transaction** (nếu MongoDB replica set được bật) để đảm bảo tiền trong ví và lịch sử giao dịch luôn khớp nhau. Nếu lỗi xảy ra, toàn bộ sẽ được rollback.
2.  **Chuyển Khoản:** Khi tạo `TRANSFER`, bắt buộc phải có `targetWalletId`. Nếu thiếu, hệ thống có thể báo lỗi hoặc xử lý sai logic trừ ví đích.

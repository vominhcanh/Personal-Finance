# 📖 Hướng Dẫn Sử Dụng Module Ví & Thẻ (Wallets)

Tài liệu này mô tả chi tiết tính năng quản lý **Ví (Cash/Bank)** và **Thẻ (Debit/Credit/Prepaid)**.

## 1. Mô Hình Dữ Liệu

Module Wallets quản lý chung cho cả Ví và các loại Thẻ. Phân biệt bằng trường `type`.

| Loại (`type`)  | Mô tả               | Dữ liệu quan trọng cần nhập                                           |
| :------------- | :------------------ | :-------------------------------------------------------------------- |
| `CASH`         | Tiền mặt            | Tên, Số dư ban đầu.                                                   |
| `BANK`         | Tài khoản ngân hàng | Tên, Số dư, Số tài khoản.                                             |
| `DEBIT_CARD`   | Thẻ Ghi Nợ (ATM)    | Ngân hàng, Số thẻ (mask), Hạn tiêu dùng, Số dư (thường map với Bank). |
| `CREDIT_CARD`  | Thẻ Tín Dụng        | Hạn mức, Ngày sao kê, Ngày đáo hạn, Lãi suất.                         |
| `PREPAID_CARD` | Thẻ Trả Trước       | Số dư, Nhà phát hành.                                                 |

### 1.1. Các Trường Dữ Liệu Chi Tiết

Ngoài các trường cơ bản (`name`, `balance`, `currency`), dưới đây là các trường mở rộng cho Thẻ:

| Trường (API Key) | Kiểu   | Dùng cho loại thẻ | Mô tả                                                |
| :--------------- | :----- | :---------------- | :--------------------------------------------------- |
| `bankName`       | String | Tất cả thẻ        | Tên ngân hàng phát hành (VPBank, VCB...)             |
| `maskedNumber`   | String | Tất cả thẻ        | 4 số cuối (hoặc mask \*\*\*\* 1234)                  |
| `cardType`       | String | Tất cả thẻ        | VISA, MASTER, JCB, AMEX...                           |
| `issuanceDate`   | Date   | Tất cả thẻ        | Ngày phát hành                                       |
| `expirationDate` | Date   | Tất cả thẻ        | Ngày hết hạn                                         |
| `creditLimit`    | Number | **Credit Card**   | Hạn mức tín dụng tối đa                              |
| `statementDate`  | Number | **Credit Card**   | Ngày sao kê hàng tháng (VD: 20 -> ngày 20)           |
| `paymentDueDate` | Number | **Credit Card**   | Ngày đến hạn thanh toán (VD: 5 -> ngày 05 tháng sau) |
| `interestRate`   | Number | **Credit Card**   | Lãi suất (%/năm)                                     |
| `annualFee`      | Number | **Credit Card**   | Phí thường niên                                      |
| `status`         | Enum   | Tất cả            | `ACTIVE` (Hoạt động), `LOCKED` (Khóa)                |

---

## 2. API Endpoints

**Prefix:** `/v1/wallets`

### 2.1. Lấy Danh Sách Ví & Thẻ

**Endpoint:** `GET /v1/wallets`

- Trả về danh sách tất cả, có thể lọc hoặc phân loại ở Frontend.

### 2.2. Tạo Mới (Create)

**Endpoint:** `POST /v1/wallets`

**Payload Mẫu (Tạo Thẻ Tín Dụng):**

```json
{
  "name": "TPBank EVO",
  "type": "CREDIT_CARD",
  "initialBalance": 0,
  "creditLimit": 20000000,
  "bankName": "TPBank",
  "maskedNumber": "**** 6789",
  "cardType": "VISA",
  "statementDate": 25,
  "paymentDueDate": 10
}
```

**Payload Mẫu (Tạo Thẻ Ghi Nợ/Debit):**

```json
{
  "name": "VCB Digibank",
  "type": "DEBIT_CARD",
  "initialBalance": 5000000,
  "bankName": "Vietcombank",
  "maskedNumber": "**** 1234",
  "cardType": "VISA",
  "expirationDate": "2028-01-01"
}
```

### 2.3. Tạo Dữ Liệu Mẫu (Seed Cards)

**Endpoint:** `POST /v1/wallets/seed-cards`

- Chức năng: Tự động tạo nhanh 2 thẻ mẫu (1 Debit Vietcombank, 1 Credit TPBank) để test giao diện.
- **Không cần body.**

### 2.4. Cập Nhật (Update)

**Endpoint:** `PATCH /v1/wallets/:id`

- Cho phép cập nhật thông tin thẻ, ví dụ khóa thẻ (`status: "LOCKED"`) hoặc đổi hạn mức.

---

## 3. Logic Hiển Thị (Frontend)

- **Debit Card:** Hiển thị như một ví tiền bình thường, số dư là tiền thực có.
- **Credit Card:**
  - **Số dư (Balance):** Thường hiển thị số ÂM (thể hiện dư nợ hiện tại) hoặc số DƯƠNG (nếu coi là hạn mức còn lại).
  - **Logic đề xuất:** Nên hiển thị `Hạn Mức - Dư Nợ` = `Số tiền khả dụng`.
  - Cần highlight `Ngày Sao Kê` và `Ngày Đáo Hạn` để nhắc nhở người dùng.

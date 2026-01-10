# 📖 Hướng Dẫn Sử Dụng Module Quản Lý Nợ (Debts)

Tài liệu này mô tả chi tiết cách sử dụng, cấu trúc dữ liệu và luồng xử lý của tính năng Quản lý Nợ (Vay & Cho Vay) trong hệ thống.

## 1. Tổng Quan

Module **Debts** cho phép người dùng theo dõi các khoản nợ cá nhân và các khoản cho vay. Một tính năng quan trọng là khả năng **tự động chia nhỏ khoản nợ thành các kỳ trả góp** và tích hợp chặt chẽ với **Ví tiền (Wallets)** để tự động trừ tiền khi thanh toán.

---

## 2. Mô Hình Dữ Liệu (Data Model)

### 2.1. Debt (Khoản Nợ Gốc)

Lưu trữ thông tin tổng quan về khoản vay/cho vay.

| Trường            | Kiểu    | Bắt buộc    | Mô tả                                                |
| :---------------- | :------ | :---------- | :--------------------------------------------------- |
| `partnerName`     | String  | Có          | Tên đối tác (Người mình nợ hoặc người nợ mình).      |
| `type`            | String  | Có          | `LOAN` (Mình đi vay) / `LEND` (Mình cho vay).        |
| `totalAmount`     | Number  | Có          | Tổng số tiền nợ.                                     |
| `remainingAmount` | Number  | Tự động     | Số tiền còn lại chưa thanh toán.                     |
| `status`          | String  | Không       | `ONGOING` (Đang nợ) / `COMPLETED` (Đã xong).         |
| `isInstallment`   | Boolean | Không       | `true` nếu trả góp, `false` nếu trả 1 lần.           |
| `totalMonths`     | Number  | Khi trả góp | Tổng số tháng trả góp (VD: 12).                      |
| `monthlyPayment`  | Number  | Khi trả góp | Số tiền phải trả hàng tháng (Nếu null, tự chia đều). |
| `paymentDate`     | Number  | Khi trả góp | Ngày trả định kỳ trong tháng (VD: ngày 10).          |

### 2.2. DebtInstallment (Kỳ Trả Góp)

Được sinh ra tự động nếu `isInstallment = true`.

| Trường    | Kiểu     | Mô tả                                                       |
| :-------- | :------- | :---------------------------------------------------------- |
| `debtId`  | ObjectId | Liên kết với Debt gốc.                                      |
| `dueDate` | Date     | Hạn trả của kỳ này.                                         |
| `amount`  | Number   | Số tiền cần trả của kỳ này.                                 |
| `status`  | String   | `PENDING` (Chưa trả), `PAID` (Đã trả), `OVERDUE` (Quá hạn). |
| `paidAt`  | Date     | Thời điểm thực tế đã thanh toán.                            |

---

## 3. Các API Endpoints

### 3.1. Tạo Khoản Nợ Mới

**Endpoint:** `POST /v1/debts`

Tạo một khoản nợ mới. Nếu bật chế độ trả góp (`isInstallment: true`), hệ thống sẽ tự động tính toán và tạo ra các bản ghi `Installment` tương ứng.

**Payload mẫu (Có trả góp):**

```json
{
  "partnerName": "Ngân hàng ABC",
  "type": "LOAN",
  "totalAmount": 12000000,
  "isInstallment": true,
  "totalMonths": 12,
  "startDate": "2024-01-01T00:00:00Z",
  "paymentDate": 5,
  "monthlyPayment": 1000000 // Tùy chọn, nếu không nhập hệ thống tự tính (12tr / 12)
}
```

**Payload mẫu (Không trả góp):**

```json
{
  "partnerName": "Bạn Bè",
  "type": "LEND",
  "totalAmount": 500000
}
```

### 3.2. Lấy Danh Sách & Chi Tiết

- **Danh sách:** `GET /v1/debts?page=1&take=10`
- **Chi tiết:** `GET /v1/debts/:id`
  - _Lưu ý:_ Khi lấy chi tiết, response sẽ bao gồm mảng `installments` chứa danh sách các kỳ trả góp đã được sắp xếp theo hạn thanh toán.

### 3.3. Thanh Toán Trả Góp (QUAN TRỌNG)

**Endpoint:** `POST /v1/debts/pay-installment`

API này dùng để xác nhận thanh toán cho **một kỳ trả góp cụ thể**.

**Payload:**

```json
{
  "installmentId": "65sfd... (ID của kỳ trả góp)",
  "walletId": "65abc... (ID của ví tiền dùng để trả)"
}
```

**Luồng xử lý tự động (Hệ thống tự làm):**

1.  **Trừ tiền ví:** Hệ thống tự động trừ tiền trong ví (nếu là `LOAN`) hoặc cộng tiền vào ví (nếu là `LEND`).
2.  **Tạo Giao Dịch (Transaction):** Tự động tạo một bản ghi Transaction mới với loại `EXPENSE` (Chi tiêu) hoặc `INCOME` (Thu nhập) để lưu lại lịch sử dòng tiền.
3.  **Cập nhật Trạng Thái:**
    - Kỳ trả góp chuyển sang `PAID`.
    - Khoản nợ gốc giảm `remainingAmount`.
    - Nếu trả hết, khoản nợ gốc chuyển sang `COMPLETED`.

---

## 4. Logic Nghiệp Vụ Cần Lưu Ý

1.  **Loại Giao Dịch Tự Động:**
    - Nếu Debt là **LOAN** (Đi vay) -> Khi trả sẽ tạo Transaction **EXPENSE** (Chi tiền trả nợ).
    - Nếu Debt là **LEND** (Cho vay) -> Khi thu nợ sẽ tạo Transaction **INCOME** (Thu nhập/Thu hồi nợ).

2.  **Tính Toán:**
    - `remainingAmount` được cập nhật realtime mỗi khi thanh toán thành công một kỳ.
    - `monthlyPayment` nếu không nhập sẽ bằng `totalAmount / totalMonths`.

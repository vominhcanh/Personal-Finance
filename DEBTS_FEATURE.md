# 📖 Hướng Dẫn Sử Dụng Module Quản Lý Nợ (Debts) - Updated

Tài liệu này mô tả chi tiết quy trình xử lý Nợ vay & Cho vay với logic **Trả Góp (Installment)** mới.

## 1. Thay Đổi Cốt Lõi (Refactor Logic)

### A. Cấu Trúc Dữ Liệu

- **`isInstallment`**: Chuyển từ `boolean` sang `number`.
  - `1`: Có trả góp.
  - `0`: Trả 1 lần (Không trả góp).
- **`startDate`**: (Bắt buộc nếu trả góp) Ngày bắt đầu tính lịch trả nợ.

### B. Logic Sinh Kỳ Trả Góp (Installment Generation)

Hệ thống **KHÔNG** sinh ra toàn bộ các kỳ (VD: 12 kỳ) ngay lập tức. Thay vào đó sử dụng logic **On-Demand**:

1.  **Lịch Sử (Quá Khứ)**:
    - Dựa vào `startDate`, hệ thống tính toán có bao nhiêu kỳ **đã trôi qua** so với ngày hiện tại (Today).
    - Các kỳ này được tự động tạo ra với trạng thái **`PAID`** (Đã hoàn thành) để ghi nhận lịch sử.
    - _Lý do:_ "Nếu ngày bắt đầu trong quá khứ thì coi như đã trả rồi".

2.  **Kỳ Hiện Tại / Tiếp Theo**:
    - Hệ thống chỉ tạo ra **Duy Nhất 1 Kỳ** tiếp theo (trạng thái `PENDING`) để người dùng thanh toán.
    - Thông tin kỳ này (Số tiền, Hạn trả) được tính toán dựa trên lịch sử.

    **Cấu trúc một kỳ trả góp (Installment Object):**

    | Trường     | Kiểu Dữ Liệu | Mô Tả                                                       |
    | :--------- | :----------- | :---------------------------------------------------------- |
    | `period`   | Number       | Số thứ tự của kỳ (VD: 1, 2, 3...).                          |
    | `amount`   | Number       | Số tiền cần thanh toán cho kỳ này.                          |
    | `dueDate`  | Date         | Hạn chót thanh toán.                                        |
    | `status`   | String       | `PENDING` (Chưa trả), `PAID` (Đã trả), `OVERDUE` (Quá hạn). |
    | `paidAt`   | Date         | Thời điểm thực tế đã thanh toán.                            |
    | `walletId` | Object       | Thông tin ví đã thanh toán (Populated: name, color, type).  |

3.  **Khi Thanh Toán**:
    - Khi người dùng thanh toán kỳ `PENDING` hiện tại -> Trạng thái chuyển thành `PAID`.
    - Hệ thống **Tự Động Sinh Kỳ Tiếp Theo** (nếu chưa hết số tháng trả góp).
    - Ghi nhận Giao dịch (Transaction) trừ/cộng tiền vào Ví.

### C. Quy Tắc Chỉnh Sửa

- **KHÔNG ĐƯỢC PHÉP** chỉnh sửa: `Số tháng trả góp`, `Ngày bắt đầu` sau khi đã tạo.
- Lý do: Đảm bảo tính toàn vẹn của lịch sử trả nợ đã sinh ra.

---

## 2. API Endpoints

### 2.1. Tạo Khoản Nợ Mới

**Endpoint:** `POST /v1/debts`

**Payload Mới:**

```json
{
  "partnerName": "Mua Laptop",
  "type": "LOAN",
  "totalAmount": 24000000,
  "isInstallment": 1, // 1 = Có trả góp
  "totalMonths": 12,
  "startDate": "2023-09-20T00:00:00Z", // Quan trọng
  "monthlyPayment": 2000000
}
```

**Ví dụ Logic:**

- Hôm nay: `2024-01-12`. StartDate: `2023-09-20`.
- Khoảng cách: 4 tháng (T9, T10, T11, T12).
- **Hệ thống sẽ tạo:**
  - 4 Kỳ `PAID` (Kỳ 1, 2, 3, 4) với `dueDate` lần lượt 20/09, 20/10, 20/11, 20/12. (Paid History).
  - 1 Kỳ `PENDING` (Kỳ 5) với `dueDate` = 20/01/2024.
- Như vậy user chỉ thấy cần thanh toán kỳ tháng 1.

### 2.2. Thanh Toán Kỳ

**Endpoint:** `POST /v1/debts/pay-installment`

- **Hành động:** Thanh toán kỳ tháng 1 (20/01).
- **Kết quả:**
  - Kỳ tháng 1 chuyển `PAID`.
  - Hệ thống tạo mới Kỳ tháng 2 (20/02) `PENDING`.

### 2.3. Lấy Danh Sách

**Endpoint:** `GET /v1/debts`

- Trả về thông tin nợ + Mảng `installments` (Gồm các kỳ đã Paid và 1 kỳ Pending).

---

## 3. UI Requirements (Frontend)

Prompt cho AI Frontend:

1.  **Form Tạo Nợ:**
    - Input `isInstallment`: Checkbox/Switch. (Value 0/1).
    - Nếu = 1: Hiển thị thêm `Total Months`, `Start Date`, `Monthly Payment`.
    - **Validate:** Start Date bắt buộc.

2.  **Form Sửa Nợ:**
    - Nếu đang là Trả góp (`isInstallment == 1`): **Disable** (Khóa) các trường `Total Months`, `Start Date`. Chỉ cho sửa tên/note.

3.  **Chi Tiết Nợ:**
    - Hiển thị danh sách Lịch sử trả nợ (Các kỳ PAID).
    - Hiển thị Kỳ Hiện Tại (PENDING) nổi bật kèm nút **"Thanh Toán"**.

---

## 4. Hướng Dẫn UI/UX Chi Tiết (Frontend Specs)

Đây là mô tả chi tiết để đội ngũ Frontend (hoặc AI Frontend) xây dựng giao diện chính xác.

### 4.1. Màn Hình Tạo Khoản Nợ Mới (Create Debt Form)

- **Trường `Loại Nợ`:** Radio Button [Đi Vay (Loan) | Cho Vay (Lend)].
- **Trường `Tổng Số Tiền`:** Input Number (Format tiền tệ).
- **Toggle `Trả Góp`:** Switch/Checkbox ("Áp dụng trả góp?").
  - **Mặc định:** Tắt (Value = 0).
  - **Khi Bật (Value = 1):** Hiển thị thêm các trường sau (bắt buộc):
    1.  **Số tháng (Total Months):** Input Number.
    2.  **Ngày Bắt Đầu (Start Date):** Date Picker. _Quan trọng: Dùng ngày này để tính lịch sử._
    3.  **Số tiền trả mỗi tháng (Monthly Payment):** Input Number. (Có thể làm nút "Tự động tính" = Total / Months).
    4.  **Ngày trả định kỳ:** Input Number (1-31). (Tự động fill từ ngày (Day) của Start Date).

### 4.2. Màn Hình Chỉnh Sửa (Edit Debt Form)

- **Logic Disable (Quan trọng):**
  - Nếu khoản nợ đang là trả góp (`isInstallment === 1`), **VÔ HIỆU HÓA (Read-only/Disabled)** các trường:
    - `Total Months`
    - `Start Date`
    - `Toggle Trả Góp`
  - _Lý do:_ Không được thay đổi cấu trúc trả góp khi đã bắt đầu chu trình, để tránh sai lệch lịch sử.
- **Cho phép sửa:** `Tên`, `Ghi chú`, `Ngày trả định kỳ` (paymentDate - chỉ ảnh hưởng nhắc nợ tháng sau), `Monthly Payment` (ảnh hưởng kỳ sau).

### 4.3. Màn Hình Chi Tiết Khoản Nợ (Debt Detail View)

Chia làm 2 phần chính:

**A. Tổng Quan (Header Card)**

- Hiển thị **Tiến độ**: Thanh Progress Bar (Paid Months / Total Months).
- Thống kê: "Đã trả: X tháng" | "Còn lại: Y tháng".
- Số tiền: "Còn nợ: [remainingAmount]" (Nổi bật).

**B. Lịch Trả Nợ (Installment Schedule)**

- **Phần 1: Lịch Sử (History List)**
  - Danh sách các kỳ có trạng thái `PAID`.
  - UI: Dạng Timeline hoặc List xám (nhạt hơn).
  - Nội dung: "Kỳ [i]: [Amount] - Đã trả ngày [paidAt]".

- **Phần 2: Kỳ Hiện Tại (Current/Next Period) - QUAN TRỌNG NHẤT**
  - Hiển thị dạng Card nổi bật (Highlight Color).
  - Tiêu đề: **"Kỳ Thanh Toán Tiếp Theo (Kỳ [paidMonths + 1])"**.
  - Thông tin:
    - Hạn trả: [dueDate].
    - Số tiền: [amount].
  - **Nút Hành Động (Action Button):**
    - Nút **"THANH TOÁN KỲ NÀY"** (Pay Installment).
    - Khi bấm -> Mở Modal "Chọn Ví Thanh Toán".

### 4.4. Modal Thanh Toán (Pay Modal)

- Tiêu đề: "Thanh toán cho [PartnerName] - Kỳ [i]".
- Số tiền: [Amount] (Read-only).
- **Chọn Ví (Source Wallet):** Dropdown danh sách ví.
  - Hiển thị số dư khả dụng của từng ví.
- **Nút Confirm:** "Xác nhận trả".
  - _Sau khi trả thành công:_ UI tự động reload, kỳ hiện tại bay vào "Lịch sử", kỳ tiếp theo (nếu còn) sẽ hiện ra.

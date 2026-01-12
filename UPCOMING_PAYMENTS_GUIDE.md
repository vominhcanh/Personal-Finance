# 📊 Hướng Dẫn Tích Hợp Widget "Upcoming Payments" (Sắp Đến Hạn)

Tài liệu này mô tả chi tiết dữ liệu trả về và cách hiển thị cho API `GET /v1/analytics/upcoming-payments`.

## 1. Mục Đích

API này trả về danh sách tổng hợp các khoản cần thanh toán trong vòng **10 ngày tới**, bao gồm:

1.  **Thẻ Tín Dụng (Credit Card):** Cần đáo hạn/thanh toán dư nợ.
2.  **Khoản Vay (Loan/Debt):** Cần trả kỳ góp hiện tại.

## 2. API Endpoint

- **Method:** `GET`
- **URL:** `/v1/analytics/upcoming-payments`
- **Auth:** Required (Bearer Token)

## 3. Cấu Trúc Response (JSON)

API trả về một mảng `data` chứa các object. Frontend cần dựa vào trường `type` để render UI phù hợp.

```json
{
  "status": "success",
  "data": [
    // TYPE A: THẺ TÍN DỤNG (Credit Card)
    {
      "type": "CREDIT_CARD",
      "name": "VIB Super Card", // Tên ví
      "amount": 15000000, // Dư nợ hiện tại (Outstanding Balance)
      "dueDate": "2024-01-20T00:00:00Z", // Ngày hạn thanh toán
      "daysRemaining": 5, // Số ngày còn lại
      "alertLevel": "ORANGE", // Mức độ cảnh báo: RED | ORANGE | YELLOW
      "walletId": "65ab..." // ID ví để gọi API Pay Statement
    },

    // TYPE B: KHOẢN VAY (LOAN)
    {
      "type": "LOAN",
      "name": "Mua Macbook", // Tên khoản vay (Partner Name)
      "amount": 2000000, // Số tiền cần trả kỳ này
      "dueDate": "2024-01-22T00:00:00Z",
      "daysRemaining": 7,
      "alertLevel": "YELLOW",
      "debtId": "65cd...", // ID khoản nợ gốc
      "installmentId": "65ef...", // ID kỳ trả góp (Quan trọng để thanh toán)
      "installment": {
        // Thông tin kỳ
        "current": 3,
        "total": 12,
        "display": "3/12"
      }
    }
  ]
}
```

## 4. Hướng Dẫn UI/UX (Frontend Logic)

### 4.1. Logic Hiển Thị Chung

- **Sắp xếp:** Danh sách đã được Backend sort theo `daysRemaining` (Gấp nhất lên đầu).
- **Màu sắc Alert Level:**
  - `RED` (<= 3 ngày): Màu đỏ đậm, icon cảnh báo gấp.
  - `ORANGE` (<= 7 ngày): Màu cam.
  - `YELLOW` (<= 10 ngày): Màu vàng.

### 4.2. Render Item: Thẻ Tín Dụng (`type: CREDIT_CARD`)

- **Icon:** Thẻ tín dụng.
- **Tiêu đề:** "Đáo hạn thẻ [name]".
- **Số tiền:** Hiển thị `amount` (Dư nợ).
- **Nút Hành Động:** "Thanh Toán" (hoặc "Đáo Hạn").
  - _Action:_ Mở Modal **Pay Statement** (Gọi API `POST /wallets/:id/pay-statement`).

### 4.3. Render Item: Khoản Vay (`type: LOAN`)

- **Icon:** Tiền/Nợ.
- **Tiêu đề:** "Trả góp [name] - Kỳ [installment.display]".
- **Số tiền:** Hiển thị `amount` (Tiền góp kỳ này).
- **Nút Hành Động:** "Thanh Toán".
  - _Action:_ Mở Modal **Pay Installment** (Gọi API `POST /debts/pay-installment`).
  - _Payload:_ `{ installmentId: "...", walletId: "..." }`.

---

**Lưu ý:** Sau khi thanh toán thành công, Frontend nên reload lại widget này. Backend sẽ tự động loại bỏ item vừa thanh toán khỏi danh sách (đối với Loan) hoặc cập nhật lại dư nợ (đối với Credit Card).

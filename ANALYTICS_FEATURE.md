# 📈 Analytics Module Documentation

Tài liệu hướng dẫn sử dụng các API thống kê nâng cao (Analytics) và gợi ý hiển thị biểu đồ.

---

## 1. Tổng Quan Dashboard (Monthly Overview)

**Endpoint:** `GET /v1/analytics/monthly-overview`
**Params:** `month=YYYY-MM` (Optional, mặc định tháng hiện tại)

API này cung cấp 4 chỉ số quan trọng nhất cho Dashboard, kèm theo % tăng trưởng so với tháng trước.

### Dữ Liệu Trả Về

```json
{
  "status": "success",
  "data": {
    "stats": {
      "totalWalletBalance": 125000000, // Tổng tài sản (Số dư các ví)
      "totalExpense": 5000000, // Chi tiêu trong tháng
      "netBalance": 2000000, // Dòng tiền thuần (Thu - Chi)
      "totalWallets": 4 // Tổng số lượng ví
    },
    "trends": {
      "totalWalletBalance": 4.8, // +4.8% so với tháng trước
      "totalExpense": 2.5, // +2.5% so với tháng trước
      "netBalance": -1.8, // -1.8% so với tháng trước
      "totalWallets": 0
    }
  }
}
```

### 🎨 Logic Hiển Thị

1.  **Total Wallet Balance (Card 1)**: Màu xanh/đen. Hiển thị tổng tiền hiện có. Trend tính theo tài sản ròng tăng/giảm.
2.  **Total Expense (Card 2)**: Màu đỏ. Hiển thị tổng chi tiêu. Trend dương nghĩa là chi nhiều hơn tháng trước (Cảnh báo).
3.  **Net Balance (Card 3)**: Hiển thị dòng tiền dư. Nếu dương (hơn 0) hiện màu xanh, âm hiện màu đỏ.
4.  **Total Wallets (Card 4)**: Hiển thị số lượng ví.

---

## 2. Biểu Đồ Thu Chi Theo Tháng (Monthly Chart)

**Endpoint:** `GET /v1/analytics/transactions-monthly?month=MM-YYYY`
**Ví dụ:** `/v1/analytics/transactions-monthly?month=01-2026` (Mặc định lấy tháng hiện tại nếu không truyền)

### Dữ Liệu Trả Về

Trả về danh sách các ngày **có phát sinh giao dịch** (có thu hoặc chi). Các ngày không có giao dịch sẽ không xuất hiện trong mảng này.

```json
[
    {
        "day": 1,
        "date": "2026-01-01",
        "income": 0,
        "expense": 500000
    },
    {
        "day": 2,
        "date": "2026-01-02",
        "income": 15000000,
        "expense": 0
    },
    ...
]
```

### 🎨 Gợi Ý Hiển Thị: Biểu Đồ Kết Hợp (Combo Chart)

1.  **Biểu Đồ Đường (Line Chart)**:
    - **Trục X:** Ngày trong tháng (1, 2, 3...).
    - **Line 1 (Xanh lá):** Thu nhập (`income`).
    - **Line 2 (Đỏ):** Chi tiêu (`expense`).
    - Giúp người dùng thấy xu hướng chi tiêu trong tháng.

2.  **Tổng Quan (Summary Cards)**:
    - Tính tổng `income` và `expense` trong mảng trả về để hiển thị 2 số lớn ở trên cùng.
    - "Tổng Thu: 15,000,000" vs "Tổng Chi: 500,000".

---

## 2. Phí Thẻ Tín Dụng (Credit Card Fees)

**Endpoint:** `GET /v1/analytics/credit-card-fees`

### Cách Hoạt Động

- Hệ thống tìm các giao dịch **Chi tiêu (EXPENSE)** có ghi chú chứa chữ **"fee"** (không phân biệt hoa thường).
- Ví dụ nôi dung: "Annual fee", "Late payment fee", "Bank fee".

### Dữ Liệu Trả Về

```json
[
  {
    "_id": null,
    "totalFees": 150000
  }
]
```

Nếu không có dữ liệu, mảng sẽ rỗng.

### 🎨 Gợi Ý Hiển Thị

- Hiển thị một thẻ nhỏ ở mục Thẻ Tín Dụng: "Tổng phí đã trả: 150.000đ".

---

## 3. Cảnh Báo Chi Tiêu (Spending Warning)

**Endpoint:** `GET /v1/analytics/spending-warning`

API trả về phân tích chi tiết về tình hình chi tiêu so với hạn mức, bao gồm dự báo và lời khuyên.

### Dữ Liệu Trả Về (Mới Update)

```json
{
  "currentSpending": 5500000, // Đã chi tiêu thực tế
  "monthlyLimit": 20000000, // Hạn mức
  "percentUsed": 27.5, // % Đã dùng
  "alertLevel": "SAFE", // Mức độ: SAFE | WARNING | URGENT | OVERSPENT | NO_LIMIT

  // --- Các chỉ số nâng cao ---
  "projectedSpending": 21000000, // Dự báo chi tiêu cuối tháng (Dựa trên trung bình ngày + Hóa đơn cố định sắp tới)
  "spendingTrend": 12.5, // Xu hướng: +12.5% so với cùng kỳ tháng trước
  "dailyAverage": 183000, // Trung bình chi mỗi ngày (Current Spend / Current Day)
  "safeDailySpend": 450000, // Số tiền NÊN chi mỗi ngày còn lại để không lố (Đã trừ hóa đơn sắp tới)

  "topCategory": {
    // Mục tiêu tốn tiền nhất
    "name": "Ăn uống",
    "amount": 3000000,
    "percent": 54
  },

  "adviceMessage": "Dự báo bạn sẽ vượt hạn mức khoảng 1.000.000đ. Hãy tiết kiệm chi tiêu ở mục Ăn uống."
}
```

### 🎨 Gợi Ý Hiển Thị

1.  **Doughnut Chart**: Hiển thị `% Used`. Màu sắc thay đổi theo `alertLevel` (Xanh -> Vàng -> Đỏ).
2.  **Thẻ Dự Báo**: "Dự báo cuối tháng: 21.000.000đ" (So sánh với Limit).
3.  **Lời Khuyên (AI Advice)**: Hiển thị `adviceMessage` trong khung nổi bật bên dưới biểu đồ.
4.  **Top Category**: Hiển thị icon và tên danh mục tốn kém nhất.

---

## 4. Xu Hướng Thu Chi (Trend Analysis)

**Endpoint:** `GET /v1/analytics/trend?period=6` (Mặc định 6 tháng)

Trả về dữ liệu so sánh Thu nhập vs Chi tiêu qua các tháng.

```json
[
  { "month": "2023-08", "income": 50000000, "expense": 30000000 },
  { "month": "2023-09", "income": 52000000, "expense": 25000000 }
]
```

---

## 5. Phân Tích Danh Mục (Category Breakdown)

**Endpoint:** `GET /v1/analytics/category-breakdown?month=MM-YYYY`

Trả về danh sách danh mục chi tiêu sắp xếp giảm dần theo số tiền. Dùng để vẽ **Pie Chart**.

```json
[
  { "categoryName": "Ăn uống", "totalAmount": 5000000 },
  { "categoryName": "Thuê nhà", "totalAmount": 4000000 },
  { "categoryName": "Di chuyển", "totalAmount": 1000000 }
]
```

# 📈 Analytics Module Documentation

Tài liệu hướng dẫn sử dụng các API thống kê nâng cao (Analytics) và gợi ý hiển thị biểu đồ.

---

## 1. Biểu Đồ Thu Chi Theo Tháng (Monthly Chart)

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
